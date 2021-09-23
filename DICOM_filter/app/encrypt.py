# This Python file uses the following encoding: utf-8
import argparse
import logging
# Import from cryptography module, ignore python 2.7 support warning
import warnings
from cryptography.fernet import Fernet

logger = logging.getLogger('root')

# Load secret
def load_secret(secret_path):
    try:
        if secret_path.endswith('.key'):
                secret_file = open(secret_path, "rb").read()
                key, irandom, iv = secret_file.splitlines()
                return key, int(irandom), iv
        else:
            logger.error("Error al leer secret.key, archivo no encontrado.")
    except OSError as err:
        logger.error("OS error: {0}".format(err))
        raise
        
# Encrypt data
def encrypt_data(data, secret):
    key, irandom, iv = secret
    encoded_data = data.encode()
    f = Fernet(key)
    # encrypted_data = f.encrypt(encoded_data)
    encrypted_data = f._encrypt_from_parts(encoded_data, irandom, iv)
    return encrypted_data

# Solo para testear
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--secret_path', help="path where the secret is stored")
    parser.add_argument('--data', help="string data to decrypt")
    args = parser.parse_args()

    try:
        assert args.data is not None and args.secret_path is not None and args.secret_path.endswith('.key')
        secret = load_secret(args.secret_path)
    except AssertionError:
        logger.error("Se debe ingresar un dato y la dirección del secret.key")
        raise

    print(encrypt_data(args.data, secret))