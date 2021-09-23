"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.environment = void 0;
// FHIR Server
const fhir_url_source = 'http://0.0.0.0:8080/fhir';
const fhir_url_target = 'http://0.0.0.0:8080/fhir';
const hl7Base = 'http://hl7.org/fhir';
// Terminology Server
// Reference: https://ontoserver.csiro.au/docs/6/api-fhir-conceptmap.html
const terminology_url = 'https://r4.ontoserver.csiro.au/fhir';
const terminology_algorithm_url = 'http://ontoserver.csiro.au/fhir/ConceptMap/automapstrategy-MML';
exports.environment = {
    server: {
        config: {
            source: {
                baseUrl: fhir_url_source,
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json;charset=UTF-8',
                    'Content-Type': 'application/json;charset=UTF-8'
                }
            },
            target: {
                baseUrl: fhir_url_target,
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json;charset=UTF-8',
                    'Content-Type': 'application/json;charset=UTF-8'
                }
            },
            terminology: {
                url: terminology_url,
                algorithm: terminology_algorithm_url
            }
        },
        compatibleFhirVersions: ['4.0.0', '4.0.1']
    },
    mappingPath: 'C:/Users/joaco/Documents/alpacs-anonimizador/servidor_de_curacion/src/mappings/',
    anonymityMapping: 'mapping_privacy_patient.json',
    DICOMFilter: {
        encrypt: true,
        // hostname: 'localhost',
        // port: '5000',
        baseUrl: 'http://0.0.0.0:5000',
        check_url: '/checkid'
    },
    cronjob: {
        active: true,
        code: "0 3,4 * * *" // Everyday at 3 and 4 AM
    },
    additionalRules: {
        // If false then the 'Organization' resource is not created, instead its searched by the 'name' attribute
        // If true then the resource is created as expected
        postOrganization: false
    },
    // Cache only works with 'ImagingStudy' resource type
    cacheOptions: {
        maxResources: 100,
        onMaxDeleteCount: 50 // Amount of resources deleted when internal resource cache is full
    },
    validationRules: {
        performValidation: false,
        validateBatch: false
    },
    langs: ['en'],
    hl7: hl7Base,
    codesystems: {
        ATC: 'http://www.whocc.no/atc',
        SNOMED: 'http://snomed.info/sct',
        LOINC: 'http://loinc.org',
        ICD_10: 'http://hl7.org/fhir/sid/icd-10'
    },
    datatypes: {
        Address: `${hl7Base}/StructureDefinition/Address`,
        Age: `${hl7Base}/StructureDefinition/Age`,
        Annotation: `${hl7Base}/StructureDefinition/Annotation`,
        Attachment: `${hl7Base}/StructureDefinition/Attachment`,
        CodeableConcept: `${hl7Base}/StructureDefinition/CodeableConcept`,
        Coding: `${hl7Base}/StructureDefinition/Coding`,
        ContactPoint: `${hl7Base}/StructureDefinition/ContactPoint`,
        Count: `${hl7Base}/StructureDefinition/Count`,
        Distance: `${hl7Base}/StructureDefinition/Distance`,
        Dosage: `${hl7Base}/StructureDefinition/Dosage`,
        Duration: `${hl7Base}/StructureDefinition/Duration`,
        Extension: `${hl7Base}/StructureDefinition/Extension`,
        HumanName: `${hl7Base}/StructureDefinition/HumanName`,
        Identifier: `${hl7Base}/StructureDefinition/Identifier`,
        Money: `${hl7Base}/StructureDefinition/Money`,
        Period: `${hl7Base}/StructureDefinition/Period`,
        Quantity: `${hl7Base}/StructureDefinition/Quantity`,
        Range: `${hl7Base}/StructureDefinition/Range`,
        Ratio: `${hl7Base}/StructureDefinition/Ratio`,
        Reference: `${hl7Base}/StructureDefinition/Reference`,
        SampledData: `${hl7Base}/StructureDefinition/SampledData`,
        Signature: `${hl7Base}/StructureDefinition/Signature`,
        Timing: `${hl7Base}/StructureDefinition/Timing`
    },
    resourceTypesToBeFiltered: ['CapabilityStatement', 'CodeSystem', 'ConceptMap', 'NamingSystem', 'OperationDefinition',
        'SearchParameter', 'StructureDefinition', 'ValueSet'],
    attributesToBeFiltered: {
        DomainResource: ['id', 'meta', 'implicitRules', 'language', 'text', 'contained', 'extension', 'modifierExtension'],
        BackboneElement: ['id', 'extension', 'modifierExtension']
    },
    extendibleDataTypes: {
        Address: `${hl7Base}/StructureDefinition/Address`,
        CodeableConcept: `${hl7Base}/StructureDefinition/CodeableConcept`,
        Coding: `${hl7Base}/StructureDefinition/Coding`,
        ContactPoint: `${hl7Base}/StructureDefinition/ContactPoint`,
        HumanName: `${hl7Base}/StructureDefinition/HumanName`,
        Identifier: `${hl7Base}/StructureDefinition/Identifier`
    },
    kAnonymityBlockSize: 100000,
    attributeTypes: {
        ID: 'Identifier',
        QUASI: 'Quasi-identifier',
        SENSITIVE: 'Sensitive',
        INSENSITIVE: 'Insensitive'
    },
    algorithms: {
        PASS_THROUGH: { name: 'Pass Through' },
        SUBSTITUTION: { name: 'Substitution', lengthPreserved: true, fixedLength: 5, substitutionChar: '*' },
        RECOVERABLE_SUBSTITUTION: { name: 'Recoverable Substitution' },
        FUZZING: { name: 'Fuzzing', percentage: 3 },
        GENERALIZATION: { name: 'Generalization', roundedToFloor: true, dateUnit: 'Years', roundDigits: 1 },
        DATE_SHIFTING: { name: 'Date Shifting', dateUnit: 'Months', range: 3 },
        REDACTION: { name: 'Redaction' },
        SENSITIVE: { name: 'Sensitive', hasRare: false, l_diversityValid: false, l_diversity: 2, algorithm: { name: 'Pass Through' } },
        REPLACE: { name: 'Replace', replaceValues: {} } // only for rare values example values: {'HIV': 'Infection'}
    },
    primitiveTypes: {
        boolean: { type: 'boolean', supports: ['Pass Through', 'Redaction'] },
        integer: { type: 'integer', supports: ['Pass Through', 'Redaction', 'Fuzzing', 'Generalization'] },
        string: { type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution', 'Recoverable Substitution', 'Replace'] },
        decimal: { type: 'double', supports: ['Pass Through', 'Redaction', 'Fuzzing', 'Generalization'] },
        uri: { type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution', 'Recoverable Substitution', 'Replace'] },
        url: { type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution', 'Recoverable Substitution', 'Replace'] },
        canonical: { type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution', 'Recoverable Substitution', 'Replace'] },
        base64Binary: { type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution'], regex: '(\\s*([0-9a-zA-Z\\+\\=]){4}\\s*)+' },
        instant: { type: 'string', supports: ['Pass Through', 'Redaction', 'Generalization', 'Date Shifting'], regex: '([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\\.[0-9]+)?(Z|(\\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))' },
        date: { type: 'string', supports: ['Pass Through', 'Redaction', 'Generalization', 'Date Shifting'], regex: '([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?' },
        dateTime: { type: 'string', supports: ['Pass Through', 'Redaction', 'Generalization', 'Date Shifting'], regex: '([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\\.[0-9]+)?(Z|(\\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?' },
        time: { type: 'string', supports: ['Pass Through', 'Redaction', 'Generalization', 'Date Shifting'], regex: '([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\\.[0-9]+)?' },
        code: { type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution', 'Replace'], regex: '[^\\s]+(\\s[^\\s]+)*' },
        oid: { type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution'], regex: 'urn:oid:[0-2](\\.(0|[1-9][0-9]*))+' },
        id: { type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution'], regex: '[A-Za-z0-9\\-\\.]{1,64}' },
        markdown: { type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution'], regex: '\\s*(\\S|\\s)*' },
        unsignedInt: { type: 'integer', supports: ['Pass Through', 'Redaction', 'Fuzzing', 'Generalization'] },
        positiveInt: { type: 'integer', supports: ['Pass Through', 'Redaction', 'Fuzzing', 'Generalization'] },
        uuid: { type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution', 'Recoverable Substitution', 'Replace'] }
    },
    exportableAttributes: ['attributeMappings', 'kAnonymityValidMappings', 'kValueMappings', 'parameterMappings',
        'rareElements', 'rareValueMappings', 'typeMappings'],
    JSON_NUMBER_IN_A_PAGE: 10
};
//# sourceMappingURL=environment.js.map