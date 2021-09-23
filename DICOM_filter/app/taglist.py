# This Python file uses the following encoding: utf-8
import os
import configparser
from ast import literal_eval
# External modules
from pydicom.tag import Tag

class TagList:
    # Listado de tags que contienen información sobre el archivo DICOM y que pueden ser necesarios de mantener
    # OBLIGATORIO
    # File Meta Information debe estar presente en todo archivo DICOM
    meta_tags = 	[
                    (0x0002,0x0000), (0x0002,0x0001), (0x0002,0x0002), (0x0002,0x0003), (0x0002,0x0010), (0x0002,0x0012), (0x0002,0x0013),
                    (0x0020,0x0013), (0x0020,0x000D), (0x0020,0x000E), 
                    (0x0008,0x0008), (0x0008,0x0016), (0x0008,0x0018), (0x0008,0x0020), (0x0008,0x0030), (0x0008,0x0050), (0x0008,0x0090),
                    ]
    # IMPORTANTE
    # Image Attributes, tags que deben estar presentes en objetos DICOM que tengan asociada una imagen
    image_tags = 	[
                    (0x0028,0x0002), (0x0028,0x0004), (0x0028,0x0008), (0x0028,0x0010), (0x0028,0x0011), (0x0028,0x0030), (0x0028,0x0100),
                    (0x0028,0x0101), (0x0028,0x0102), (0x0028,0x0103),
                    ]
    # OPCIONAL
    # Cine Module, tags sobre el playback del video de DICOM
    playback_tags = [
                    (0x0018,0x1244), (0x0018,0x1063), (0x0018,0x1065), (0x0018,0x2142), (0x0018,0x2143), (0x0018,0x2144), (0x0018,0x0040),
                    (0x0018,0x1066), (0x0018,0x1067), (0x0018,0x0072), (0x0018,0x1242), (0x003A,0x0300), (0x003A,0x0301), (0x003A,0x0302),
                    (0x003A,0x0208),
                    ]
    # Listado de tags requeridos por quienes utilizaran el repositorio
    # Tags de datos requeridos (aparte de las imagenes) para analisis
    # Modificaciones de acuerdo a los datos solicitados por equipo de salud
    required_tags = [
                    ]
    # Tag con el id del paciente que se debe guardar con otro valor separado
    patient_id_tag =    [
                        (0x0010,0x0020)
                        ]

    def __init__(self):
        config = configparser.ConfigParser()
        config.read(os.environ.get('CONFIG'))
        maintain_string_list = aslist(config.get('TAGS', 'maintain_list'))
        extract_string_list = aslist(config.get('TAGS','extract_list'))
        maintain_rules_string_list = aslist(config.get('RULES', 'maintain_rules_list'))
        extract_rules_string_list = aslist(config.get('RULES', 'extract_rules_list'))
        extract_tags = []
        maintain_tags = []
        maintain_rules_tags = []
        extract_rules_tags = []
        for tag_string in extract_string_list:
            extract_tags.append(literal_eval(tag_string))
        for tag_string in maintain_string_list:
            maintain_tags.append(literal_eval(tag_string))
        for tag_string in maintain_rules_string_list:
            maintain_rules_tags.append(literal_eval(tag_string))
        for tag_string in extract_rules_string_list:
            extract_rules_tags.append(literal_eval(tag_string))

        self.tag_keep_dict = dict((Tag(tag), None) for tag in set(self.meta_tags + self.image_tags + self.playback_tags + maintain_tags + maintain_rules_tags))
        self.tag_to_extract = dict((Tag(tag), None) for tag in set(self.required_tags + extract_tags + extract_rules_tags))
        self.tag_patient_id_dict = dict((Tag(tag), None) for tag in self.patient_id_tag)
        self.tag_maintain_rules_dict = dict((Tag(tag), None) for tag in maintain_rules_tags)
        self.tag_extract_rules_dict = dict((Tag(tag), None) for tag in extract_rules_tags)


# Ref: https://stackoverflow.com/questions/335695/lists-in-configparser
def aslist_cronly(value):
    if isinstance(value, str):
        value = filter(None, [x.strip() for x in value.splitlines()])
    return list(value)

def aslist(value, flatten=True):
    """ Return a list of strings, separating the input based on newlines
    and, if flatten=True (the default), also split on spaces within
    each line."""
    values = aslist_cronly(value)
    if not flatten:
        return values
    result = []
    for value in values:
        subvalues = value.split()
        result.extend(subvalues)
    return result