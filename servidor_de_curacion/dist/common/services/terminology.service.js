"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminologyService = void 0;
const axios_1 = __importDefault(require("axios"));
const tslog_1 = require("tslog");
const log = new tslog_1.Logger();
class TerminologyService {
    constructor() { }
    /**
     * Update the baseUrl of the client
     * @param url
     */
    setUrl(url) {
        this.client = axios_1.default.create({
            baseURL: url
        });
    }
    /**
     * Update terminology algorithm
     * @param algorithm
     */
    setAlgorithm(algorithm) {
        this.algorithm = algorithm;
    }
    /**
     * Verifies Terminology Service CodeSystem endpoint
     */
    verify() {
        return new Promise((resolve, reject) => {
            this.client.get('/CodeSystem/$metadata')
                .then(res => {
                const parameters = res.data;
                if (parameters.resourceType === 'Parameters') {
                    resolve(res);
                }
                else {
                    reject('ERROR.TERMINOLOGY_URL_NOT_VERIFIED');
                }
            })
                .catch(err => reject('ERROR.TERMINOLOGY_URL_NOT_VERIFIED' + ` ${err}`));
        });
    }
    /**
     * Batch translation/lookup of the values according to the source and target system
     * Executes /ConceptMap/$translate operation or /CodeSystem/$lookup if no target is specified
     * Returns batch-response in a bundle
     * @param body
     */
    translateBatch(body) {
        return new Promise((resolve, reject) => {
            const batchResource = {
                resourceType: 'Bundle',
                type: 'batch',
                entry: []
            };
            for (const conceptMap of body) {
                let request;
                const resource = {
                    resourceType: 'Parameters',
                    parameter: []
                };
                if (conceptMap.target) {
                    request = {
                        method: 'POST',
                        url: '/ConceptMap/$translate'
                    };
                    resource.parameter.push({
                        name: 'url',
                        valueUri: this.algorithm
                    }, {
                        name: 'coding',
                        valueCoding: {
                            system: conceptMap.source,
                            code: conceptMap.value
                        }
                    }, {
                        name: 'target',
                        valueUri: conceptMap.target
                    });
                }
                else {
                    request = {
                        method: 'POST',
                        url: '/CodeSystem/$lookup'
                    };
                    resource.parameter.push({
                        valueUri: conceptMap.source,
                        name: 'system'
                    }, {
                        valueCode: conceptMap.value,
                        name: 'code'
                    });
                }
                batchResource.entry.push({
                    resource,
                    request
                });
            }
            this.client.post('', batchResource)
                .then(res => {
                resolve(res.data);
            })
                .catch(err => {
                log.error(err);
                reject(err);
            });
        });
    }
    /**
     * Returns CodeSystem systems
     */
    getCodeSystems() {
        return new Promise((resolve, reject) => {
            this.client.get('/CodeSystem/$metadata')
                .then(res => {
                const parameters = res.data;
                const codeSystemList = [];
                parameters.parameter.forEach((_) => {
                    var _a;
                    if ((_.name === 'system' || _.name === 'organization') && ((_a = _.valueCoding) === null || _a === void 0 ? void 0 : _a.system)) {
                        codeSystemList.push(_.valueCoding.system);
                    }
                });
                resolve(codeSystemList);
            })
                .catch(err => reject(err));
        });
    }
}
exports.TerminologyService = TerminologyService;
//# sourceMappingURL=terminology.service.js.map