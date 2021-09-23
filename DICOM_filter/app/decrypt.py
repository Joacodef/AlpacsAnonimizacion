# This Python file uses the following encoding: utf-8
import argparse
import logging
# Import from cryptography module, ignore python 2.7 support warning
import warnings
from cryptography.fernet import Fernet

logger = logging.getLogger('root')

# Load key
def load_key(secret_path):
    if secret_path.endswith('.key'):
        try:
            secret_file = open(secret_path, "rb").read()
            key, _, _ = secret_file.splitlines()
            return key
        except OSError as err:
            logger.error("OS error: {0}".format(err))
            raise
    else:
        logger.error("Error al leer secret.key, archivo no encontrado.")

# Decrypt data
def decrypt_message(data, key):
    f = Fernet(key)
    decrypted_message = f.decrypt(data)
    logger.debug("Decoded data: {0}".format(decrypted_message.decode()))
    return decrypted_message.decode()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--secret_path', help="path where the secret is stored")
    parser.add_argument('--data', help="string data to decrypt")
    args = parser.parse_args()

    try:
        assert args.data is not None or args.secret_path is not None
        secret = load_key(args.secret_path)
    except AssertionError:
        logger.error("Se debe ingresar un dato y una dirección.")
        raise

    d_data = decrypt_message(args.data, secret)
    print("Decoded data: {0}".format(d_data))