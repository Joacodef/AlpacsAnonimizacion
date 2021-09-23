import sys
import app.extractor_filter as ef
from app.encrypt import load_secret

value = sys.argv[1]
secret_path = sys.argv[2]
create = sys.argv[3].lower() in ['true', '1']

filter = ef.Filter()
secret = load_secret(secret_path)
encrypted_id = filter.encrypt_patient_id(value, secret, create)

if encrypted_id is None:
    print('')
else:
    print(encrypted_id)