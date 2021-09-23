"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DICOMextractor = void 0;
const axios_1 = __importDefault(require("axios"));
const environment_1 = require("./../../common/environment");
const path_1 = require("path");
const tslog_1 = require("tslog");
const log = new tslog_1.Logger();
class DICOMextractor {
    // Check if patient identifier is encrypted, if not it must be encrypted only if the value of 'create' is 'true'
    checkid(entries, data) {
        // 1.- Get mapping key of patient id
        let patient_key;
        entries.fileSourceList[0].sheets[0].headers.forEach((header, headerIndex, headerArray) => {
            if (header.record !== undefined) {
                header.record.forEach(record => {
                    record.target.forEach(target => {
                        if ((target.value === "Patient.identifier") && (target.type === "Identifier.value") ||
                            (target.value === "Observation.subject") && (target.type === "Reference.Patient")) {
                            patient_key = headerArray[headerIndex].value;
                        }
                    });
                });
            }
        });
        // 2.- Replace value of patient id from 'data' according to the mapping
        if (patient_key !== undefined) {
            const promises = [];
            log.silly("dicom url: ", environment_1.environment.DICOMFilter.baseUrl);
            data.forEach((resource, index, thisData) => {
                promises.push(axios_1.default.get(environment_1.environment.DICOMFilter.baseUrl + environment_1.environment.DICOMFilter.check_url, { params: { value: thisData[index][patient_key], create: true },
                    headers: {
                        'Accept': 'application/fhir+json;charset=UTF-8',
                        'Content-Type': 'application/fhir+json;charset=UTF-8'
                    }
                }).then(res => {
                    thisData[index][patient_key] = res.data;
                    log.debug("Checking ID succesful: " + thisData[index][patient_key]);
                    path_1.resolve();
                }).catch(err => {
                    log.error("Error at checking ID: " + err);
                }));
            });
            return Promise.all(promises).then(_ => {
                return new Promise(resolve => resolve(data));
            }).catch(_ => {
                return new Promise(resolve => resolve(data));
            });
        }
    }
}
exports.DICOMextractor = DICOMextractor;
//# sourceMappingURL=dicomextractor.service.js.map