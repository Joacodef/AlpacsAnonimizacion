"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeidentificationService = void 0;
const fhir_service_1 = require("../../common/services/fhir.service");
const environment_1 = require("../../common/environment");
const randexp_1 = __importDefault(require("randexp"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const util_1 = require("../../common/utils/util");
const tslog_1 = require("tslog");
const log = new tslog_1.Logger();
class DeidentificationService {
    constructor(typeMappings, parameterMappings, rareValueMappings, requiredElements) {
        this.fhirService = new fhir_service_1.FhirService(true);
        this.typeMappings = JSON.parse(JSON.stringify(typeMappings));
        this.parameterMappings = JSON.parse(JSON.stringify(parameterMappings));
        this.rareValueMappings = JSON.parse(JSON.stringify(rareValueMappings));
        this.requiredElements = JSON.parse(JSON.stringify(requiredElements));
        this.identifiers = [];
        this.quasis = [];
        this.sensitives = [];
        this.riskyQuasis = [];
        this.equivalenceClasses = {};
        this.canBeAnonymizedMore = true;
    }
    getEntries(resource, profile) {
        return new Promise((resolve, reject) => {
            this.fhirService.search('StructureDefinition', { _summary: 'data', base: `${environment_1.environment.hl7}/StructureDefinition/${resource}` }, true)
                .then(res => {
                let query = {};
                if (resource !== profile) { // Not a Base Profile
                    const url = res.data.entry.find(item => item.resource.id === profile).resource.url;
                    query = { _profile: url };
                }
                this.fhirService.search(resource, query, true)
                    .then(response => {
                    resolve({ resource, profile, entries: response.data.entry });
                })
                    .catch(err => {
                    log.error('Error at search resource query');
                    reject(err);
                });
            })
                .catch(err => {
                log.error('Error at search StructureDefinition');
                reject(err);
            });
        });
    }
    deidentify(resource, profile, identifiers, quasis, sensitives, entries, kAnonymityValid, kValue) {
        return new Promise((resolve, reject) => {
            this.identifiers = identifiers;
            this.quasis = quasis;
            this.sensitives = sensitives;
            entries.map(entry => this.changeAttributes(resource + '.' + profile, entry.resource));
            let finalData = [];
            const restrictedEntries = [];
            if (kAnonymityValid) {
                const bulk = JSON.parse(JSON.stringify(entries));
                this.anonymizedData = JSON.parse(JSON.stringify(bulk.splice(0, environment_1.environment.kAnonymityBlockSize)));
                while (this.anonymizedData.length) {
                    [this.identifiers, this.quasis, this.sensitives, this.canBeAnonymizedMore] = [JSON.parse(JSON.stringify(identifiers)),
                        JSON.parse(JSON.stringify(quasis)), JSON.parse(JSON.stringify(sensitives)), true];
                    const filteredBulk = this.makeKAnonymousLDiverse(resource, profile, kValue, this.anonymizedData);
                    const anonymizedBulk = filteredBulk.anonymizedData;
                    finalData.push(...anonymizedBulk);
                    const restrictedBulk = filteredBulk.restrictedEntries;
                    restrictedEntries.push(...restrictedBulk);
                    this.anonymizedData = JSON.parse(JSON.stringify(bulk.splice(0, environment_1.environment.kAnonymityBlockSize)));
                }
            }
            else {
                finalData = entries;
            }
            finalData.forEach(entry => {
                entry.resource.meta.security = [{
                        system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality',
                        code: 'L',
                        display: 'low'
                    }];
            });
            restrictedEntries.forEach(entry => {
                entry.resource.meta.security = [{
                        system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality',
                        code: 'R',
                        display: 'restricted'
                    }];
            });
            resolve({ resource, profile, entries: finalData, quasis, restrictedEntries });
        });
    }
    makeKAnonymousLDiverse(resource, profile, kValue, anonymizedData) {
        const quasiKeys = this.getQuasiKeys(resource, profile);
        const sensKeys = this.getSensitiveKeys(resource, profile);
        const restrictedEntries = [];
        quasiKeys.sort().forEach(quasiKey => {
            const required = this.requiredElements.includes(quasiKey);
            let equivalenceClasses = this.generateEquivalenceClasses(resource, quasiKey, anonymizedData);
            while (this.canBeAnonymizedMore) {
                let parametersChanged = false;
                let eqClassesSmall = false;
                let eqClassesEnough = false;
                equivalenceClasses.forEach(eqClass => {
                    if (eqClass.length < kValue) { // k-anonymity
                        if (!parametersChanged) { // change de-identification parameters to anonymize records more
                            // if parameters are already changed, do not change them until the iteration finishes
                            this.changeParameters(resource, eqClass, quasiKey, required);
                            parametersChanged = true;
                        }
                        // anonymize records more which are not k-anonymous
                        eqClass = eqClass.map(entry => this.changeAttributes(resource + '.' + profile, entry.resource));
                        eqClassesSmall = true;
                    }
                    else if (sensKeys.length) {
                        sensKeys.sort().forEach(sensKey => {
                            // generate equivalence classes for sensitive values to see if l-diversity is satisfied
                            const diversities = this.generateEquivalenceClasses(resource, sensKey, eqClass);
                            if (diversities.length < this.parameterMappings[sensKey].l_diversity) { // l-diversity
                                if (!parametersChanged) { // change de-identification parameters to anonymize records more
                                    // if parameters are already changed, do not change them until the iteration finishes
                                    this.changeParameters(resource, eqClass, quasiKey, required);
                                    parametersChanged = true;
                                }
                                // anonymize records more which are not l-diverse
                                eqClass = eqClass.map(entry => this.changeAttributes(resource + '.' + profile, entry.resource));
                                eqClassesSmall = true;
                            }
                            else {
                                eqClassesEnough = true;
                            }
                        });
                    }
                    else {
                        eqClassesEnough = true;
                    }
                });
                equivalenceClasses = this.generateEquivalenceClasses(resource, quasiKey, anonymizedData);
                anonymizedData = [].concat(...equivalenceClasses);
                if (eqClassesEnough && !eqClassesSmall) {
                    // if all eq classes are large enough, exit loop
                    break;
                }
            }
            const filteredResults = this.handleNonanonymousResources(equivalenceClasses, resource, kValue, sensKeys);
            restrictedEntries.push(...filteredResults.restrictedEntries);
            equivalenceClasses = filteredResults.equivalenceClasses;
            anonymizedData = [].concat(...equivalenceClasses);
        });
        return { anonymizedData, restrictedEntries };
    }
    isDiverseEnough(resource, eqClass, sensKeys) {
        let result = true;
        sensKeys.sort().forEach(sensKey => {
            const diversities = this.generateEquivalenceClasses(resource, sensKey, eqClass);
            if (diversities.length < this.parameterMappings[sensKey].l_diversity) {
                result = false;
            }
        });
        return result;
    }
    getQuasiKeys(resource, profile) {
        const keys = [];
        this.quasis.forEach(paths => {
            let [key, i] = [resource + '.' + profile, 0];
            while (i < paths.length) {
                key += '.' + paths[i++];
            }
            if (this.parameterMappings[key].name === environment_1.environment.algorithms.PASS_THROUGH.name || this.parameterMappings[key].name === environment_1.environment.algorithms.GENERALIZATION.name ||
                (this.parameterMappings[key].name === environment_1.environment.algorithms.SUBSTITUTION.name && !environment_1.environment.primitiveTypes[this.typeMappings[key]].regex
                    && this.parameterMappings[key].lengthPreserved)) {
                keys.push(key);
            }
        });
        return keys;
    }
    getSensitiveKeys(resource, profile) {
        const keys = [];
        this.sensitives.forEach(paths => {
            let [key, i] = [resource + '.' + profile, 0];
            while (i < paths.length) {
                key += '.' + paths[i++];
            }
            if (this.parameterMappings[key].l_diversityValid) {
                keys.push(key);
            }
        });
        return keys;
    }
    changeParameters(resource, eqClass, key, required) {
        const primitiveType = this.typeMappings[key];
        const algorithm = this.parameterMappings[key];
        [this.quasis, this.sensitives, this.identifiers] = [[], [], []];
        switch (algorithm.name) {
            case environment_1.environment.algorithms.PASS_THROUGH.name:
                if (primitiveType === 'boolean') {
                    if (!required) {
                        this.identifiers.push(key.split('.').slice(2));
                    }
                    this.canBeAnonymizedMore = false;
                }
                else if (environment_1.environment.primitiveTypes[primitiveType].supports.includes(environment_1.environment.algorithms.GENERALIZATION.name)) {
                    this.parameterMappings[key] = environment_1.environment.algorithms.GENERALIZATION;
                    this.quasis.push(key.split('.').slice(2));
                }
                else {
                    this.parameterMappings[key] = environment_1.environment.algorithms.SUBSTITUTION;
                    this.quasis.push(key.split('.').slice(2));
                }
                break;
            case environment_1.environment.algorithms.GENERALIZATION.name:
                if (primitiveType === 'decimal') { // Decimal places of the floating number will be rounded
                    if (this.parameterMappings[key].roundDigits) {
                        this.parameterMappings[key].roundDigits--;
                        this.quasis.push(key.split('.').slice(2));
                    }
                    else if (!required) {
                        this.identifiers.push(key.split('.').slice(2));
                        this.canBeAnonymizedMore = false;
                    }
                    else {
                        this.canBeAnonymizedMore = false;
                    }
                }
                else if (primitiveType === 'integer' || primitiveType === 'unsignedInt' || primitiveType === 'positiveInt') { // Last digits of the integer will be rounded
                    const minDigitLength = this.getDigitLength(eqClass[0].resource, key);
                    if (this.parameterMappings[key].roundDigits < minDigitLength - 1) {
                        this.parameterMappings[key].roundDigits++;
                        this.quasis.push(key.split('.').slice(2));
                    }
                    else if (!required) {
                        this.identifiers.push(key.split('.').slice(2));
                        this.canBeAnonymizedMore = false;
                    }
                    else {
                        this.canBeAnonymizedMore = false;
                    }
                }
                else if (primitiveType === 'time') { // HH:mm:ss ['Hours', 'Minutes', 'Seconds'] TO BE ROUNDED
                    if (this.parameterMappings[key].dateUnit === 'Seconds') {
                        this.parameterMappings[key].dateUnit = 'Minutes'; // Generalize data more
                        this.quasis.push(key.split('.').slice(2));
                    }
                    else if (this.parameterMappings[key].dateUnit === 'Minutes') {
                        this.parameterMappings[key].dateUnit = 'Hours'; // Generalize data more
                        this.quasis.push(key.split('.').slice(2));
                    }
                    else if (this.parameterMappings[key].dateUnit === 'Hours' && !required) { // remove attribute
                        this.identifiers.push(key.split('.').slice(2));
                        this.canBeAnonymizedMore = false;
                    }
                    else { // remove entries that not satisfies k-anonymity as F. Prasser, et al. (Record Suppression)
                        this.canBeAnonymizedMore = false;
                    }
                }
                else { // instant YYYY-MM-DDThh:mm:ss.sss+zz:zz ['Years', 'Months', 'Days', 'Hours', 'Minutes'] TO BE ROUNDED
                    // date (YYYY, YYYY-MM, or YYYY-MM-DD) or dateTime (YYYY, YYYY-MM, YYYY-MM-DD or YYYY-MM-DDThh:mm:ss+zz:zz) ['Years', 'Months', 'Days'] TO BE REMOVED
                    if (this.parameterMappings[key].dateUnit === 'Minutes') {
                        this.parameterMappings[key].dateUnit = 'Hours'; // Generalize data more
                        this.quasis.push(key.split('.').slice(2));
                    }
                    else if (this.parameterMappings[key].dateUnit === 'Hours') {
                        this.parameterMappings[key].dateUnit = 'Days'; // Generalize data more
                        this.quasis.push(key.split('.').slice(2));
                    }
                    else if (this.parameterMappings[key].dateUnit === 'Days') {
                        this.parameterMappings[key].dateUnit = 'Months'; // Generalize data more
                        this.quasis.push(key.split('.').slice(2));
                    }
                    else if (this.parameterMappings[key].dateUnit === 'Months') {
                        this.parameterMappings[key].dateUnit = 'Years'; // Generalize data more
                        this.quasis.push(key.split('.').slice(2));
                    }
                    else if (this.parameterMappings[key].dateUnit === 'Years' && !required) { // remove attribute
                        this.identifiers.push(key.split('.').slice(2));
                        this.canBeAnonymizedMore = false;
                    }
                    else { // remove entries that not satisfies k-anonymity as F. Prasser, et al. (Record Suppression)
                        this.canBeAnonymizedMore = false;
                    }
                }
                break;
            case environment_1.environment.algorithms.SUBSTITUTION.name: // data with regex is already filtered
                if (algorithm.lengthPreserved) { // anonymize again with fixed length
                    this.parameterMappings[key] = environment_1.environment.algorithms.SUBSTITUTION;
                    this.parameterMappings[key].lengthPreserved = false;
                    this.quasis.push(key.split('.').slice(2));
                }
                else if (!required) { // remove attribute
                    this.identifiers.push(key.split('.').slice(2));
                    this.canBeAnonymizedMore = false;
                }
                else { // remove entries that not satisfies k-anonymity as F. Prasser, et al. (Record Suppression)
                    this.canBeAnonymizedMore = false;
                }
                break;
        }
    }
    generateEquivalenceClasses(resource, key, entries) {
        const equivalenceClasses = util_1.Utils.groupBy(entries, item => {
            const groups = [];
            const result = util_1.Utils.returnEqClassElements(key.split('.').slice(2), item.resource, []);
            groups.push(result);
            return groups; // undefined values are considered as the same
        });
        equivalenceClasses.sort((a, b) => {
            const element1 = util_1.Utils.returnEqClassElements(key.split('.').slice(2), a[0].resource, []);
            const element2 = util_1.Utils.returnEqClassElements(key.split('.').slice(2), b[0].resource, []);
            return this.sortFunction(element1, element2, key);
        });
        return equivalenceClasses;
    }
    sortFunction(element1, element2, key) {
        if (element1 === undefined) {
            return 1;
        }
        else if (element2 === undefined) {
            return -1;
        }
        switch (this.typeMappings[key]) {
            case 'instant':
                const [dates1, times1] = element1.split('T');
                const [year1, month1, day1] = dates1.split('-');
                const [hour1, minute1, second1] = times1.split(':');
                element1 = new Date(+year1, +month1 - 1, +day1, +hour1, +minute1, +second1.substring(0, 2));
                const [dates2, times2] = element2.split('T');
                const [year2, month2, day2] = dates2.split('-');
                const [hour2, minute2, second2] = times2.split(':');
                element2 = new Date(+year2, +month2 - 1, +day2, +hour2, +minute2, +second2.substring(0, 2));
                break;
            case 'date':
            case 'dateTime':
                const [tempYear1, tempMonth1, tempDay1] = element1.split('-');
                element1 = new Date(+tempYear1, tempMonth1 ? +tempMonth1 - 1 : 0, tempDay1 ? +tempDay1 : 1);
                const [tempYear2, tempMonth2, tempDay2] = element2.split('-');
                element2 = new Date(+tempYear2, tempMonth2 ? +tempMonth2 - 1 : 0, tempDay2 ? +tempDay2 : 1);
                break;
            case 'time':
                element1 = moment_timezone_1.default(element1, 'HH:mm:ss').toDate();
                element2 = moment_timezone_1.default(element2, 'HH:mm:ss').toDate();
                break;
        }
        if (element1 < element2) {
            return -1;
        }
        else if (element1 > element2) {
            return 1;
        }
        return 0;
    }
    changeAttributes(prefix, attributes) {
        this.quasis.forEach(paths => {
            let key = prefix;
            let attribute = attributes;
            let i = 0;
            while (i < paths.length && attribute) {
                key += '.' + paths[i];
                attribute = this.handleQuasis(key, attribute, paths, i++, paths.length - 1);
            }
        });
        this.sensitives.forEach(paths => {
            let key = prefix;
            let attribute = attributes;
            let i = 0;
            while (i < paths.length && attribute) {
                key += '.' + paths[i];
                attribute = this.handleSensitives(key, attribute, paths, i++, paths.length - 1);
            }
        });
        this.identifiers.forEach(paths => {
            let key = prefix;
            let attribute = attributes;
            let i = 0;
            while (i < paths.length && attribute) {
                key += '.' + paths[i];
                attribute = this.removeIdentifiers(key, attribute, paths, i++, paths.length - 1);
            }
        });
        return this.clearResource(attributes);
    }
    removeIdentifiers(key, attribute, paths, index, end) {
        if (attribute[paths[index]] && util_1.Utils.isArray(attribute[paths[index]])) { // array
            const len = attribute[paths[index]].length;
            for (let i = 0; i < len; i++) {
                const elem = attribute[paths[index]][i];
                if (paths[index + 1]) { // objects in array
                    attribute[paths[index]][i] = this.removeIdentifiers(key + '.' + paths[index + 1], elem, paths.slice(1), index, end - 1);
                }
                else { // primitives in array
                    delete attribute[paths[index]];
                }
            }
        }
        else if (index === end && attribute[paths[index]]) { // primitives/leaves
            delete attribute[paths[index]];
        }
        else if (attribute[paths[index]]) { // recursively go to leaves
            attribute[paths[index]] = this.removeIdentifiers(key + '.' + paths[index + 1], attribute[paths[index]], paths.slice(1), index, end - 1);
        }
        return attribute;
    }
    handleQuasis(key, attribute, paths, index, end) {
        if (attribute[paths[index]] && util_1.Utils.isArray(attribute[paths[index]])) { // array
            const len = attribute[paths[index]].length;
            for (let i = 0; i < len; i++) {
                const elem = attribute[paths[index]][i];
                if (paths[index + 1]) { // objects in array
                    attribute[paths[index]][i] = this.handleQuasis(key + '.' + paths[index + 1], elem, paths.slice(1), index, end - 1);
                }
                else { // primitives in array
                    attribute[paths[index]][i] = this.executeAlgorithm(key, this.parameterMappings[key], elem, this.typeMappings[key]);
                }
            }
        }
        else if (index === end && attribute[paths[index]]) { // primitives/leaves
            attribute[paths[index]] = this.executeAlgorithm(key, this.parameterMappings[key], attribute[paths[index]], this.typeMappings[key]);
        }
        else if (attribute[paths[index]]) { // recursively go to leaves
            attribute[paths[index]] = this.handleQuasis(key + '.' + paths[index + 1], attribute[paths[index]], paths.slice(1), index, end - 1);
        }
        return attribute;
    }
    handleSensitives(key, attribute, paths, index, end) {
        if (attribute[paths[index]] && util_1.Utils.isArray(attribute[paths[index]])) { // array
            const len = attribute[paths[index]].length;
            for (let i = 0; i < len; i++) {
                const elem = attribute[paths[index]][i];
                if (paths[index + 1]) { // objects in array
                    attribute[paths[index]][i] = this.handleSensitives(key + '.' + paths[index + 1], elem, paths.slice(1), index, end - 1);
                }
                else { // primitives in array
                    if (this.parameterMappings[key].hasRare && this.rareValueMappings[key] && this.rareValueMappings[key].length
                        && (this.rareValueMappings[key].includes(attribute[paths[index]][i])) && this.parameterMappings[key].algorithm.name !== environment_1.environment.algorithms.REPLACE.name) {
                        // de-identify rare value
                        attribute[paths[index]][i] = this.executeAlgorithm(key, this.parameterMappings[key].algorithm, elem, this.typeMappings[key]);
                    }
                    else if (this.parameterMappings[key].hasRare && this.parameterMappings[key].algorithm.name === environment_1.environment.algorithms.REPLACE.name
                        && Object.keys(this.parameterMappings[key].algorithm.replaceValues).includes(attribute[paths[index]][i])) {
                        // replace rare value directly
                        attribute[paths[index]][i] = this.parameterMappings[key].algorithm.replaceValues[attribute[paths[index]][i]];
                    }
                }
            }
        }
        else if (index === end && attribute[paths[index]]) { // primitives/leaves
            if (this.parameterMappings[key].hasRare && this.rareValueMappings[key] && this.rareValueMappings[key].length
                && (this.rareValueMappings[key].includes(attribute[paths[index]])) && this.parameterMappings[key].algorithm.name !== environment_1.environment.algorithms.REPLACE.name) {
                // de-identify rare value
                attribute[paths[index]] = this.executeAlgorithm(key, this.parameterMappings[key].algorithm, attribute[paths[index]], this.typeMappings[key]);
            }
            else if (this.parameterMappings[key].hasRare && this.parameterMappings[key].algorithm.name === environment_1.environment.algorithms.REPLACE.name
                && Object.keys(this.parameterMappings[key].algorithm.replaceValues).includes(attribute[paths[index]])) {
                // replace rare value directly
                attribute[paths[index]] = this.parameterMappings[key].algorithm.replaceValues[attribute[paths[index]]];
            }
        }
        else if (attribute[paths[index]]) { // recursively go to leaves
            attribute[paths[index]] = this.handleSensitives(key + '.' + paths[index + 1], attribute[paths[index]], paths.slice(1), index, end - 1);
        }
        return attribute;
    }
    executeAlgorithm(key, parameters, data, primitiveType) {
        const regex = environment_1.environment.primitiveTypes[primitiveType].regex;
        switch (parameters.name) {
            case environment_1.environment.algorithms.PASS_THROUGH.name:
                break;
            case environment_1.environment.algorithms.REDACTION.name:
                this.identifiers.push(key.split('.').slice(2));
                break;
            case environment_1.environment.algorithms.SUBSTITUTION.name:
                if (regex) {
                    data = new randexp_1.default(regex).gen();
                }
                else {
                    data = new Array(Number(parameters.lengthPreserved ? data.length : parameters.fixedLength) + 1)
                        .join(parameters.substitutionChar);
                }
                break;
            case environment_1.environment.algorithms.RECOVERABLE_SUBSTITUTION.name:
                data = btoa(data); // recover function is atob(data)
                break;
            case environment_1.environment.algorithms.FUZZING.name:
                data += this.getRandomFloat(-parameters.percentage, parameters.percentage);
                if (primitiveType === 'integer') { // A signed integer in the range ???2,147,483,648..2,147,483,647
                    data = Math.round(data);
                }
                else if (primitiveType === 'unsignedInt') { // Any non-negative integer in the range 0..2,147,483,647
                    data = Math.round(Math.abs(data));
                }
                else if (primitiveType === 'positiveInt') { // Any positive integer in the range 1..2,147,483,647
                    data = Math.round(Math.abs(data)) ? Math.round(Math.abs(data)) : 1;
                }
                break;
            case environment_1.environment.algorithms.GENERALIZATION.name:
                if (primitiveType === 'decimal') { // Decimal places of the floating number will be rounded
                    const denary = Math.pow(10, parameters.roundDigits);
                    data = parameters.roundedToFloor ? Math.floor(data * denary) / denary : Math.ceil(data * denary) / denary;
                }
                else if (primitiveType === 'integer' || primitiveType === 'unsignedInt' || primitiveType === 'positiveInt') { // Last digits of the integer will be rounded
                    const denary = Math.pow(10, parameters.roundDigits);
                    data = parameters.roundedToFloor ? Math.floor(data / denary) * denary : Math.ceil(data / denary) * denary;
                }
                else if (primitiveType === 'time') { // HH:mm:ss ['Hours', 'Minutes', 'Seconds'] TO BE ROUNDED
                    let tempDate = moment_timezone_1.default(data, 'HH:mm:ss').toDate();
                    tempDate = this.roundTime(tempDate, parameters.dateUnit);
                    data = moment_timezone_1.default(tempDate).format('HH:mm:ss');
                }
                else if (primitiveType === 'instant') { // YYYY-MM-DDThh:mm:ss.sss+zz:zz ['Years', 'Months', 'Days', 'Hours', 'Minutes'] TO BE ROUNDED
                    const [dates, times] = data.split('T');
                    const [year, month, day] = dates.split('-');
                    const [hour, minute, second] = times.split(':');
                    let tempDate = new Date(+year, +month - 1, +day, +hour, +minute, +second.substring(0, 2));
                    tempDate = this.roundTime(tempDate, parameters.dateUnit);
                    data = moment_timezone_1.default(tempDate).tz(moment_timezone_1.default.tz.guess()).format('YYYY-MM-DDTHH:mm:ss.000Z');
                }
                else { // date (YYYY, YYYY-MM, or YYYY-MM-DD) or dateTime (YYYY, YYYY-MM, YYYY-MM-DD or YYYY-MM-DDThh:mm:ss+zz:zz) ['Years', 'Months', 'Days'] TO BE REMOVED
                    const [year, month, day] = data.split('-');
                    if (!month || parameters.dateUnit === 'Years') {
                        data = year;
                    }
                    else if (parameters.dateUnit === 'Months') {
                        data = year + '-' + month;
                    }
                    else { // parameters.dateUnit === 'Days'
                        if (!day) {
                            data = year + '-' + month;
                        }
                        else {
                            data = year + '-' + month + '-' + day.substring(0, 2);
                        }
                    }
                }
                break;
            case environment_1.environment.algorithms.DATE_SHIFTING.name: // Date will be shifted randomly within a range that you provide
                if (primitiveType === 'time') { // HH:mm:ss ['Hours', 'Minutes', 'Seconds']
                    let tempDate = moment_timezone_1.default(data, 'HH:mm:ss').toDate();
                    tempDate = this.getRandomDate(tempDate, parameters.dateUnit, parameters.range);
                    data = moment_timezone_1.default(tempDate).format('HH:mm:ss');
                }
                else if (primitiveType === 'instant') { // YYYY-MM-DDThh:mm:ss.sss+zz:zz ['Years', 'Months', 'Days', 'Hours', 'Minutes']
                    const [dates, times] = data.split('T');
                    const [year, month, day] = dates.split('-');
                    const [hour, minute, second] = times.split(':');
                    let tempDate = new Date(+year, +month - 1, +day, +hour, +minute, +second.substring(0, 2));
                    tempDate = this.getRandomDate(tempDate, parameters.dateUnit, parameters.range);
                    data = moment_timezone_1.default(tempDate).tz(moment_timezone_1.default.tz.guess()).format('YYYY-MM-DDTHH:mm:ss.000Z');
                }
                else { // date (YYYY, YYYY-MM, or YYYY-MM-DD) or dateTime (YYYY, YYYY-MM, YYYY-MM-DD or YYYY-MM-DDThh:mm:ss+zz:zz) ['Years', 'Months', 'Days']
                    const [year, month, day] = data.split('-');
                    let tempDate = new Date(+year, month ? +month - 1 : 0, day ? +day : 1);
                    tempDate = this.getRandomDate(tempDate, parameters.dateUnit, parameters.range);
                    data = moment_timezone_1.default(tempDate).tz(moment_timezone_1.default.tz.guess()).format(day ? 'YYYY-MM-DD' : (month ? 'YYYY-MM' : 'YYYY'));
                }
                break;
        }
        return data;
    }
    clearResource(attributes) {
        Object.keys(attributes).forEach(key => {
            if (util_1.Utils.isArray(attributes[key])) { // array
                let index = 0;
                for (const elem of attributes[key]) {
                    if (!Object.keys(elem).length) { // empty object
                        attributes[key].splice(index, 1);
                    }
                    else {
                        index++;
                    }
                }
                if (!attributes[key].length) {
                    delete attributes[key];
                }
            }
            else if (typeof attributes[key] === 'object') { // not array and not primitive type. it is object
                attributes[key] = this.clearResource(attributes[key]);
            }
        });
        return attributes;
    }
    roundTime(date, unit) {
        let p = 1;
        switch (unit) {
            case 'Years':
                const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
                const lastDayOfYear = new Date(date.getFullYear(), 11, 31);
                const deltaToFirstDay = Math.abs(date.getTime() - firstDayOfYear.getTime());
                const deltaToLastDay = Math.abs(lastDayOfYear.getTime() - date.getTime());
                if (deltaToFirstDay <= deltaToLastDay) {
                    return firstDayOfYear;
                }
                else {
                    return new Date(date.getFullYear() + 1, 0, 1);
                }
            case 'Months':
                const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
                const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                const deltaToFirst = Math.abs(date.getTime() - firstDayOfMonth.getTime());
                const deltaToLast = Math.abs(lastDayOfMonth.getTime() - date.getTime());
                if (deltaToFirst <= deltaToLast) {
                    return firstDayOfMonth;
                }
                else {
                    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
                }
            case 'Days':
                p = 24 * 60 * 60 * 1000; // milliseconds in a day
                const userOffset = date.getTimezoneOffset() * 60 * 1000; // user's offset time
                return new Date((Math.round(date.getTime() / p) * p) + userOffset); // redefine variable
            case 'Hours':
                p = 60 * 60 * 1000; // milliseconds in an hour
                break;
            case 'Minutes':
                p = 60 * 1000; // milliseconds in a minute
                break;
        }
        return new Date(Math.round(date.getTime() / p) * p);
    }
    getRandomDate(date, unit, range) {
        range = Number(range);
        let [start, end] = [date, date];
        switch (unit) {
            case 'Years':
                start = new Date(date.getFullYear() - range, date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
                end = new Date(date.getFullYear() + range, date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
                break;
            case 'Months':
                start = new Date(date.getFullYear(), date.getMonth() - range, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
                end = new Date(date.getFullYear(), date.getMonth() + range, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
                break;
            case 'Days':
                start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - range, date.getHours(), date.getMinutes(), date.getSeconds());
                end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + range, date.getHours(), date.getMinutes(), date.getSeconds());
                break;
            case 'Hours':
                start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() - range, date.getMinutes(), date.getSeconds());
                end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() + range, date.getMinutes(), date.getSeconds());
                break;
            case 'Minutes':
                start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes() - range, date.getSeconds());
                end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes() + range, date.getSeconds());
                break;
            case 'Seconds':
                start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds() - range);
                end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds() + range);
                break;
        }
        return new Date(Math.round(this.getRandomFloat(start.getTime(), end.getTime())));
    }
    getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    getDigitLength(resource, key) {
        const integer = util_1.Utils.returnEqClassElements(key.split('.').slice(2), resource, []);
        return integer.toString().length;
    }
    handleNonanonymousResources(eqClasses, resource, kValue, sensKeys) {
        const [equivalenceClasses, restrictedClasses] = util_1.Utils.partition(eqClasses, eqClass => (eqClass.length >= kValue && this.isDiverseEnough(resource, eqClass, sensKeys)));
        const restrictedEntries = [].concat(...restrictedClasses);
        return { equivalenceClasses, restrictedEntries };
    }
}
exports.DeidentificationService = DeidentificationService;
//# sourceMappingURL=deidentification.service.js.map