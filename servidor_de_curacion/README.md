# Curation Server
Componente parte del proceso de pseudo-anonimización de datos clínicos. Implementado en nodejs y express.
Realiza las siguientes tareas:
1.  Generación de recursos FHIR en memoria.
2.  Traducción y/o busqueda de codigos (terminologias).
3.  Creación de recursos FHIR.
4.  De-identificación de recursos FHIR (por medio de k-anonimato) cada cierto tiempo.
La implementación toma como base el codigo generado por el proyecto [FAIR4Health Data Curation & Validation Tool](https://github.com/fair4health/data-curation-tool) y [FAIR4Health Data Privacy Tool](https://github.com/fair4health/data-privacy-tool).
## Como usar
Curation Server puede ser inicializado desde un contenedor (Docker) o de forma manual utilizando nodejs.
### Docker
1. Clonar repositorio
2. Cambiar la configuración de puerto de acceso al servicio en el archivo **docker-compose.yml** en caso de ser necesario.
3. Para iniciar el contenedor se debe utilizar el siguiente comando:
	Docker >=3.2.1
	>docker compose build; docker compose up
	
	Docker <3.2.1
	>docker compose build; docker compose up
	
### Manual
1. Clonar repositorio e instalar Node + npm
2. Instalar dependencias
	>npm install
	
3.  Iniciar servidor
	>npm run start
	
## Configuración
Para cambiar la dirección y puerto de acceso a servidor se deben modificar las variables *ADDRESS* y *PORT* del archivo **src/index.ts**.
En el archivo **src/common/enviroment.ts** se pueden realizar los siguientes cambios:
1. **fhir_url_source**: url de acceso al servidor FHIR en el cual se crean los recursos a partir de los datos recibidos por la API */generate*.
2. **fhir_url_target**: url de acceso al servidor FHIR en el cual se crean los recursos FHIR k-anonimizados, puede ser el mismo especificado en **fhir_url_source**.
3. **terminology_url**: url de acceso al servidor de terminologia al cual se realizan las peticiones de traduccion y/o busqueda de terminos (operaciones *\$translate* y *\$lookup* respectivamente).
4. **terminology_algorithm_url**: url de acceso al algoritmo de mapeo utilizado para realizar las traducciones de una terminologia a otra (solo operacion *\$translate*).
5. **environment**
	-	**mappingPath**: ruta local en la cual se encuentran los archivos de mapeo para la creación automatica y k-anonimato de recursos FHIR.
	-	**anonymityMapping**: nombre del archivo de mapeo utilizado para realizar el k-anonimato de forma automatica cada cierta cantidad de tiempo (solo si *cronjob.active* esta habilitado).
	-	**DICOMFilter**:
		-	**encrypt**: si se debe realizar el cifrado del identificador del paciente, solo es utilizado cuando se quiere generar un paciente a partir de datos que no provengan del proceso de *DICOM Filter* (La opcion *[CONFIG] flask_service* del componente *DICOM Filter* debe estar habilitado).
		-	**baseUrl**: url de acceso a la API del componente *DICOM Filter*.
		-	**check_url**: nombre de la API a la cual se realiza la consulta de cifrado del componente *DICOM Filter*.
	-	**cronjob**:
		-	**active**: si el cronjob de k-anonimato debe estar habilitado.
		-	**code**: codigo cron que especifica cuando se debe realizar el k-anonimato.
	-	**additionalRules**:
		-	**postOrganization**: si el recurso Organization debe ser creado a partir de los datos recibidos (por defecto se espera que dicho recurso se cree de forma manual en el servidor FHIR).
	-	**cacheOptions**:
		-	**maxResources**: maxima cantidad de recursos que pueden ser almacenados en memoria (cache) para evitar realizar consultas al servidor FHIR.
		-	**onMaxDeleteCount**: cantidad de recursos que son eliminado del cache cuando el cache esta al completo.
	-	**validationRules**: 
		-	**performValidation**: si se debe realizar la validación de los recursos antes de ser enviados para ser creados. Por defecto esta deshabilitado ya que este proceso no tiene impacto en el resultado final (si un recurso falla la validación entonces no es enviado a ser creado, pero si el recurso enviado a ser creado no es valido de todas formas se rechaza por lo que es redundante).
		-	**validateBatch**: si la validación se debe realizar en lote (por medio de recurso Bundle) (Opcion no implementada en servidores HAPI FHIR).

## Mapeos
Documentación detallada en [Google Docs](https://docs.google.com/document/d/10qsptMFYhq6F8FTPFMW_hvWYZZ7X7OVYSj4UCGz9-wQ/edit?usp=sharing)

