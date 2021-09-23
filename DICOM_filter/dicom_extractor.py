# This Python file uses the following encoding: utf-8
import os
import argparse
import threading
import configparser
import logging
# Local modules
from app import encrypt, generate_key
from app.routes import initializeFlaskConfig
from app.routes import app as flaskApp
from app.logger import setup_logger
import app.watcher as watcher

def start_flask(port, host):
    flaskApp.run(debug=False, use_reloader=False, port=port, host=host)

# Crea o sobreescribe los archivos de configuración y termina el programa.
def write_config(overwrite):
    config = configparser.ConfigParser()
    config.read('config.sample.ini')
    if overwrite or not os.path.exists('config.dev.ini'):
        config.write(open('config.dev.ini', 'w'))
        print('Configuration File [config.dev.ini] created.')
    if overwrite or not os.path.exists('config.prod.ini'):
        config.write(open('config.prod.ini', 'w'))
        print('Configuration File [config.prod.ini] created.')

def validate_config():
    config_sample = configparser.ConfigParser()
    config_selected = configparser.ConfigParser()
    config_sample.read('config.sample.ini')
    config_selected.read(os.environ.get('CONFIG'))
    missing_options = []
    removed_options = []
    # Se añaden las opciones faltantes
    for section in config_sample.sections():
        for option in config_sample.options(section):
            if not config_selected.has_option(section, option):
                if not config_selected.has_section(section):
                    config_selected.add_section(section)
                config_selected.set(section, option, config_sample.get(section, option))
                missing_options.append(option)
    # Se eliminan las opciones que se han dejado de utilizar
    for section in config_selected.sections():
        for option in config_selected.options(section):
            if not config_sample.has_option(section, option):
                if not config_sample.has_section(section):
                    config_sample.remove_section(section)
                config_sample.remove_option(section, option)
                removed_options.append(option)
    if missing_options != []:
        with open(os.environ.get('CONFIG'), 'w') as cf:
            config_selected.write(cf)
        print('Selected configuration missing options were added: {0}'.format(missing_options))
    if removed_options != []:
        print('Selected configuration unused options were deleted: {0}'.format(removed_options))
                    


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-oc','--overwrite_config', help='overwrite existing configuration files with sample, program will exit after', action='store_true')
    args = parser.parse_args()
    # Se crea archivo de configuración en caso de que no exista o se queira sobre-escribir
    write_config(args.overwrite_config)
    # Se valida que el archivo de configuración contiene todas las secciones y parametros del config.sample.ini, sino se deben agregar
    validate_config()
    # Leer configuración
    config = configparser.ConfigParser()
    config.read(os.environ.get('CONFIG'))
    if config == []:
        config.read('config.sample.ini')
    # Inicializa loggers
    logger = setup_logger()
    # Leer clave de cifrado, si no existe entonces se crea
    try:
        secret = encrypt.load_secret(config.get('CONFIG', 'secret_path'))
    except FileNotFoundError as e:
        logger.error('Secret key not found.')
        logger.info('Secret key not found. Creating new key...')
        generate_key.generate_key(config.get('CONFIG', 'secret_path'))
    try:
        # Correr Flask en un hilo aparte del programa principal (watcher)
        run_flask_service = config.getboolean('CONFIG','flask_service')
        if run_flask_service:
            initializeFlaskConfig()
            port = config.getint('FLASK','port')
            host = config.get('FLASK','host')
            flask_thread = threading.Thread(target=start_flask, args=(port, host,))
            flask_thread.setDaemon(True)
            flask_thread.start()
        logger.info('Running configuration file: {0}'.format(os.environ.get('CONFIG')))
        # Correr watcher en hilo principal
        w = watcher.Watcher()
        w.run()
    except KeyboardInterrupt:
        logger.info('Watcher finished by user.')
        exit()
    except Exception as e:
        logger.error('Unexpected Exception: {0}'.format(e))
        raise