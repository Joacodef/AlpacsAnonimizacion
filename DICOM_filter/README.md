
# DICOM Filter
Componente parte del proceso de pseudo-anonimización de archivos DICOM. Implementado en Python 3.9.
Realiza las siguientes tareas:
1.  Lectura de archivos DICOM.
2.  Cifrado de identificador de paciente.
3.  Extracción de datos del paciente, del estudio, de la organización y dispositivo utilizado.
4.  Eliminación de datos no utilizados.
5.  Traducción de terminologías (Nema a SNOMED exclusivamente).
6.  Control de calidad sobre datos extraídos y DICOM resultante.
7.  Creación de reportes.
8.  Envio de datos extraidos a API externa (*Curation Server*) para su posterior procesamiento.

## Como usar

DICOM Filter puede ser inicializado desde un contenedor (Docker) o de forma manual utilizando Python.

### Docker

1. Clonar repositorio

2. Cambiar la configuración de volumen y puerto del archivo **docker-compose.yml** en caso de ser necesario.

3. Para inicializar el contenedor se debe utilizar el siguiente comando:
	
	Docker >=3.2.1
	>docker compose build; docker compose up

	Docker <3.2.1

	>docker-compose build; docker-compose up

  

### Manual

  

1. Clonar repositorio y utilizar un ambiente con Python 3.9.5 (puede que funcione con versiones superiores pero no se ha probado)

