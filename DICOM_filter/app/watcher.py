# This Python file uses the following encoding: utf-8
import logging
import os
import time
import configparser
# Local modules
from app.worker import Worker

logger = logging.getLogger('root')

class Watcher:

    def __init__(self):
        config = configparser.ConfigParser()
        config.read(os.environ.get('CONFIG'))
        self.read_timer = config.getint('CONFIG', 'read_timer')
        self.worker = Worker()

    def run(self):
        try:
            while True:
                self.worker.read_files()
                time.sleep(self.read_timer)
        except Exception as e:
            logger.error("Watcher stopped: {0}".format(e))