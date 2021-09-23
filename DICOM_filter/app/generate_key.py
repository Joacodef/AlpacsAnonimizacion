# This Python file uses the following encoding: utf-8
import argparse
import logging
from time import time
from os import urandom
from os.path import join
from cryptography.fernet import Fernet

logger = logging.getLogger('root')

def generate_key(secret_path):
    key = Fernet.generate_key()
    try:
        with open(join(secret_path, "secret.key"), "wb") as key_file:
            string = str(key) + "\n" + str(int(time())) + str("\n") + str(urandom(16))
            key_file.write(string.encode('ascii'))
    except OSError as err:
        logger.error("OS error: {0}".format(err))
        raise

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--secret_path', help="root folder where the secret will be written")
    args = parser.parse_args()

    try:
        assert args.secret_path is not None
    except AssertionError:
        logger.error("Se debe ingresar una contraseña y una dirección.")
        raise
        
    generate_key(args.secret_path)