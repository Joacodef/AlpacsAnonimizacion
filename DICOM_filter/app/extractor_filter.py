# This Python file uses the following encoding: utf-8
import os
import time
import logging
import json
import configparser
# Local modules
from app import taglist
from app import encrypt
from app.database import db_manager
from app.terminology.concept_lookup import get_snomed_eng
# External modules
from dateutil import parser
from pydicom.tag import Tag
from pydicom import dcmread, errors

logger = logging.getLogger('root')

class Filter():
    """
    Class that contains the properties and functions used in the filter of DICOM files.

    Attributes
    ----------
    gender : dict
        dictionary with the mapping of gender from DICOM to HL7 FHIR
    laterality : dict
        dictionary with the mapping of laterality from DICOM to HL7 FHIR

    Methods
    -------
    get_filename_with_extension(self, pathname, append_string='')
        Returns the filename with an appended string

    get_filepath_with_extension(self, pathname, append_string=''):
        Returns the filepath with another extension

    rut_parser(self, rut)
        Returns the parsed rut

    extract_data(self, dicom_raw, tag_list, our_patient_id)
        Returns a dict with the extracted data from the DICOM file
    
    quality_control(self, dicom, json_data, tag_list)
        Returns a dict with the state of compliance with the rules for the DICOM file

    generate_report_serie(self, dicom)
        Returns a dict with the number of instances processed in a serie
    
    encrypt_patient_id(self, value, create=True)
        Returns the encrypted value of a given value

    process_file(self, dicom_raw)
        Return the result of the extraction process

    read_dicom(self, dicom_raw)
        Returns the curated DICOM file, quality control report, instance report, serie report, and serie name
    """
    # Terminology attributes
    gender = {'M': 'male', 'F': 'female', 'O': 'other', '': 'Unknown'} # Gender DICOM to HL7 FHIR mapping
    laterality = {'L': {'code': '419161000', 'display': 'Unilateral left'}, 'R': {'code': '419465000', 'display': 'Unilateral right	'}} # Laterality DICOM to HL7 FHIR mapping

    def __init__(self):
        """ Initializes all class attributes by reading the configuration file
            and the DBManager class (for the encrypted patient data)
        """
        config = configparser.ConfigParser()
        config.read(os.environ.get('CONFIG'))
        self.extract = config.getboolean('CONFIG', 'extract')
        self.online_lookup = config.getboolean('TERMINOLOGY', 'online_lookup')
        self.secret = encrypt.load_secret(config.get('CONFIG', 'secret_path'))
        self.parse_patient_id = config.getboolean('CONFIG', 'parse_patient_id')
        self.inverse_lists = config.getboolean('CONFIG', 'inverse_lists')
        # Cargar configuración de base de datos privada
        db_host = config.get('PrivateDB', 'host')
        db_port = config.get('PrivateDB', 'port')
        sql_type = config.get('PrivateDB', 'sql_type')
        db_name = config.get('PrivateDB', 'db_name')
        db_user = config.get('PrivateDB', 'db_user')
        db_password = config.get('PrivateDB', 'db_password')
        table_name = config.get('PrivateDB', 'table_name')
        db_config = { "create_table": [True], "table_name": [table_name], "db_class": "PrivateDB", "sql_type": sql_type, "db_name": db_name, "db_user": db_user, "db_password": db_password, "host": db_host, "port": db_port }
        try:
            # Ref: http://dicom.nema.org/medical/dicom/current/output/chtml/part16/chapter_L.html#chapter_L
            with open('./app/terminology/DICOM2SNOMEDCT.json') as json_file:
                self.dicom2snomedct_dict = json.load(json_file)
            # Connect to private database
            self.db_manager = db_manager.DBManager(db_config)
        except Exception as e:
            logger.error("Exception at initializing Filter(): {0}".format(e))
            raise

    def get_filename_with_extension(self, pathname, append_string=''):
        return os.path.split(os.path.splitext(pathname)[0])[1] + append_string

    def get_filepath_with_extension(self, pathname, append_string=''):
        return os.path.splitext(pathname)[0] + append_string
    
    def rut_parser(self, rut):
        int_rut = int(''.join(c for c in rut if c.isdigit()))
        last_digit = rut[-1]
        value = 11 - sum([ int(a)*int(b)  for a,b in zip(str(int_rut).zfill(8), '32765432')])%11
        verifier_digit = {10: 'K', 11: '0'}.get(value, str(value))
        if last_digit == verifier_digit:
            return str(int(''.join(c for c in rut[:-1] if c.isdigit())))
        else:
            return str(int_rut)

    def extract_data(self, dicom_raw, tag_list, our_patient_id):
        """ Extracts data from a DICOM object following the tag list dictionary
        Parameters
        ----------
        dicom_raw : DICOM (pydicom module)
            DICOM object
        tag_list : list
            List of tag dictionaries
        our_patient_id : str
            String of the encrypted patient ID
        """
        patient_data = {}
        try:
            patient_data["filename"] = self.get_filename_with_extension(dicom_raw, '')
            patient_data[str(Tag(0x0010, 0x0020))] = our_patient_id
            for tag in tag_list.tag_to_extract:
                tag = Tag(tag)
                exclude = False
                if tag_list.tag_to_extract.get(tag) is not None:
                    vr = tag_list.tag_to_extract[tag].VR
                    value = tag_list.tag_to_extract[tag].value
                    if value:
                        #DICOM Body Part Examined se debe mapear a terminologia SNOMED-CT ref: http://dicom.nema.org/medical/dicom/current/output/chtml/part16/chapter_L.html#chapter_L
                        #si no pertenece a ninguno entonces se omite
                        if tag == Tag(0x0018, 0x0015):
                            value_snomed = self.dicom2snomedct_dict.get(value.upper())
                            if value_snomed: value = value_snomed["code"]
                            elif self.online_lookup:
                                concept = get_snomed_eng(value.lower())
                                if isinstance(concept, list) and concept != []:
                                    value = concept[1]
                                else: exclude = True
                            else: exclude = True
                        #DICOM StudyInstanceUID ref: https://www.ietf.org/rfc/rfc3001.txt
                        elif tag == Tag(0x0020, 0x000D):
                            value = 'urn:oid:' + str(value)
                        #DICOM SOP Class UID ref: http://dicomlookup.com/lookup.asp?sw=Tnumber&q=(0008,0016)
                        elif tag == Tag(0x0008, 0x0016):
                            value = 'urn:oid:' + str(value)
                        #DICOM Laterality ref: http://dicomlookup.com/lookup.asp?sw=Tnumber&q=(0020,0060)
                        elif tag == Tag(0x0020, 0x0060):
                            value = self.laterality.get(value)
                            if not value: exclude = True
                        #DICOM Date (DA) tiene el formato YYYYMMDD y Date Time (DT) YYYY-MM-DDThh:mm:ss.sss+zz:zz por lo que se deben parsear
                        elif vr in ['DA', 'DT', 'TM']:
                            try:
                                if value != '': value = parser.parse(value)
                                else: value = parser.parse("19000101") # Valor por defecto, en caso de la hora se agrega 00:00:00 de forma automática
                            except:
                                exclude = True
                        #DICOM Gender usa codificación ['F', 'M', 'O'] por lo que se debe mapear a la codificación HL7 FHIR ['female','male','other','unknown']
                        elif tag == Tag(0x0010, 0x0040):
                            value = self.gender.get(value)
                            if not value: exclude = True
                    else: exclude = True
                    #Se extrae el valor del DICOM Tag
                    if not exclude:
                        if isinstance(value, str):
                            patient_data[str(tag)] = value
                        else:
                            patient_data[str(tag)] = str(value)
            # logger.debug("Valores de información personal del paciente: {0}".format(patient_data))
        except Exception as e:
            logger.error("Unexpected exception at extract_data(): {0}".format(e))
            raise
        
        return patient_data
        
    # Asegurarse de que los DICOM curados tengan los tags en [RULES] 'maintain_rules_list' de config.ini con valores no nulos
    # y lo mismo para los tags que se envian al servidor de curación especificados en [RULES] 'extract_rules_list'
    def quality_control(self, dicom, json_data, tag_list):
        """ Creates the DICOM's instance report following the tag list dictionary
        Parameters
        ----------
        dicom : DICOM (pydicom module)
            DICOM object
        json_data : str
            Dictionary of the extracted data
        tag_list : list
            List of tag dictionaries
        """
        reportInstance = {
                    'metadata': {
                        'approved': True, 
                        'sent_to_curation': False,
                        'bodypart_translated': False,
                        'patient_id': dicom.get(Tag((0x0010, 0x0020))).value if dicom.get(Tag((0x0010, 0x0020))) else 'Missing', 
                        'study_instance_uid': dicom.get(Tag((0x0020, 0x000D))).value if dicom.get(Tag((0x0020, 0x000D))) else 'Missing', 
                        'series_instance_uid': dicom.get(Tag((0x0020, 0x000E))).value if dicom.get(Tag((0x0020, 0x000E))) else 'Missing', 
                        'sop_instance_uid': dicom.get(Tag((0x0008, 0x0018))).value if dicom.get(Tag((0x0008, 0x0018))) else 'Missing'
                    },
                    'rules': {
                        'Maintain': {}
                    }
                 }
        if not self.inverse_lists:
            for tag in tag_list.tag_maintain_rules_dict:
                tag_element = dicom.get(tag)
                tag = str(tag)
                reportInstance['rules']['Maintain'][tag] = True
                if tag_element is None:
                    reportInstance['rules']['Maintain'][tag] = False
                    reportInstance['metadata']['approved'] = False
                elif (not tag_element.value) or tag_element.VM == 0:
                    reportInstance['rules']['Maintain'][tag] = False
                    reportInstance['metadata']['approved'] = False
            if self.extract:
                reportInstance['rules']['Extract'] = {}
                for tag in tag_list.tag_extract_rules_dict:
                    tag = str(tag)
                    tag_element = json_data.get(tag)
                    reportInstance['rules']['Extract'][tag] = True
                    if tag_element is None or tag_element == '':
                        reportInstance['rules']['Extract'][tag] = False
                        reportInstance['metadata']['approved'] = False
                    if tag == str(Tag(0x0018, 0x0015)):
                        reportInstance['metadata']['bodypart_translated'] = True
        return reportInstance

    def generate_report_serie(self, dicom):
        """ Creates the DICOM's series report
        Parameters
        ----------
        dicom : DICOM (pydicom module)
            DICOM object
        """
        reportSerie = {
           "series_instance_uid": dicom.get(Tag((0x0020, 0x000E))).value,
           "available_instances": [dicom.get(Tag((0x0020, 0x0013))).value],
           "missing_instances": [],
           "correlatives": False
        }
        return reportSerie

    # Limpiar todo excepto imagen/s
    def clear_elements_callback(self, dataset, data_element):
        """ Removes all DataElements from the Dataset, except the image.
        Parameters
        ----------
        dataset : Dataset (pydicom module)
            Dictionary of DICOM Data Elements
        data_element : DataElement (pydicom module)
            DICOM Element
        """
        if data_element.tag != (0x7FE0, 0x0010) and data_element.tag != (0x5000, 0x3000):
            del dataset[data_element.tag]

    def encrypt_patient_id(self, value, create=True):
        """ Encrypts the patient ID if is not found in the Private Database.
        Parameters
        ----------
        value : str
            The value to encrypted
        create : bool
            Flag if the value should be inserted in the Private Database if it doesn't exist
        """
        our_patient_id = None
        if value is not None:
            try:
                value = self.rut_parser(str(value)) if self.parse_patient_id else str(value)
                encrypted_id = str(encrypt.encrypt_data(value, self.secret))
                our_patient_id = self.db_manager.get_ourid(encrypted_id)
                if our_patient_id is None and create:
                    our_patient_id = self.db_manager.get_insert_patientid(encrypted_id)
                    logger.debug("Guardando id del paciente en tabla 'lat'")
                else:
                    our_patient_id = our_patient_id
            except Exception as e:
                logger.error("Unexpected exception at encrypt_patient_id(): {0}".format(e))
                raise
        return str(our_patient_id)

    def process_file(self, dicom_raw):
        """ Changes the DICOM file access permission and calls the read_dicom() function.
        Parameters
        ----------
        dicom_raw : str
            Path of the DICOM file
        """
        if '_curated.dcm' not in dicom_raw:
            start_time = time.time()
            logger.debug("-------------------------------------------")
            logger.debug("Procesando archivo: {0}".format(dicom_raw))
            os.chmod(dicom_raw, 0o777)
            logger.debug("Comenzando anonimización...")
            result = self.read_dicom(dicom_raw)
            total_time = time.time() - start_time
            logger.debug("Terminado en {0} segundos".format(total_time))
        else:
            logger.debug("El archivo ya fue procesado y esta en la misma carpeta: {0}".format(dicom_raw))
        return result

    def read_dicom(self, dicom_raw):
        """ Reads and stores DICOM data following the rules in the configuration files. Then calls the following functions:
            clear_elements_callback(), encrypt_patient_id(), extract_data(), quality_control(), and generate_report_serie().
            Then returns the curated DICOM file, extracted data, instance report, series report and series name
        Parameters
        ----------
        dicom_raw : str
            Path of the DICOM file
        """
        try:
            logger.debug("Leyendo archivo dcm...")
            dicom_file = dcmread(dicom_raw)
            tag_list = taglist.TagList()
            our_patient_id = None
            series = None

            # Se guardan los valores necesarios
            logger.debug("Guardando valores necesarios según taglist.py...")
            for tag in tag_list.tag_keep_dict:
                tag_list.tag_keep_dict[tag] = dicom_file.get(tag)
            for tag in tag_list.tag_to_extract:
                tag_list.tag_to_extract[tag] = dicom_file.get(tag)
            for tag in tag_list.tag_patient_id_dict:
                tag_list.tag_patient_id_dict[tag] = dicom_file.get(tag)
            # RULES TAGS
            for tag in tag_list.tag_maintain_rules_dict:
                tag_list.tag_maintain_rules_dict[tag] = dicom_file.get(tag)
            for tag in tag_list.tag_extract_rules_dict:
                tag_list.tag_extract_rules_dict[tag] = dicom_file.get(tag)
            
            if self.inverse_lists:
                for tag in tag_list.tag_maintain_rules_dict:
                    del dicom_file[tag]
            else:
                # Se elimina todo excepto la imagen/s
                logger.debug("Borrando valores en dicom tags excepto imagenes...")
                dicom_file.walk(self.clear_elements_callback)
                # Se vuelven a colocar los valores guardados
                logger.debug("Restaurando valores requeridos...")
                # Tags obligatorios, no se debe modificar
                for tag in tag_list.tag_keep_dict:
                    if tag_list.tag_keep_dict[tag] is not None:
                        dicom_file.add(tag_list.tag_keep_dict[tag])

            for tag in tag_list.tag_patient_id_dict:
                if tag_list.tag_patient_id_dict[tag] is not None:
                    tag_list.tag_patient_id_dict[tag].value = self.encrypt_patient_id(tag_list.tag_patient_id_dict[tag].value)
                    our_patient_id = tag_list.tag_patient_id_dict[tag].value
                    dicom_file.add(tag_list.tag_patient_id_dict[tag])

            # Se extraen los elementos
            logger.debug("Extrayendo valores de información personal del paciente...")
            json_data = self.extract_data(dicom_raw, tag_list, our_patient_id)

            series = str(dicom_file.get((0x0020,0x000e)).value)
            # Control de calidad, se verifica que los valores correspondientes a los tags en [RULES] son no nulos
            reportInstance = self.quality_control(dicom_file, json_data, tag_list)
            reportSerie = self.generate_report_serie(dicom_file) if reportInstance['metadata']['approved'] else None

            return dicom_file, json_data, reportInstance, reportSerie, series

        except errors.InvalidDicomError:
            logger.debug('No es un archivo DICOM válido: {0}'.format(dicom_raw))
            raise
        except Exception as e:
            logger.error("Unexpected exception at read_dicom(): {0}".format(e))
            raise