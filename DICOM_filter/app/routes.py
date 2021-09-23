import sys
import os
import configparser
# External modules
from flask import request
from app import app
# Local modules
from app import extractor_filter as ef
from app.encrypt import load_secret

config = None
secret_path = None
p_sql_type = None
p_db_name = None
p_db_user = None
p_db_password = None
p_db_config = None
secret = None

def initializeFlaskConfig():
    config = configparser.ConfigParser()
    config.read(os.environ.get('CONFIG'))
    secret_path = config.get('CONFIG','secret_path')

    p_sql_type = config.get('PrivateDB','sql_type')
    p_db_name = config.get('PrivateDB','db_name')
    p_db_user = config.get('PrivateDB','db_user')
    p_db_password = config.get('PrivateDB','db_password')
    p_db_config = { "sql_type": p_sql_type, "db_name": p_db_name, "db_user": p_db_user, "db_password": p_db_password}  

    secret = load_secret(secret_path)

@app.route('/checkid')
def checkid():

    value = request.args.get('value')
    create = False
    if request.args.get('create'):
        create = request.args.get('create').lower() in ['true', '1']
    filter = ef.Filter()
    encrypted_id = filter.encrypt_patient_id(value, create)

    return encrypted_id

# @app.route('/generatekey')
# def generatekey():
    