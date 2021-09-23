"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const resource_generators_1 = __importDefault(require("../common/model/resource-generators"));
const Status_1 = __importDefault(require("../common/Status"));
const environment_1 = require("../common/environment");
const fhir_service_1 = require("../common/services/fhir.service");
const terminology_service_1 = require("../common/services/terminology.service");
const data_table_1 = require("../common/model/data-table");
const fhir_util_1 = require("../common/utils/fhir-util");
const tslog_1 = require("tslog");
const log = new tslog_1.Logger();
class BackgroundEngine {
    constructor() {
        this.CHUNK_SIZE = 1000;
        this.mappingObj = new Map();
        this.transformBatch = [];
    }
    created() {
        const url = environment_1.environment.server.config.source.baseUrl; // + ":" + environment.server.config.port
        this.$fhirService = new fhir_service_1.FhirService(true);
        this.fhirBaseUrl = url;
        this.$fhirService.setUrl(this.fhirBaseUrl);
        this.$terminologyService = new terminology_service_1.TerminologyService();
        this.$terminologyService.setUrl(environment_1.environment.server.config.terminology.url);
        this.$terminologyService.setAlgorithm(environment_1.environment.server.config.terminology.algorithm);
    }
    /**
     * Puts resources into the FHIR Repository
     */
    onTransform(resources) {
        const map = new Map();
        resources.forEach(obj => {
            map.set(obj.resource, obj.data);
        });
        const completeResourceList = [].concat(...resources.map(item => { return item.data; }));
        // Batch upload resources
        // Max capacity CHUNK_SIZE resources
        const len = Math.ceil(completeResourceList.length / this.CHUNK_SIZE);
        const batchPromiseList = [];
        log.debug("Posting data...");
        for (let i = 0, p = Promise.resolve(); i < len; i++) {
            batchPromiseList.push(p.then(() => new Promise((resolveBatch, rejectBatch) => {
                this.$fhirService.prepareResources(completeResourceList.slice(i * this.CHUNK_SIZE, (i + 1) * this.CHUNK_SIZE)).then(newResourceList => {
                    this.$fhirService.postBatch(newResourceList, 'PUT')
                        .then(res => {
                        const bundle = res.data;
                        const outcomeDetails = [];
                        let hasError = false;
                        // Check batch bundle response for errors
                        Promise.all(bundle.entry.map(_ => {
                            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
                            if (!_.resource) {
                                if (((_a = _.response) === null || _a === void 0 ? void 0 : _a.status) === '200 OK' || ((_b = _.response) === null || _b === void 0 ? void 0 : _b.status) === '201 Created') {
                                    outcomeDetails.push({ status: Status_1.default.SUCCESS, resourceType: (_c = _.response.location) === null || _c === void 0 ? void 0 : _c.split('/')[0], message: `Status: ${(_d = _.response) === null || _d === void 0 ? void 0 : _d.status}` });
                                }
                                else {
                                    log.error("Post resource failed.");
                                    log.error((_e = _.response) === null || _e === void 0 ? void 0 : _e.status);
                                    log.error((_f = _.response) === null || _f === void 0 ? void 0 : _f.outcome);
                                    hasError = true;
                                    outcomeDetails.push({ status: Status_1.default.ERROR, resourceType: (_g = _.response.location) === null || _g === void 0 ? void 0 : _g.split('/')[0], message: `${(_h = _.response) === null || _h === void 0 ? void 0 : _h.location} : ${(_j = _.response) === null || _j === void 0 ? void 0 : _j.outcome}` });
                                }
                            }
                            else {
                                log.debug("Post data successful");
                                outcomeDetails.push({ status: Status_1.default.SUCCESS, resourceType: (_k = _.response.location) === null || _k === void 0 ? void 0 : _k.split('/')[0], message: `Status: ${(_l = _.response) === null || _l === void 0 ? void 0 : _l.status}` });
                            }
                        }) || [])
                            .then(() => {
                            if (hasError) {
                                log.error("Some resources were not created.");
                                rejectBatch(outcomeDetails);
                            }
                            else {
                                log.info("Resources created.");
                                resolveBatch(outcomeDetails);
                            }
                        })
                            .catch(err => {
                            log.error("Posting data failed.");
                            rejectBatch(err);
                        });
                    })
                        .catch(err => {
                        log.error("Posting data failed at postBatch.");
                        rejectBatch(err);
                    });
                }).catch(err => {
                    log.error("Posting data failed at prepareResources.");
                    log.error(err);
                });
            }).catch(err => {
                log.error(err);
            })));
        }
        return Promise.all(batchPromiseList)
            .then(res => {
            const concatResult = [].concat.apply([], res);
            const status = !concatResult.length || !!concatResult.find(_ => _.status === Status_1.default.ERROR) ? Status_1.default.ERROR : Status_1.default.SUCCESS;
        });
    }
    // WIP
    validate(mappingJson, reqChunkSize, dataJson) {
        this.transformBatch.length = 0; // EMPTY
        const dataToValidate = this.loadRecord(mappingJson)[0];
        const sheets = dataToValidate.sheets;
        const fileName = dataToValidate.fileName;
        const data = { fileName, sheets };
        // Update chunk size
        this.CHUNK_SIZE = reqChunkSize;
        return new Promise((resolveValidation) => {
            const filePath = data.fileName;
            const conceptMap = new Map();
            data.sheets.reduce((promise, sheet) => promise.then(() => new Promise((resolveSheet, rejectSheet) => {
                const entries = dataJson;
                const sheetRecords = sheet.records;
                // Create resources row by row in entries
                // Start validation operation
                const resources = new Map();
                const bufferResourceList = [];
                const conceptMapList = [];
                Promise.all(entries.map((entry) => {
                    return new Promise((resolveOneRow, rejectOneRow) => {
                        // For each row create buffer resources
                        Promise.all(sheetRecords.map((record) => {
                            return new Promise((resolveRecord, rejectRecord) => {
                                if (!resources.get(record.resource))
                                    resources.set(record.resource, []);
                                const generator = resource_generators_1.default.get(record.resource);
                                const bufferResourceMap = new Map();
                                if (generator) {
                                    Promise.all(record.data.map((sourceData) => {
                                        return new Promise((resolveTargets, rejectTargets) => {
                                            const entryValue = sourceData.defaultValue || entry[sourceData.value];
                                            if (entryValue !== undefined && entryValue !== null && entryValue !== '') {
                                                let value = String(entryValue).trim();
                                                if (sourceData.type === data_table_1.cellType.n) {
                                                    value = value.replace(',', '.');
                                                }
                                                Promise.all(sourceData.target.map((target) => {
                                                    // Buffer Resource creation
                                                    // target.value.substr(target.value.length - 3) === '[x]'
                                                    const key = target.type ? `${target.value}.${target.type}` : target.value;
                                                    bufferResourceMap.set(key, fhir_util_1.FHIRUtil.cleanJSON({
                                                        value,
                                                        sourceType: sourceData.type,
                                                        targetType: target.type,
                                                        fixedUri: target.fixedUri,
                                                        display: undefined
                                                    }));
                                                    if (sourceData.conceptMap && sourceData.conceptMap.source) {
                                                        conceptMapList.push(Object.assign({ value, resourceKey: key }, sourceData.conceptMap));
                                                    }
                                                }))
                                                    .then(() => resolveTargets())
                                                    .catch(() => rejectTargets());
                                            }
                                            else
                                                resolveTargets();
                                        });
                                    }))
                                        .then(() => {
                                        // End of one record
                                        bufferResourceList.push({ resourceType: record.resource, profile: record.profile, data: bufferResourceMap });
                                        resolveRecord();
                                    })
                                        .catch(err => rejectRecord(err));
                                }
                                else {
                                    rejectRecord(`${record.resource} resource couldn't be generated. Generator doesn't exist.`);
                                }
                            });
                        }))
                            .then(() => resolveOneRow())
                            .catch(err => rejectOneRow(err));
                    });
                }))
                    .then(() => {
                    let chunkPromise = Promise.resolve();
                    if (conceptMapList.length) {
                        log.debug("Translating...");
                        const conceptMappingCountPerResource = conceptMapList.length / bufferResourceList.length;
                        chunkPromise = chunkPromise.then(() => {
                            return new Promise((resolveChunk, rejectChunk) => {
                                this.$terminologyService.translateBatch(conceptMapList)
                                    .then((bundle) => {
                                    var _a, _b, _c;
                                    const bundleEntry = bundle.entry;
                                    const bundleEntrySize = bundle.entry.length;
                                    for (let j = 0; j < bundleEntrySize; j++) {
                                        if (bundleEntry[j].response.status === '404') {
                                            log.warn('Translation not found: ' + JSON.stringify(bundleEntry[j].resource, null, 4));
                                        }
                                        else {
                                            const parametersParameters = bundleEntry[j].resource.parameter;
                                            if (((_a = parametersParameters.find(_ => _.name === 'result')) === null || _a === void 0 ? void 0 : _a.valueBoolean) === true) {
                                                const matchConcept = (_c = (_b = parametersParameters.find(_ => _.name === 'match')) === null || _b === void 0 ? void 0 : _b.part) === null || _c === void 0 ? void 0 : _c.find(_ => _.name === 'concept');
                                                if (matchConcept) {
                                                    const key = conceptMapList[j].resourceKey;
                                                    bufferResourceList[(j + 1) / conceptMappingCountPerResource - 1].data.get(key).value = matchConcept.valueCoding.code;
                                                    bufferResourceList[(j + 1) / conceptMappingCountPerResource - 1].data.get(key).fixedUri = matchConcept.valueCoding.system;
                                                    bufferResourceList[(j + 1) / conceptMappingCountPerResource - 1].data.get(key).display = matchConcept.valueCoding.display;
                                                }
                                            }
                                            else if (parametersParameters.find(_ => _.name === 'designation') !== undefined) {
                                                const matchConcept = parametersParameters.find(_ => _.name === 'display');
                                                if (matchConcept) {
                                                    const key = conceptMapList[j].resourceKey;
                                                    bufferResourceList[(j + 1) / conceptMappingCountPerResource - 1].data.get(key).display = matchConcept.valueString;
                                                }
                                            }
                                        }
                                    }
                                    resolveChunk();
                                })
                                    .catch(err => {
                                    log.error('Error while trying to translate: ' + err);
                                    resolveChunk();
                                });
                            });
                        });
                    }
                    chunkPromise.then(() => {
                        // End of translation
                        // Generate resources
                        Promise.all(bufferResourceList.map((bufferResourceDefinition) => {
                            return new Promise(resolve => {
                                const generator = resource_generators_1.default.get(bufferResourceDefinition.resourceType);
                                const currResourceList = resources.get(bufferResourceDefinition.resourceType);
                                generator.generateResource(bufferResourceDefinition.data, bufferResourceDefinition.profile)
                                    .then((res) => {
                                    currResourceList.push(res);
                                    setTimeout(() => { resolve(); }, 0);
                                })
                                    .catch(err => {
                                    setTimeout(() => { resolve(); }, 0);
                                });
                            });
                        }))
                            .then(() => {
                            if (entries.length) {
                                Promise.all(Array.from(resources.keys()).map(resourceType => {
                                    const resourceList = resources.get(resourceType) || [];
                                    const dataTransform = { resource: resourceType, data: resourceList };
                                    const batchPromiseList = [];
                                    if (environment_1.environment.validationRules.performValidation) {
                                        log.debug("Validating...");
                                        return new Promise((resolve, reject) => {
                                            if (environment_1.environment.validationRules.validateBatch) {
                                                // Batch validate resources
                                                // Max capacity CHUNK_SIZE resources
                                                const len = Math.ceil(resourceList.length / this.CHUNK_SIZE);
                                                for (let i = 0, p = Promise.resolve(); i < len; i++) {
                                                    batchPromiseList.push(p.then(() => new Promise((resolveBatch, rejectBatch) => {
                                                        this.$fhirService.validate(resourceList)
                                                            .then(res => {
                                                            const outcomeDetails = [];
                                                            // Check response for errors
                                                            const operationOutcome = res.data;
                                                            let isValidated = true;
                                                            operationOutcome.issue.map(issue => {
                                                                if (issue.severity === 'error' || issue.severity === 'fatal') {
                                                                    isValidated = false;
                                                                    outcomeDetails.push({ status: Status_1.default.ERROR, resourceType, message: `${issue.location} : ${issue.diagnostics}` });
                                                                    log.error(JSON.stringify(outcomeDetails));
                                                                    rejectBatch(outcomeDetails);
                                                                }
                                                            });
                                                            if (isValidated) {
                                                                outcomeDetails.push({ status: Status_1.default.SUCCESS, resourceType, message: `Status: ${res.status}` });
                                                                // console.log(JSON.stringify(outcomeDetails))
                                                                resolveBatch(outcomeDetails);
                                                            }
                                                        })
                                                            .catch(err => {
                                                            rejectBatch(err);
                                                        });
                                                    })));
                                                }
                                            }
                                            else {
                                                // Validate resources one by one, CPU heavy taxing, not recommended
                                                const len = resourceList.length;
                                                for (let i = 0, p = Promise.resolve(); i < len; i++) {
                                                    batchPromiseList.push(p.then(() => new Promise((resolveBatch, rejectBatch) => {
                                                        this.$fhirService.validateResource(resourceList[i])
                                                            .then(res => {
                                                            // console.log('response: ' + JSON.stringify(res.status , null, 4))
                                                            const outcomeDetails = [];
                                                            // Check response for errors
                                                            const operationOutcome = res.data;
                                                            let isValidated = true;
                                                            operationOutcome.issue.map(issue => {
                                                                if (issue.severity === 'error' || issue.severity === 'fatal') {
                                                                    isValidated = false;
                                                                    outcomeDetails.push({ status: Status_1.default.ERROR, resourceType, message: `${issue.location} : ${issue.diagnostics}` });
                                                                    log.error(JSON.stringify(outcomeDetails));
                                                                    rejectBatch(outcomeDetails);
                                                                }
                                                            });
                                                            if (isValidated) {
                                                                outcomeDetails.push({ status: Status_1.default.SUCCESS, resourceType, message: `Status: ${res.status}` });
                                                                // console.log(JSON.stringify(outcomeDetails))
                                                                resolveBatch(outcomeDetails);
                                                            }
                                                        })
                                                            .catch(err => {
                                                            console.error("Validation failed for resource: " + resourceList[i].resourceType);
                                                            // console.error(JSON.stringify(err.message, null, 4))
                                                            rejectBatch(err);
                                                        });
                                                    })));
                                                }
                                            }
                                            Promise.all(batchPromiseList)
                                                .then(res => {
                                                if (res.length) {
                                                    this.transformBatch.push(dataTransform);
                                                    log.info(`Batch process completed for Resource: ${resourceType}`);
                                                    resolve([].concat.apply([], res));
                                                }
                                                else {
                                                    log.info(`There is no ${resourceType} Resource created. See the logs for detailed error information.`);
                                                    reject([{
                                                            status: Status_1.default.ERROR,
                                                            message: `There is no ${resourceType} Resource created. See the logs for detailed error information.`,
                                                            resourceType: 'OperationOutcome'
                                                        }]);
                                                }
                                            })
                                                .catch(err => {
                                                reject(err);
                                            });
                                        }).catch(err => {
                                            log.error(err);
                                        });
                                    }
                                    else {
                                        this.transformBatch.push(dataTransform);
                                        return new Promise((resolve, reject) => { resolve(""); });
                                    }
                                }))
                                    .then((res) => {
                                    resolveSheet();
                                    const outcomeDetails = [].concat.apply([], res);
                                    const status = !outcomeDetails.length || !!outcomeDetails.find(_ => _.status === Status_1.default.ERROR) ? Status_1.default.ERROR : Status_1.default.SUCCESS;
                                })
                                    .catch(err => {
                                    log.error(err);
                                    resolveSheet();
                                });
                            }
                            else {
                                resolveSheet();
                            }
                        })
                            .catch(err => {
                            log.error(err);
                            resolveSheet();
                        });
                    });
                })
                    .catch(err => {
                    log.error(err);
                    resolveSheet();
                });
            })), Promise.resolve())
                .then(() => {
                this.onTransform(this.transformBatch);
                // resolveValidation(this.transformBatch)
                resolveValidation();
            })
                .catch(err => {
                resolveValidation();
            });
        });
    }
    // WIP - ignore
    getMapping(data) {
        const sourceFileList = [data];
        sourceFileList.map((file) => {
            var _a;
            this.mappingObj[file.path] = {};
            const currFile = this.mappingObj[file.path];
            (_a = file.sheets) === null || _a === void 0 ? void 0 : _a.map((sheet) => {
                var _a;
                const columns = (((_a = sheet.headers) === null || _a === void 0 ? void 0 : _a.filter(h => { var _a; return (_a = h.record) === null || _a === void 0 ? void 0 : _a.length; })) || []);
                currFile[sheet.label] = {};
                columns.map((column) => {
                    // const groupIds = column.group ? Object.keys(column.group) : []
                    column.record.map((record) => {
                        if (record.target && record.target.length) {
                            currFile[sheet.label][record.recordId] = [
                                ...(currFile[sheet.label][record.recordId] || []),
                                fhir_util_1.FHIRUtil.cleanJSON({
                                    value: column.value,
                                    type: column.type,
                                    target: record.target,
                                    conceptMap: column.conceptMap,
                                    defaultValue: column.defaultValue
                                })
                            ];
                        }
                    });
                });
                this.mappingObj[file.path] = currFile;
            });
        });
        return this.mappingObj;
    }
    // WIP - ignore
    loadRecord(data) {
        const savedRecords = [];
        this.mappingObj = this.getMapping(data);
        Object.keys(this.mappingObj).map((fileName) => {
            const file = this.mappingObj[fileName];
            const sheets = [];
            Object.keys(file).map((sheetName) => {
                // Obj (key, value) (record, header)
                const sheet = file[sheetName];
                const records = [];
                Object.keys(sheet).map((recordId) => {
                    const record = sheet[recordId];
                    records.push({
                        recordId,
                        resource: record[0].target[0].resource,
                        profile: record[0].target[0].profile,
                        data: record
                    });
                });
                if (records.length)
                    sheets.push({ sheetName, records });
            });
            if (sheets.length)
                savedRecords.push({ fileName, sheets });
        });
        return savedRecords;
    }
}
exports.default = BackgroundEngine;
//# sourceMappingURL=GeneratorEngine.js.map