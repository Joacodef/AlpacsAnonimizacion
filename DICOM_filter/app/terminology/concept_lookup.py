# -*- coding: utf-8 -*-
"""
@author: Fernando Llorens
"""
import logging
from urllib.request import urlopen
from urllib.parse import quote
from google_trans_new import google_translator
from functools import cache
import json

logger = logging.getLogger('root')

@cache
def get_cie9(code):
    url = 'https://clinicaltables.nlm.nih.gov/api/icd9cm_dx/v3/search?terms='
    search = url+code
    try:
        response = urlopen(search).read()
        data = json.loads(response.decode('utf-8'))
        cie9_concept = data[3][0][1].lstrip().split(',')
        cie9_id = data[3][0][0]
    except IndexError:
        return -1
    except Exception:
        return -2
    return [cie9_concept[0], cie9_id]

@cache
def get_snomed(concept):
    baseUrl = 'https://browser.ihtsdotools.org/snowstorm/snomed-ct'
    edition = 'MAIN'
    version = '2021-01-31'
    search = quote(concept)
    url = baseUrl + '/browser/' + edition + '/' + version + '/descriptions?term=' + search + '&limit=50&lang=english&skipTo=0'
    try:
        response = urlopen(url).read()
        data = json.loads(response.decode('utf-8'))
        snomed_diag = data['items'][0]['concept']['fsn']['term']
        snomed_concept_id = data['items'][0]['concept']['conceptId']
        logger.debug(f'Concept: {snomed_diag}, Code: {snomed_concept_id}')
        return [snomed_diag, snomed_concept_id]
    except IndexError:
        return -1
    except Exception:
        return -2

def translate_diag(concept, lang_src='es', lang_tgt='en'):
    translator = google_translator()
    return translator.translate(concept, lang_src=lang_src, lang_tgt=lang_tgt)

def get_snomed_eng(concept):
    # Por alguna razon se agrega un '. ' (punto y espacio) alfinal de la palabra traducida.
    concept = translate_diag(concept).strip('. ')
    return get_snomed(concept)