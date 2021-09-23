"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticReport = void 0;
const data_type_factory_1 = require("./../factory/data-type-factory");
const fhir_util_1 = require("./../../utils/fhir-util");
const tslog_1 = require("tslog");
const log = new tslog_1.Logger();
class DiagnosticReport {
    DiagnosticReport() { }
    generateResource(resource, profile) {
        const diagnosticReport = { resourceType: 'DiagnosticReport' };
        return new Promise((resolve, reject) => {
            var _a, _b, _c, _d, _e, _f;
            const keys = Array.from(resource.keys());
            if (resource.has('DiagnosticReport.id')) {
                diagnosticReport.id = String(((_a = resource.get('DiagnosticReport.id')) === null || _a === void 0 ? void 0 : _a.value) || '');
            }
            const _meta = keys.filter(_ => _.startsWith('DiagnosticReport.meta'));
            if (_meta.length) {
                const meta = {};
                if (resource.has('DiagnosticReport.meta.Meta.versionId')) {
                    meta.versionId = String(((_b = resource.get('DiagnosticReport.meta.Meta.versionId')) === null || _b === void 0 ? void 0 : _b.value) || '');
                }
                if (resource.has('DiagnosticReport.meta.Meta.source')) {
                    meta.source = String(((_c = resource.get('DiagnosticReport.meta.Meta.source')) === null || _c === void 0 ? void 0 : _c.value) || '');
                }
                if (resource.has('DiagnosticReport.meta.Meta.profile')) {
                    meta.profile = [String(((_d = resource.get('DiagnosticReport.meta.Meta.profile')) === null || _d === void 0 ? void 0 : _d.value) || '')];
                }
                if (resource.has('DiagnosticReport.meta.Meta.security')) {
                    const item = resource.get('DiagnosticReport.meta.Meta.security');
                    meta.security = [data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) })];
                }
                if (resource.has('DiagnosticReport.meta.Meta.tag')) {
                    const item = resource.get('DiagnosticReport.meta.Meta.tag');
                    meta.tag = [data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) })];
                }
                diagnosticReport.meta = Object.assign(Object.assign({}, diagnosticReport.meta), meta);
            }
            const diagnosticReportIdentifier = keys.filter(_ => _.startsWith('DiagnosticReport.identifier'));
            if (diagnosticReportIdentifier.length) {
                const identifier = {};
                if (resource.has('DiagnosticReport.identifier.Identifier.system')) {
                    identifier.system = String(((_e = resource.get('DiagnosticReport.identifier.Identifier.system')) === null || _e === void 0 ? void 0 : _e.value) || '');
                }
                if (resource.has('DiagnosticReport.identifier.Identifier.value')) {
                    identifier.value = String(((_f = resource.get('DiagnosticReport.identifier.Identifier.value')) === null || _f === void 0 ? void 0 : _f.value) || '');
                }
                diagnosticReport.identifier = [identifier];
            }
            if (resource.has('DiagnosticReport.status')) {
                diagnosticReport.status = String(resource.get('DiagnosticReport.status').value);
            }
            if (resource.has('DiagnosticReport.category')) {
                const item = resource.get('DiagnosticReport.category');
                diagnosticReport.category = data_type_factory_1.DataTypeFactory.createCodeableConcept({ system: item.fixedUri, code: String(item.value) });
            }
            if (resource.has('DiagnosticReport.code')) {
                const item = resource.get('DiagnosticReport.code');
                diagnosticReport.code = data_type_factory_1.DataTypeFactory.createCodeableConcept({ system: item.fixedUri, code: String(item.value), display: String(item.display) });
            }
            const subject = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'DiagnosticReport.subject.Reference.');
            if (subject)
                diagnosticReport.subject = subject;
            const encounter = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'DiagnosticReport.encounter.Reference.');
            if (encounter)
                diagnosticReport.encounter = encounter;
            if (resource.has('DiagnosticReport.effective[x].dateTime')) {
                const item = resource.get('DiagnosticReport.effective[x].dateTime');
                try {
                    let date = item.value;
                    if (!(date instanceof Date)) {
                        date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                    }
                    diagnosticReport.effectiveDateTime = data_type_factory_1.DataTypeFactory.createDateString(date);
                }
                catch (e) { }
            }
            const effectivePeriod = keys.filter(_ => _.startsWith('DiagnosticReport.effective[x].Period'));
            if (effectivePeriod.length) {
                const period = {};
                if (resource.has('DiagnosticReport.effective[x].Period.start')) {
                    const item = resource.get('DiagnosticReport.effective[x].Period.start');
                    try {
                        let date = item.value;
                        if (!(item.value instanceof Date)) {
                            date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                        }
                        period.start = data_type_factory_1.DataTypeFactory.createDateString(date);
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
                if (resource.has('DiagnosticReport.effective[x].Period.end')) {
                    const item = resource.get('DiagnosticReport.effective[x].Period.end');
                    try {
                        let date = item.value;
                        if (!(item.value instanceof Date)) {
                            date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                        }
                        period.end = data_type_factory_1.DataTypeFactory.createDateString(date);
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
                const _period = data_type_factory_1.DataTypeFactory.createPeriod(period).toJSON();
                if (!fhir_util_1.FHIRUtil.isEmpty(_period)) {
                    diagnosticReport.effectivePeriod = _period;
                }
            }
            if (resource.has('DiagnosticReport.issued')) {
                diagnosticReport.issued = String(resource.get('DiagnosticReport.issued').value);
            }
            const performer = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'DiagnosticReport.performer.Reference.');
            if (performer)
                diagnosticReport.performer = [performer];
            const specimen = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'DiagnosticReport.specimen.Reference.');
            if (specimen)
                diagnosticReport.specimen = [specimen];
            const result = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'DiagnosticReport.result.Reference.');
            if (result)
                diagnosticReport.result = [result];
            const imagingStudy = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'DiagnosticReport.imagingStudy.Reference.');
            if (imagingStudy)
                diagnosticReport.imagingStudy = [imagingStudy];
            const DiagnosticReportImage = keys.filter(_ => _.startsWith('DiagnosticReport.media'));
            if (DiagnosticReportImage.length) {
                const image = {};
                if (resource.has('DiagnosticReport.media.comment')) {
                    image.comment = String(resource.get('DiagnosticReport.media.comment').value);
                }
                const link = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'DiagnosticReport.image.link.Reference.');
                if (link)
                    image.link = link;
                const _image = fhir_util_1.FHIRUtil.cleanJSON(image);
                if (!fhir_util_1.FHIRUtil.isEmpty(_image)) {
                    diagnosticReport.image = [_image];
                }
            }
            if (resource.has('DiagnosticReport.conclusion')) {
                diagnosticReport.conclusion = String(resource.get('DiagnosticReport.conclusion').value);
            }
            if (resource.has('DiagnosticReport.conclusionCode')) {
                const item = resource.get('DiagnosticReport.conclusionCode');
                diagnosticReport.codedDiagnosis = [data_type_factory_1.DataTypeFactory.createCodeableConcept({ system: item.fixedUri, code: String(item.value) })];
            }
            diagnosticReport.id = this.generateID(diagnosticReport);
            if (diagnosticReport.id) {
                resolve(diagnosticReport);
            }
            else {
                log.error('Id field is empty');
                reject('Id field is empty');
            }
        });
    }
    generateID(resource) {
        let value = '';
        if (resource.id)
            value += resource.id;
        return fhir_util_1.FHIRUtil.hash(value);
    }
}
exports.DiagnosticReport = DiagnosticReport;
//# sourceMappingURL=DiagnosticReport.js.map