3. Installar dependencias, requiere [pip](https://pip.pypa.io/en/stable/installing/) (versiones de python >3.4 tienen pip instalado)

> pip install -r requirements.txt

4. Generar llave de cifrado lo cual generará un archivo "secret.key" en la carpeta raíz o en una carpeta definida con el argumento **secret_path**

> python generate_key.py --secret_path=<secret_key_path>

5. Agregar el archivo de configuración a utilizar en las variables de entorno (**config.prod.ini** para producción y **config.dev.ini** para desarrollo)

> export CONFIG=config.prod.ini

Los archivos **config.prod.ini** y **config.dev.ini** se crean automaticamente al inicializar el script por primera vez tomando como base el archivo **config.sample.ini** (nunca utilizarlo ya que esta sujeto a actualizaciones, pero si se le pueden hacer cambios previo a inicializar el script). Una vez que los archivos **config.prod.ini** y **config.dev.ini** son creados el archivo **config.sample.ini** es ignorado.

6. Ejecutar el siguiente script para inicializar

>python dicom_extractor.py

## Base de datos privada

DICOM Filter utiliza una base da datos para almacenar los IDs de los pacientes cifrados para poder ser re-identificados en caso de ser necesario. También se almacenan reportes sobre las instancias y el estado de las series procesadas. Las tablas son creadas de forma automatica si no existen.

Actualmente se tiene soporte para bases de datos **PostgreSQL** y **SQLite3**, SQLite3 es utilizada por defecto y es la preferida para ser utilizada en ambiente de desarrollo, para utilizar PostgreSQL se debe crear la base de datos previamente. Por último se pueden utilizar ambas bases de datos simultaneamente, es decir, PostgreSQL para reportes y SQLite3 para pacientes o viceversa.

La configuración de la base de datos de pacientes se configura en la sección **[PrivateDB]** del archivo de configuración.

La configuración de la base de datos de reportes se configura en la sección **[ReportDB]** del archivo de configuración.

## Decifrado del identificador de un paciente

Actualmente solo existe un método para realizar la re-identificación de pacientes, por medio del siguiente comando:

> python decrypt.py --data=<data_string> --secret_path=<secret_key_path>

  

Para ello es necesario especificar la ruta a la clave secreta previamente generada con el argumento **secret_path**. En el argumento **data** debe ir el ID cifrado del paciente, el cual se encuentra en la base de datos privada.

## Configuración

El archivo de configuración contiene 12 secciones:

  

1. CONFIG

-  **batch_size** (default 32): la maxima cantidad de archivos que pueden entrar a la cola de procesamiento.

-  **extract** (default yes): si se deben extraer datos de los archivos y ser enviados a la API del *Curation Server* para crear recursos FHIR.

-  **keep_inbound** (default no): si se deben crear copias de los archivos procesados (en la carpeta especificada en la sección *[Archive] health_inbound_path*).

-  **debug** (default yes): si se debe mantener un log de mensajes de tipo debug.

-  **wait_series** (default no): si al pasar un cantidad X de tiempo la serie del ultimo archivo procesado es considerado terminado y se crea un archivo *curated.done* en la carpeta de dicha serie.

-  **stash** (default yes): si un archivo procesado no es aprobado por el control de calidad entonces es enviado a una carpeta especial (en la carpeta especificada en la sección *[Archive] health_stashed_path*).

-  **delete_failed_instance** (default no): si un archivo procesado no es aprobado por el control de calidad entonces es eliminado.

-  **delete_failed_series** (default no): si un archivo procesado no es aprobado por el control de calidad entonces es eliminado y la serie completa tambien (si otros archivos de la serie ya fueron procesados entonces tambien son eliminados de la carpeta correspondiente especificada en *[Archive] health_curated_path*).

-  **series_timeout** (default 10): si la opcion **wait_series** esta habilitada entonces se esperan la cantidad de segundos especificados antes de dar por finalizada la serie en caso de no llegar mas archivos.

-  **read_timer** (default 2): tiempo antes de crear otra cola de archivos (de tamaño especificado en **batch_size**)

-  **secret_path**: ruta al archivo con la clave secreta utilizada para cifrar pacientes (debe terminar en **.key*).

-  **flask_service** (default yes): si se debe iniciar un servicio con la API que da acceso a ciertas funciones de DICOM Filter, actualmente existe una sola función llamada */checkid* que es utilizada para verificar y/o crear el ID cifrado de un paciente y es utilziado por el *Curation Server*.

-  **parse_patient_id** (default no): si se debe parsear el ID del paciente (solo si se sabe que el ID es el RUT chileno del paciente).

-  **inverse_lists** (default no): para habilitar el comportamiento inverso de la lista en la sección *[TAGS] maintain_list*, es decir, para utilizarla para definir los atributos del archivo DICOM que deben ser eliminados, y por lo tanto todos los atributos no especificados se mantienen en el archivo DICOM final (no ha sido probado lo suficiente y por lo tanto queda a riesgo del desarrollador).

2. LOG

-  **debug_log_path**: ruta en la cual se debe guardar el archivo de log de nivel debug.

-  **error_log_path**: ruta en la cual se debe guardar el archivo de log de nivel error.

-  **info_log_path**: ruta en la cual se debe guardar el archivo de log de nivel info.

3. TERMINOLOGY

-  **online_lookup** (default yes): si se debe realizar una busqueda online de los terminos que no fueron encontrados en el diccionario local de *nema* a *snomed-ct*.

4. PrivateDB

-  **host**: (solo postgresql) IP de la base de datos.

-  **port**: (solo postgresql) puerto de la base de datos.

-  **sql_type** (default sqlite3): tipo de base de datos SQL utilizada. Puede ser *sqlite3* o *postgresql*

-  **db_name** (default sqlite/tmp_id_db.db): nombre de la base de datos, en sqlite3 se especifica la ruta, en postgresql solo el nombre es suficiente.

-  **db_user**: (solo postgresql) usuario para acceder a la base de datos.

-  **db_password**: (solo postgresql) clave del usuario para acceder a la base de datos.

-  **table_name** (default lat): nombre de la tabla en la cual se guardan los IDs cifrados del paciente.

5. ReportDB:

-  **host**: (solo postgresql) IP de la base de datos.

-  **port**: (solo postgresql) puerto de la base de datos.

-  **sql_type** (default sqlite3): tipo de base de datos SQL utilizada. Puede ser *sqlite3* o *postgresql*

-  **db_name** (default sqlite/tmp_id_db.db): nombre de la base de datos, en sqlite3 se especifica la ruta, en postgresql solo el nombre es suficiente.

-  **db_user**: (solo postgresql) usuario para acceder a la base de datos.

-  **db_password**: (solo postgresql) clave del usuario para acceder a la base de datos.

-  **table_name_instance** (default reportInstance): nombre de la tabla en la cual se guardan los reportes de la instancias procesadas (archivos individuales).

-  **table_name_series** (default reportSerie): nombre de la tabla en la cual se guardan los reportes de las series procesadas (conjunto de archivos correspondiente a una misma serie).

-  **store_report_instance** (default yes): si se deben guardar reportes de instancias procesadas.

-  **store_report_serie** (default yes): si se deben guardar reportes de series procesadas.

6. FLASK

-  **port** (default 5000): puerto de acceso al servicio Flask.

-  **host** (default 0.0.0.0): IP de acceso al servicio Flask.

7. FORMATS

-  **format_n** (default .DCM): formatos que deben tener los archivos para ser procesados. Se debe reemplazar *n* por el número correspondiente.

8. ARCHIVE

-  **health_curated_path** (default /health/curated/): ruta a la carpeta de archivos DICOM curados, es decir, archivos ya procesados.

-  **health_inbound_path** (default/health/inbound/): ruta a la carpeta de archivos DICOM que deben ser procesados.

-  **health_processed_path** (default /health/processed/): ruta a la carpeta en la cual se copian los archivos DICOM procesados (solo si la opcion *[CONFIG] keep_inbound* esta habilitada).

-  **health_stashed_path** (default /health/stashed/): ruta a la carpeta en la cual se mueven los archivos DICOM que no pasan el control de calidad (solo si la opcion *[CONFIG] stash* esta habilitada).

9. API

- **post_data_url**: url a la cual son enviados los datos extraidos de la cola de procesamiento, por defecto se envian a la API del *Curation Server* (solo si la opcion *[CONFIG] extract* esta habilitada).

10. MAPPING

-  **mapping**: nombre del archivo de mapeo que debe ser utilizado para crear recursos FHIR a partir de los datos extraidos. El nombre debe coincidir con alguno de los existentes en el *Curation Server* (en */src/mappings*) (solo si la opcion *[CONFIG] extract* esta habilitada).

11. TAGS

-  **extract_list**: listado de tuplas que especifican los *tags* del archivo DICOM que deben ser extraidos y enviados a **post_data_url**.

-  **maintain_list**: listado de tuplas que especifican los *tags* del archivo DICOM que no se deben borrar, los *tags* no especificados son eliminados del archivo DICOM final a menos que la opcion *[CONFIG] inverse_lists* este habilitada (en dicho caso solo se eliminan los *tags* especificados en esta lista).

12. RULES

-  **extract_rules_list**: listado de tuplas que especifican los *tags* del archivo DICOM que deben ser extraidos y enviados a **post_data_url**y no deben ser nulos para poder ser aprobados por el control de calidad.

-  **maintain_rules_list**: listado de tuplas que especifican los *tags* del archivo DICOM que deben ser mantener en el DICOM final y no deben ser nulos para poder ser aprobados por el control de calidad.

  

## TODO

  

1. Agregar API al microservicio Flask para realizar la re-identificación del paciente de forma remota pero tomando consideraciones de seguridad.

## Consideraciones

1. La opcion *[CONFIG] inverse_lists* no ha sido probado lo suficiente como para ser utilizado en ambiente de producción y por lo tanto se sugiere no habilitarlo.

2. El cifrado del identificador del paciente se hace utilizando **AES-128**, el cual es cifrado simetrico (la clave secreta sirve para cifrar y decifrar). Si se quiere implementar una API para la re-identificación remota del paciente se sugiere realizar aplicar **RSA** para el acceso a la clave **AES**, es decir, hacer uso de ambos lo cual asegura compatibilidad con los datos ya cifrados antes de realizar el cambio.
