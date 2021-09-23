"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationService = void 0;
const fhir_service_1 = require("../../common/services/fhir.service");
const util_1 = require("../../common/utils/util");
const environment_1 = require("../../common/environment");
class EvaluationService {
    constructor() {
        this.savedResourceNumber = 0;
        this.sourceFhirService = new fhir_service_1.FhirService(true);
        this.targetFhirService = new fhir_service_1.FhirService(false);
        this.quasis = [];
        this.riskyQuasis = [];
    }
    setFhirURL(url, isSource) {
        if (isSource) {
            this.sourceFhirService.setUrl(url);
        }
        else {
            this.targetFhirService.setUrl(url);
        }
    }
    generateEquivalenceClasses(type, parameterMappings, typeMappings) {
        this.quasis = type.quasis;
        this.riskyQuasis = [];
        this.quasis.forEach(paths => {
            let [key, i] = [type.resource + '.' + type.profile, 0];
            while (i < paths.length) {
                key += '.' + paths[i++];
            }
            if (parameterMappings[key].name === environment_1.environment.algorithms.PASS_THROUGH.name || parameterMappings[key].name === environment_1.environment.algorithms.GENERALIZATION.name ||
                (parameterMappings[key].name === environment_1.environment.algorithms.SUBSTITUTION.name && !environment_1.environment.primitiveTypes[typeMappings[key]].regex
                    && parameterMappings[key].lengthPreserved)) {
                this.riskyQuasis.push(key);
            }
        });
        return util_1.Utils.groupBy(type.entries, item => {
            const groups = [];
            this.riskyQuasis.forEach(attribute => {
                const paths = attribute.split('.').slice(2);
                const result = util_1.Utils.returnEqClassElements(paths, item.resource, []);
                groups.push(result);
            });
            return groups; // undefined values are considered as the same
        });
    }
    validateEntries(entries) {
        const promises = [];
        return new Promise((resolve, reject) => {
            const bulk = JSON.parse(JSON.stringify(entries)).map(element => element.resource);
            while (bulk.length) {
                promises.push(this.sourceFhirService.validate(bulk.splice(0, 1000)));
            }
            Promise.all(promises).then(res => {
                resolve(res);
            }).catch(err => reject(err));
        });
    }
    saveEntries(deidentificationResults, selectedResources, isSource) {
        const entries = [];
        const selectedResourceNames = selectedResources.map(obj => obj.resource);
        Object.keys(deidentificationResults).forEach(resource => {
            if (selectedResourceNames.includes(resource)) {
                entries.push(...deidentificationResults[resource].entries);
                entries.push(...deidentificationResults[resource].restrictedEntries);
            }
        });
        this.savedResourceNumber = 0;
        const promises = [];
        const request = isSource ? 'PUT' : 'POST';
        const service = isSource ? this.sourceFhirService : this.targetFhirService;
        return new Promise((resolve, reject) => {
            const bulk = JSON.parse(JSON.stringify(entries)).map(element => element.resource);
            this.savedResourceNumber += bulk.length;
            while (bulk.length) {
                promises.push(service.postBatch(bulk.splice(0, 1000), request));
            }
            Promise.all(promises).then(res => {
                resolve(this.savedResourceNumber);
            }).catch(err => {
                reject(err);
            });
        });
    }
}
exports.EvaluationService = EvaluationService;
//# sourceMappingURL=evaluation.service.js.map