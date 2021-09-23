from configparser import ConfigParser
import logging
from logging import handlers
import os

def setup_logger():
    config = ConfigParser()
    config.read(os.environ.get('CONFIG'))
    debug_mode = config.get('CONFIG', 'debug')
    debug_log_path = config.get('LOG', 'debug_log_path')
    error_log_path = config.get('LOG', 'error_log_path')
    info_log_path = config.get('LOG', 'info_log_path')

    # Inicializar logger
    logger = logging.getLogger('root') 
    log_format = logging.Formatter('[%(levelname)s] %(asctime)s - %(message)s')
    logger.setLevel(logging.DEBUG)

    # Handlers
    # DEBUG Handler
    if debug_mode: 
        debug_rfh = handlers.RotatingFileHandler(
                                            debug_log_path,
                                            mode='a',
                                            maxBytes=5*1024*1024,
                                            backupCount=2,
                                            encoding=None,
                                            delay=0
                                            )
        debug_rfh.setFormatter(log_format)
        debug_rfh.setLevel(logging.DEBUG)
        logger.addHandler(debug_rfh)
    # ERROR Handler
    error_rfh = handlers.RotatingFileHandler(
                                        error_log_path,
                                        mode='a',
                                        maxBytes=5*1024*1024,
                                        backupCount=2,
                                        encoding=None,
                                        delay=0
                                        )
    error_rfh.setFormatter(log_format)
    error_rfh.setLevel(logging.ERROR)
    logger.addHandler(error_rfh)
    # INFO Handler
    info_rfh = handlers.RotatingFileHandler(
                                        info_log_path,
                                        mode='a',
                                        maxBytes=5*1024*1024,
                                        backupCount=2,
                                        encoding=None,
                                        delay=0
                                        )
    info_rfh.setFormatter(log_format)
    info_rfh.setLevel(logging.INFO)
    logger.addHandler(info_rfh)

    return logger
