"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImagingStudy = void 0;
const data_type_factory_1 = require("./../factory/data-type-factory");
const fhir_util_1 = require("./../../utils/fhir-util");
const tslog_1 = require("tslog");
const log = new tslog_1.Logger();
class ImagingStudy {
    ImagingStudy() { }
    generateResource(resource, profile, conceptMap) {
        const imagingStudy = { resourceType: 'ImagingStudy' };
        return new Promise((resolve, reject) => {
            var _a, _b, _c, _d, _e, _f;
            const keys = Array.from(resource.keys());
            if (resource.has('ImagingStudy.id')) {
                imagingStudy.id = String(((_a = resource.get('ImagingStudy.id')) === null || _a === void 0 ? void 0 : _a.value) || '');
            }
            const _meta = keys.filter(_ => _.startsWith('ImagingStudy.meta'));
            if (_meta.length) {
                const meta = {};
                if (resource.has('ImagingStudy.meta.Meta.versionId')) {
                    meta.versionId = String(((_b = resource.get('ImagingStudy.meta.Meta.versionId')) === null || _b === void 0 ? void 0 : _b.value) || '');
                }
                if (resource.has('ImagingStudy.meta.Meta.source')) {
                    meta.source = String(((_c = resource.get('ImagingStudy.meta.Meta.source')) === null || _c === void 0 ? void 0 : _c.value) || '');
                }
                if (resource.has('ImagingStudy.meta.Meta.profile')) {
                    meta.profile = [String(((_d = resource.get('ImagingStudy.meta.Meta.profile')) === null || _d === void 0 ? void 0 : _d.value) || '')];
                }
                if (resource.has('ImagingStudy.meta.Meta.security')) {
                    const item = resource.get('ImagingStudy.meta.Meta.security');
                    meta.security = [data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) })];
                }
                if (resource.has('ImagingStudy.meta.Meta.tag')) {
                    const item = resource.get('ImagingStudy.meta.Meta.tag');
                    meta.tag = [data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) })];
                }
                imagingStudy.meta = Object.assign(Object.assign({}, imagingStudy.meta), meta);
            }
            const imagingStudyIdentifier = keys.filter(_ => _.startsWith('ImagingStudy.identifier'));
            if (imagingStudyIdentifier.length) {
                const identifier = {};
                if (resource.has('ImagingStudy.identifier.Identifier.system')) {
                    identifier.system = String(((_e = resource.get('ImagingStudy.identifier.Identifier.system')) === null || _e === void 0 ? void 0 : _e.value) || '');
                }
                if (resource.has('ImagingStudy.identifier.Identifier.value')) {
                    identifier.value = String(((_f = resource.get('ImagingStudy.identifier.Identifier.value')) === null || _f === void 0 ? void 0 : _f.value) || '');
                }
                imagingStudy.identifier = [identifier];
            }
            if (resource.has('ImagingStudy.status')) {
                imagingStudy.status = String(resource.get('ImagingStudy.status').value);
            }
            if (resource.has('ImagingStudy.modality.Coding.code')) {
                const item = resource.get('ImagingStudy.modality.Coding.code');
                imagingStudy.modality = [data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: item.value })];
            }
            const subject = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'ImagingStudy.subject.Reference.');
            if (subject)
                imagingStudy.subject = subject;
            const encounter = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'ImagingStudy.encounter.Reference.');
            if (encounter)
                imagingStudy.encounter = encounter;
            if (resource.has('ImagingStudy.started')) {
                const item = resource.get('ImagingStudy.started');
                try {
                    let date = item.value;
                    if (!(item.value instanceof Date)) {
                        date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                    }
                    imagingStudy.started = data_type_factory_1.DataTypeFactory.createDateString(date);
                }
                catch (e) { }
            }
            if (resource.has('ImagingStudy.numberOfSeries')) {
                imagingStudy.numberOfSeries = Number(resource.get('ImagingStudy.numberOfSeries').value);
            }
            if (resource.has('ImagingStudy.numberOfInstances')) {
                imagingStudy.numberOfInstances = Number(resource.get('ImagingStudy.numberOfInstances').value);
            }
            if (resource.has('ImagingStudy.reasonCode')) {
                const item = resource.get('ImagingStudy.reasonCode');
                imagingStudy.reasonCode = [data_type_factory_1.DataTypeFactory.createCodeableConcept({ system: item.fixedUri, code: String(item.value) })];
            }
            const reasonReference = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'ImagingStudy.reasonReference.Reference.');
            if (reasonReference)
                imagingStudy.reasonReference = [reasonReference];
            if (resource.has('ImagingStudy.description')) {
                imagingStudy.description = String(resource.get('ImagingStudy.description').value);
            }
            const imagingStudySeries = keys.filter(_ => _.startsWith('ImagingStudy.series'));
            if (imagingStudySeries.length) {
                const series = {};
                if (resource.has('ImagingStudy.series.uid')) {
                    series.uid = String(resource.get('ImagingStudy.series.uid').value);
                }
                if (resource.has('ImagingStudy.series.number')) {
                    series.number = Number(resource.get('ImagingStudy.series.number').value);
                }
                if (resource.has('ImagingStudy.series.modality.Coding.code')) {
                    const item = resource.get('ImagingStudy.series.modality.Coding.code');
                    series.modality = data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: item.value });
                }
                if (resource.has('ImagingStudy.series.description')) {
                    series.description = String(resource.get('ImagingStudy.series.description').value);
                }
                if (resource.has('ImagingStudy.series.numberOfInstances')) {
                    series.numberOfInstances = Number(resource.get('ImagingStudy.series.numberOfInstances').value);
                }
                if (resource.has('ImagingStudy.series.bodySite.Coding.code')) {
                    const item = resource.get('ImagingStudy.series.bodySite.Coding.code');
                    series.bodySite = data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value), display: String(item.display) });
                }
                if (resource.has('ImagingStudy.series.laterality.Coding.code')) {
                    const item = resource.get('ImagingStudy.series.laterality.Coding.code');
                    series.laterality = data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value), display: String(item.display) });
                }
                if (resource.has('ImagingStudy.series.started')) {
                    const item = resource.get('ImagingStudy.series.started');
                    try {
                        let date = item.value;
                        if (!(item.value instanceof Date)) {
                            date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                        }
                        series.started = data_type_factory_1.DataTypeFactory.createDateString(date);
                    }
                    catch (e) { }
                }
                const imagingStudySeriesPerformer = keys.filter(_ => _.startsWith('ImagingStudy.series.performer'));
                const performerActors = keys.filter(_ => _.startsWith('ImagingStudy.series.performer.actor.Reference.'));
                const performerFunctions = keys.filter(_ => _.startsWith('ImagingStudy.series.performer.function.'));
                if (imagingStudySeriesPerformer.length) {
                    series.performer = [];
                    for (let index = 0; index < performerActors.length; index++) {
                        const performer = {};
                        if (resource.has(performerFunctions[index])) {
                            const item = resource.get(performerFunctions[index]);
                            performer.function = data_type_factory_1.DataTypeFactory.createCodeableConcept({ system: item.fixedUri, code: String(item.value) });
                        }
                        const actor = fhir_util_1.FHIRUtil.searchForReference(keys, resource, performerActors[index]);
                        if (actor)
                            performer.actor = actor;
                        const _performer = fhir_util_1.FHIRUtil.cleanJSON(performer);
                        if (!fhir_util_1.FHIRUtil.isEmpty(_performer)) {
                            series.performer.push(_performer);
                        }
                    }
                }
                const imagingStudySeriesInstance = keys.filter(_ => _.startsWith('ImagingStudy.series.instance'));
                if (imagingStudySeriesInstance.length) {
                    const instance = {};
                    if (resource.has('ImagingStudy.series.instance.uid')) {
                        instance.uid = String(resource.get('ImagingStudy.series.instance.uid').value);
                    }
                    if (resource.has('ImagingStudy.series.instance.sopClass.Coding.code')) {
                        const item = resource.get('ImagingStudy.series.instance.sopClass.Coding.code');
                        instance.sopClass = data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: item.value });
                    }
                    if (resource.has('ImagingStudy.series.instance.number')) {
                        instance.number = Number(resource.get('ImagingStudy.series.instance.number').value);
                    }
                    if (resource.has('ImagingStudy.series.instance.title')) {
                        instance.title = String(resource.get('ImagingStudy.series.instance.title').value);
                    }
                    const _instance = fhir_util_1.FHIRUtil.cleanJSON(instance);
                    if (!fhir_util_1.FHIRUtil.isEmpty(_instance)) {
                        series.instance = [_instance];
                    }
                }
                const _series = fhir_util_1.FHIRUtil.cleanJSON(series);
                if (!fhir_util_1.FHIRUtil.isEmpty(_series)) {
                    imagingStudy.series = [_series];
                }
            }
            imagingStudy.id = this.generateID(imagingStudy);
            if (imagingStudy.id) {
                resolve(imagingStudy);
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
exports.ImagingStudy = ImagingStudy;
//# sourceMappingURL=ImagingStudy.js.map