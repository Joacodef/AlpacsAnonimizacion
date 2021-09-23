import axios from 'axios'
import { environment } from './../../common/environment'
import http from 'http';
import { resolve } from 'path';
import { forEach, reject } from 'lodash';
import { Logger } from "tslog";

const log: Logger = new Logger();

export class DICOMextractor {

    // Check if patient identifier is encrypted, if not it must be encrypted only if the value of 'create' is 'true'
    checkid(entries: any, data: any): Promise<any> {
        // 1.- Get mapping key of patient id
        let patient_key
        entries.fileSourceList[0].sheets[0].headers.forEach((header, headerIndex, headerArray) => {
        if (header.record !== undefined) {
            header.record.forEach(record => {
            record.target.forEach(target => {
                if ((target.value === "Patient.identifier") && (target.type === "Identifier.value") ||
                    (target.value === "Observation.subject") && (target.type === "Reference.Patient")) {
                patient_key = headerArray[headerIndex].value
                }
            });
            });
        }
        });
        // 2.- Replace value of patient id from 'data' according to the mapping
        if (patient_key !== undefined) {
            const promises = []
            log.silly("dicom url: ",environment.DICOMFilter.baseUrl)
            data.forEach((resource, index, thisData) => {
                promises.push(
                    axios.get(
                        environment.DICOMFilter.baseUrl + environment.DICOMFilter.check_url,
                        {params: {value: thisData[index][patient_key], create: true},
                        headers: {
                            'Accept': 'application/fhir+json;charset=UTF-8',
                            'Content-Type': 'application/fhir+json;charset=UTF-8'
                        }
                    }).then(res => {
                        thisData[index][patient_key] = res.data
                        log.debug("Checking ID succesful: " + thisData[index][patient_key])
                        resolve()
                    }).catch(err => {
                        log.error("Error at checking ID: " + err);
                    })
                )
            })
            return Promise.all(promises).then(_ => {
                return new Promise(resolve => resolve(data))
            }).catch(_ => {
                return new Promise(resolve => resolve(data))
            })
        }
    }
}