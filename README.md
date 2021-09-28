# Pseudo-anonimizador
Implementación del sistema automatico de pseudo-anonimización de archivos DICOM y datos clinicos para el proyecto FONDEF ALPACS, compuesto por 2 componentes *DICOM Filter* (filtrador DICOM) y *Curation Server* (servidor de curación), ambos capaces de funcionar de forma independiente.

***DICOM Filter*** tiene las siguientes tareas:
1. Lectura de archivos DICOM.

2. Cifrado de identificador de paciente.

3. Extracción de datos del paciente, del estudio, de la organización y dispositivo utilizado.

4. Eliminación de datos no utilizados.

5. Traducción de terminologías (Nema a SNOMED exclusivamente).

6. Control de calidad sobre datos extraídos y DICOM resultante.

7. Creación de reportes.

8. Envio de datos extraidos a API externa (*Curation Server*) para su posterior procesamiento.

***Curation Server*** tiene las siguientes tareas:

1. Generación de recursos FHIR en memoria.

2. Traducción y/o busqueda de codigos (terminologias).

3. Creación de recursos FHIR.

4. De-identificación de recursos FHIR (por medio de k-anonimato) cada cierto tiempo.

## Como usar

Detalles de ejecucion en cada subcarpeta

1. Ejecutar el servidor de curacion en "./servidor_de_curacion"

2. Ejecutar el filtrador DICOM en "./mutilador"

3. Crear mapeo de datos (mapeos y datos de prueba en “./servidor_de_curacion/src/mappings/*.json”)

4. (Para DICOM) Ingresar archivos DICOM a la carpeta "health/inbound"

5. (Para metadata) Ingresar datos por POST Request con Body raw JSON (JSON con datos de prueba en "mapping_DICOM_patient_imagingstudy_device_organization.json") a API "/generate" del servidor de curación.
.
