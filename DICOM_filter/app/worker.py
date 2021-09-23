# This Python file uses the following encoding: utf-8
import os
import argparse
import logging
import traceback
import bisect
from collections import Counter
from logging import handlers
import time
import configparser
from json import dumps, load, loads
from shutil import move, rmtree
from stat import S_IREAD, S_IWUSR
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError
# Local modules
from app.encrypt import load_secret
from app import extractor_filter as ef
from app.database import db_manager

logger = logging.getLogger('root')

class Worker():
    """
    Class with the configuration needed to process a DICOM file

    Attributes
    ----------
    last_file_checked : bool
        a boolean that flags if a series is complete
    last_event_time : int
        the time of the last processed file
    elpased_time : int
        the time elapsed from the last proccesed file
    last_series : str
        series name of the last proccesed file
    banned_series : str
        series name of the last banned file, used to avoid processing instances of the banned series

    Methods
    -------
    remove_empty_folders(self, path, removeRoot=True)
        Removes empty folders from path

    walk_dirs(self, directory, batch_size)
        Yields a batch list of files in a directory

    read_files(self)
        Reads files in batches, then decides next action depending on the configuration and the result of the quality control
        
    send_report(self, reportInstance, reportSerie)
        Sends series and instance report to the database

    finish_series(self, series)
        Adds a file in the folder of to the last finished series

    delete_series(self, series)
        Removes the folder of the series (including all instances)

    stash_file(self, file_name)
        Moves DICOM file to the stash folder

    save_curated(self, dcm_list, files)
        Writes DICOM file in the curated folder

    post_data(self, data_tuple)
        Sends extracted data to the Curation Server through HTTP Protocol

    clear_files(self, files)
        Removes the original DICOM file from inbound folder or moves to processed folder (if keep_inbound is true in the configuration file)

    """
    last_file_checked = False
    last_event_time = time.time()
    elapsed_time = 0
    last_series = None
    banned_series = None

    def __init__(self):
        """ Initializes all class attributes by reading the configuration file
            and the Filter and DBManager classes
        """
        # Cargar archivo de configuración
        config = configparser.ConfigParser()
        config.read(os.environ.get('CONFIG'))
        self.batch_size = config.getint('CONFIG', 'batch_size')
        self.keep_inbound = config.getboolean('CONFIG', 'keep_inbound')
        self.extract = config.getboolean('CONFIG', 'extract')
        self.wait_series = config.getboolean('CONFIG', 'wait_series')
        self.stash = config.getboolean('CONFIG', 'stash')
        self.delete_failed_instance = config.getboolean('CONFIG', 'delete_failed_instance')
        self.delete_failed_series = config.getboolean('CONFIG', 'delete_failed_series')
        self.series_timeout = config.getint('CONFIG', 'series_timeout')
        # Cargar formatos procesables
        pattern_list = []
        for key, value in config.items('FORMATS'):
            pattern_list.append(value)
        self.pattern = tuple(pattern_list)
        # Cargar configuración de base de datos de reportes
        self.store_report_instance = config.getboolean('ReportDB', 'store_report_instance')
        self.store_report_serie = config.getboolean('ReportDB', 'store_report_serie')
        db_host = config.get('ReportDB', 'host')
        db_port = config.get('ReportDB', 'port')
        sql_type = config.get('ReportDB', 'sql_type')
        db_name = config.get('ReportDB', 'db_name')
        db_user = config.get('ReportDB', 'db_user')
        db_password = config.get('ReportDB', 'db_password')
        table_name_instance = config.get('ReportDB', 'table_name_instance')
        table_name_serie = config.get('ReportDB', 'table_name_serie')
        db_config = { "create_table": [self.store_report_instance, self.store_report_serie], "table_name": [table_name_instance, table_name_serie], "db_class": "ReportDB", "sql_type": sql_type, "db_name": db_name, "db_user": db_user, "db_password": db_password, "host": db_host, "port": db_port }   
        # Cargar ruta a carpetas en Archive
        self.health_curated_path = config.get('ARCHIVE', 'health_curated_path')
        self.health_inbound_path =  config.get('ARCHIVE', 'health_inbound_path')
        self.health_processed_path = config.get('ARCHIVE', 'health_processed_path')
        self.health_stashed_path = config.get('ARCHIVE', 'health_stashed_path')
        self.folder_to_watch = self.health_inbound_path
        # Cargar API de servidor de curación
        self.curation_url = config.get('API', 'post_data_url')
        # Cargar nombre del archivo de mapeo
        self.mapping_file = config.get('MAPPING', 'mapping')
        logger.info("Extract: {0}, Keep inbound: {1}, Watch folder: {2}".format(self.extract, self.keep_inbound, self.health_inbound_path))
        # Inicializar Filter
        self.filter = ef.Filter()
        self.db_manager = db_manager.DBManager(db_config)

    # Ref: https://gist.github.com/jacobtomlinson/9031697
    def remove_empty_folders(self, path, removeRoot=True):
        """ Removes empty folders
        Parameters
        ----------
        path : str
            Path of the folder
        removeRoot : bool
            Flag if the root folder should be removed (default is True)
        """
        if not os.path.isdir(path):
            return

        # remove empty subfolders
        files = os.listdir(path)
        if len(files):
            for f in files:
                fullpath = os.path.join(path, f)
                if os.path.isdir(fullpath):
                    self.remove_empty_folders(fullpath)

        # if folder empty, delete it
        files = os.listdir(path)
        if len(files) == 0 and removeRoot:
            os.rmdir(path)
        

    def walk_dirs(self, directory, batch_size):
        """ Return a list of files, the size of the list depends on the batch_size value
        Parameters
        ----------
        directory : str
            Path of the folder
        batch_size : int
            Size of the batch
        """
        walk_dirs_generator = os.walk(directory)
        for dirname, subdirname, filenames in walk_dirs_generator:
            for i in range(0, len(filenames), batch_size):
                yield [os.path.join(dirname, filename) for filename in filenames[i:i+batch_size]]
            # Elimina carpetas vacias, exceptuando la que se esta observando
            if dirname != self.folder_to_watch and len(subdirname) == 0 and len(filenames) == 0:
                os.rmdir(dirname)

    def read_files(self):
        """ Sends the DICOM's filename (obtained from the walk_dirs() function) to the process_file() function of the Filter class, then it calls
            the appropriated functions for the Curated DICOM, Extracted Data, and Reports resulting.
        """
        batch_data = []
        file_name_list = []
        finished_series_list = []
        failed_series_list = []
        reportTuple_list = []
        try:
            file_list = os.listdir(self.folder_to_watch)
            if file_list == []:
                return
            logger.debug('Watcher en carpeta: {0}'.format(self.folder_to_watch))
            logger.debug('Files: {0}'.format(file_list))
            # Si no llegan archivos nuevos se debe marcar la ultima serie como completada por medio del timeout
            if (not self.last_file_checked) and file_list == [] and self.wait_series and self.banned_series != self.last_series:
                self.elapsed_time = time.time() - self.last_event_time
                if self.elapsed_time > self.series_timeout:
                    self.banned_series = None
                    logger.debug("Current series finished by timeout: {0}".format(self.last_series))
                    logger.debug("Adding finish file...")
                    self.finish_series(self.last_series)
                    self.last_file_checked = True
                    self.last_series = None
            elif self.last_file_checked and file_list != []:
                self.last_file_checked = False


            for file_name_batch in self.walk_dirs(self.folder_to_watch, self.batch_size):
                for file_name in file_name_batch:
                    try:
                        if file_name.endswith(self.pattern):
                            dcm, patient_data, reportInstance, reportSerie, series = self.filter.process_file(file_name)
                            current_event_time = time.time()
                            self.elapsed_time = current_event_time - self.last_event_time
                            self.last_event_time = current_event_time

                            if patient_data is not None and reportInstance is not None:
                                # Se envia el reporte a la base de datos
                                logger.info("Report Status: {1} - File: {0}".format(os.path.split(file_name)[1], reportInstance['metadata']['approved']))
                                # self.send_report(reportInstance, reportSerie)
                                reportTuple_list.append((reportInstance, reportSerie))
                                # Se añade instancia al lote a ser post-procesado post_data()
                                if reportInstance['metadata']['approved'] == True and self.banned_series != series:
                                    batch_data.append(tuple((dcm, patient_data)))
                                    file_name_list.append(file_name)
                                else:
                                    # Se almacenan la instancia fallida
                                    if self.stash:
                                        self.stash_file(file_name)
                                    elif self.delete_failed_instance:
                                        self.clear_files([file_name])
                                    failed_series_list.append(series)

                            # Se guardan las series que se han terminado durante el procesamiento de este lote de archivos
                            if self.wait_series and (self.last_series != None and (self.last_series != series or self.elapsed_time > self.series_timeout)):
                                logger.debug("Current series finished: {0}".format(self.last_series))
                                finished_series_list.append(self.last_series)
                                self.banned_series = None
                                self.last_series = series
                            if self.last_series == None: self.last_series = series
                    except Exception as e:
                        logger.error("Unexpected exception reading a file in read_files(): {0}".format(e))
                        raise

                if batch_data != [] and file_name_list != []:
                    response = self.post_data(batch_data)
                    # Envia reportes generados a la base de datos
                    self.send_report(response, reportTuple_list)
                    # Eliminar DICOM original y mover DICOM curado solo si se confirma la recepcion por la API externa
                    if response:
                        dcm_list, _ = map(list, zip(*batch_data))
                        self.save_curated(dcm_list, file_name_list)
                        self.clear_files(file_name_list)
                        # Se elimina la serie completa de la instancia fallida y se previene que nuevas instancias sean post-procesadas
                        if self.delete_failed_series:
                            for failed_series in failed_series_list:
                                self.delete_series(failed_series)
                                self.banned_series = series
                        # Se escribe el archivo .done en la carpeta de las series terminadas durante el lote actual
                        for finished_series in finished_series_list:
                            if not (self.delete_failed_series and self.banned_series == finished_series):
                                logger.debug("Adding finish file...")
                                self.finish_series(finished_series)
                    batch_data = []
                    file_name_list = []
                time.sleep(2)
        except Exception as e:
            logger.error("Unexpected exception at read_files(): {0}".format(e))
            logger.error(traceback.print_exc())
            raise
        finally:
            self.remove_empty_folders(self.folder_to_watch, False)

    def send_report(self, response, reportTuple_list):
        """ The instance report is inserted and the series report is updated. Then sends the report tuple to the DB_Manager Class.
        Parameters
        ----------
        response : bool
            Flag if the extracted data was received by the external API, always True if [CONFIG]extract=no

        reportTuple_list : tuple
            Tuple of reports (reportInstance, reportSerie)
        """
        for reportInstance, reportSerie in reportTuple_list:
            if self.store_report_instance: 
                reportInstance['metadata']['sent_to_curation'] = response
                self.db_manager.insert_report_instance(reportInstance)
            if self.store_report_serie and reportSerie is not None: 
                reportSerie_result = self.db_manager.get_report_serie(reportSerie['series_instance_uid'])
                if reportSerie_result is not None:
                    reportSerie_result = list(reportSerie_result)
                    reportSerie_result[0] = loads(reportSerie_result[0]) if isinstance(reportSerie_result[0], str) else reportSerie_result[0]
                    bisect.insort(reportSerie_result[0], int(reportSerie['available_instances'][0]))
                    reportSerie_result[1] = list((Counter(range(1, reportSerie_result[0][-1])) - Counter(reportSerie_result[0])).elements())
                    reportSerie_result[2] = len(reportSerie_result[1]) == 0
                    updated_reportSerie = {
                        "series_instance_uid": reportSerie['series_instance_uid'],
                        "available_instances": list(set(reportSerie_result[0])),
                        "missing_instances": list(set(reportSerie_result[1])),
                        "correlatives": reportSerie_result[2]
                    }
                    self.db_manager.insert_report_serie(updated_reportSerie)
                else:
                    reportSerie['missing_instances'] = [*range(1, reportSerie['available_instances'][0])]
                    self.db_manager.insert_report_serie(reportSerie)

    def finish_series(self, series):
        """ Adds the 'curated.done' file to the series's folder.
        Parameters
        ----------
        series : str
            Name of the series
        """
        try:
            walk_dirs_generator = os.walk(self.health_curated_path)
            for dirname, subdirname, filenames in walk_dirs_generator:
                if os.path.split(dirname)[1] == series and dirname != self.folder_to_watch:
                    new_file = os.path.join(dirname, 'curated.done')
                    with open(new_file, 'w') as fp:
                        pass
                    logger.info("Terminada series en carpeta {0}: {1}".format(self.health_curated_path, series))
        except Exception as e:
            logger.error("Unexpected exception at finish_series(): {0}".format(e))

    def delete_series(self, series):
        """ Removes all instances of the series in the [ARCHIVE]health_curated_path folder.
        Parameters
        ----------
        series : str
            Name of the series
        """
        try:
            walk_dirs_generator = os.walk(self.health_curated_path, topdown=False)
            for dirname, subdirname, filenames in walk_dirs_generator:
                if os.path.split(dirname)[1] == series and dirname != self.folder_to_watch:
                    rmtree(dirname, ignore_errors=True, onerror=None)
                    logger.info("Eliminada series en carpeta {0}: {1}".format(self.health_curated_path, series))
        except Exception as e:
            logger.error("Unexpected exception at delete_series(): {0}".format(e))

    def stash_file(self, file_name):
        """ Moves file to the [ARCHIVE]health_stashed_path folder.
        Parameters
        ----------
        file_name : str
            Name of the file
        """
        try:
            new_filepath = os.path.normpath(file_name.replace(self.folder_to_watch, self.health_stashed_path))
            path_dicom = self.filter.get_filepath_with_extension(new_filepath, '.dcm')
            if not os.path.exists(os.path.dirname(path_dicom)):
                os.makedirs(os.path.dirname(path_dicom))
            move(file_name, path_dicom)
            os.chmod(path_dicom, S_IWUSR|S_IREAD)
            logger.info("Archivo fallido movido a: {0}".format(path_dicom))
        except Exception as e:
            print("Unexpected exception at stash_file(): {0}".format(e))

    def save_curated(self, dcm_list, files):
        """ Moves multiple files to the [ARCHIVE]health_curated_path folder.
        Parameters
        ----------
        dcm_list : list
            List of DICOM files (full pathname)
        files : list
            List of DICOM filenames
        """
        for index, dcm in enumerate(dcm_list):
            new_filepath = os.path.normpath(files[index].replace(self.folder_to_watch, self.health_curated_path))
            path_dicom_curated = self.filter.get_filepath_with_extension(new_filepath, '_curated.dcm')
            if not os.path.exists(os.path.dirname(path_dicom_curated)):
                os.umask(0)
                os.makedirs(os.path.dirname(path_dicom_curated), 0o777)
            dcm.save_as(path_dicom_curated)
            os.chmod(path_dicom_curated, 0o777)
            logger.debug("Archivo procesado: {0}".format(path_dicom_curated))

    def post_data(self, data_tuple):
        """ Makes POST request to the external API with the extracted data.
        Parameters
        ----------
        data_tuple : tuple
            Tuple of DICOM files and extracted data
        """
        _, data = map(list, zip(*data_tuple))
        if not self.extract:
            return True
        else:
            try:
                data_dict = {}
                data_dict["mapping"] = self.mapping_file
                data_dict["resources"] = data
                # logger.debug("Sending POST request to: {0} with data: {1}".format(self.curation_url, data_dict))
                logger.debug("Sending POST request to: {0}".format(self.curation_url))
                req = Request(
                        self.curation_url, 
                        data=bytes(dumps(data_dict), encoding='utf-8'), 
                        headers={'Content-type': 'application/json'}
                        )
                response = urlopen(req)
                response_message = load(response)["message"]
                logger.debug("Response: {0}".format(response_message))
                return True
            except (HTTPError, URLError) as error:
                logger.error("Error at post_data function: {0}".format(error))
                logger.debug("Error al enviar datos: {0}".format(error))
                logger.debug("Reintentando...")
                return False
            except Exception as e:
                logger.error("Unexpected exception at post_data(): {0}".format(e))
                return False

    def clear_files(self, files):
        """ Removes files.
        Parameters
        ----------
        files : list
            List of files
        """
        if self.keep_inbound:
            for dicom_file in files:
                try:
                    new_filepath = os.path.normpath(dicom_file.replace(self.folder_to_watch, self.health_processed_path))
                    path_dicom_renamed = self.filter.get_filepath_with_extension(new_filepath, '.dcm')
                    if not os.path.exists(os.path.dirname(path_dicom_renamed)):
                        os.makedirs(os.path.dirname(path_dicom_renamed))
                    move(dicom_file, path_dicom_renamed)
                    os.chmod(path_dicom_renamed, S_IWUSR|S_IREAD)
                    logger.debug("Archivo movido: {0}".format(path_dicom_renamed))
                except Exception as e:
                    logger.error("Unexpected exception at clear_files(): {0}".format(e))
        else:
            for dicom_file in files:
                os.remove(dicom_file)