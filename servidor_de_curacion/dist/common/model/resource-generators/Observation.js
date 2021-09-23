"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Observation = void 0;
const data_type_factory_1 = require("./../factory/data-type-factory");
const fhir_util_1 = require("./../../utils/fhir-util");
const tslog_1 = require("tslog");
const log = new tslog_1.Logger();
class Observation {
    Observation() { }
    generateResource(resource, profile) {
        const observation = { resourceType: 'Observation' };
        if (profile)
            observation.meta = { profile: [profile] };
        return new Promise((resolve, reject) => {
            var _a, _b, _c;
            const keys = Array.from(resource.keys());
            if (resource.has('Observation.id')) {
                observation.id = String(((_a = resource.get('Observation.id')) === null || _a === void 0 ? void 0 : _a.value) || '');
            }
            const observationIdentifier = keys.filter(_ => _.startsWith('Observation.identifier'));
            if (observationIdentifier.length) {
                const identifier = {};
                if (resource.has('Observation.identifier.Identifier.system')) {
                    identifier.system = String(((_b = resource.get('Observation.identifier.Identifier.system')) === null || _b === void 0 ? void 0 : _b.value) || '');
                }
                if (resource.has('Observation.identifier.Identifier.value')) {
                    identifier.value = String(((_c = resource.get('Observation.identifier.Identifier.value')) === null || _c === void 0 ? void 0 : _c.value) || '');
                }
                observation.identifier = [identifier];
            }
            if (resource.has('Observation.status')) {
                observation.status = String(resource.get('Observation.status').value);
            }
            if (resource.has('Observation.category')) {
                const item = resource.get('Observation.category');
                observation.category = [data_type_factory_1.DataTypeFactory.createCodeableConcept(data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) }))];
            }
            if (resource.has('Observation.code')) {
                const item = resource.get('Observation.code');
                observation.code = data_type_factory_1.DataTypeFactory.createCodeableConcept(data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) }));
            }
            const subject = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'Observation.subject.Reference.');
            if (subject)
                observation.subject = subject;
            const encounter = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'Observation.encounter.Reference.');
            if (encounter)
                observation.encounter = encounter;
            if (resource.has('Observation.effective[x].dateTime')) {
                const item = resource.get('Observation.effective[x].dateTime');
                try {
                    let date = item.value;
                    if (!(item.value instanceof Date)) {
                        date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                    }
                    observation.effectiveDateTime = data_type_factory_1.DataTypeFactory.createDateString(date);
                }
                catch (e) { }
            }
            if (resource.has('Observation.effective[x].instant')) {
                const item = resource.get('Observation.effective[x].instant');
                try {
                    let date = item.value;
                    if (!(item.value instanceof Date)) {
                        date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                    }
                    observation.effectiveInstant = date.toISOString();
                }
                catch (e) { }
            }
            const effectivePeriod = keys.filter(_ => _.startsWith('Observation.effective[x].Period'));
            if (effectivePeriod.length) {
                const period = {};
                if (resource.has('Observation.effective[x].Period.start')) {
                    const item = resource.get('Observation.effective[x].Period.start');
                    try {
                        let date = item.value;
                        if (!(item.value instanceof Date))
                            date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                        period.start = data_type_factory_1.DataTypeFactory.createDateString(date);
                    }
                    catch (e) { }
                }
                if (resource.has('Observation.effective[x].Period.end')) {
                    const item = resource.get('Observation.effective[x].Period.end');
                    try {
                        let date = item.value;
                        if (!(item.value instanceof Date))
                            date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                        period.end = data_type_factory_1.DataTypeFactory.createDateString(date);
                    }
                    catch (e) { }
                }
                const _period = data_type_factory_1.DataTypeFactory.createPeriod(period).toJSON();
                if (!fhir_util_1.FHIRUtil.isEmpty(_period)) {
                    observation.effectivePeriod = _period;
                }
            }
            const effectiveTiming = keys.filter(_ => _.startsWith('Observation.effective[x].Timing'));
            if (effectiveTiming.length) {
                const timing = {};
                if (resource.has('Observation.effective[x].Timing.event')) {
                    const item = resource.get('Observation.effective[x].Timing.event');
                    try {
                        let date = item.value;
                        if (!(item.value instanceof Date)) {
                            date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                        }
                        timing.event = [data_type_factory_1.DataTypeFactory.createDateString(date)];
                    }
                    catch (e) { }
                }
                if (resource.has('Observation.effective[x].Timing.code')) {
                    const item = resource.get('Observation.effective[x].Timing.code');
                    timing.code = data_type_factory_1.DataTypeFactory.createCodeableConcept(data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) }));
                }
                const effectingTimingRepeat = effectiveTiming.filter(_ => _.startsWith('Observation.effective[x].Timing.repeat'));
                if (effectingTimingRepeat.length) {
                    if (!timing.repeat)
                        timing.repeat = {};
                    if (resource.has('Observation.effective[x].Timing.repeat.bounds[x]')) {
                        // TODO
                    }
                    if (resource.has('Observation.effective[x].Timing.repeat.count')) {
                        timing.repeat.count = Number(resource.get('Observation.effective[x].Timing.repeat.count').value);
                    }
                    if (resource.has('Observation.effective[x].Timing.repeat.countMax')) {
                        timing.repeat.countMax = Number(resource.get('Observation.effective[x].Timing.repeat.countMax').value);
                    }
                    if (resource.has('Observation.effective[x].Timing.repeat.duration')) {
                        timing.repeat.duration = Number(resource.get('Observation.effective[x].Timing.repeat.duration').value);
                    }
                    if (resource.has('Observation.effective[x].Timing.repeat.durationMax')) {
                        timing.repeat.durationMax = Number(resource.get('Observation.effective[x].Timing.repeat.durationMax').value);
                    }
                    if (resource.has('Observation.effective[x].Timing.repeat.durationUnit')) {
                        timing.repeat.durationUnit = String(resource.get('Observation.effective[x].Timing.repeat.durationUnit').value);
                    }
                    if (resource.has('Observation.effective[x].Timing.repeat.frequency')) {
                        timing.repeat.frequency = Number(resource.get('Observation.effective[x].Timing.repeat.frequency').value);
                    }
                    if (resource.has('Observation.effective[x].Timing.repeat.frequencyMax')) {
                        timing.repeat.frequencyMax = Number(resource.get('Observation.effective[x].Timing.repeat.frequencyMax').value);
                    }
                    if (resource.has('Observation.effective[x].Timing.repeat.period')) {
                        timing.repeat.period = Number(resource.get('Observation.effective[x].Timing.repeat.period').value);
                    }
                    if (resource.has('Observation.effective[x].Timing.repeat.periodMax')) {
                        timing.repeat.periodMax = Number(resource.get('Observation.effective[x].Timing.repeat.periodMax').value);
                    }
                    if (resource.has('Observation.effective[x].Timing.repeat.periodUnit')) {
                        timing.repeat.periodUnit = String(resource.get('Observation.effective[x].Timing.repeat.periodUnit').value);
                    }
                    if (resource.has('Observation.effective[x].Timing.repeat.dayOfWeek')) {
                        timing.repeat.dayOfWeek = [String(resource.get('Observation.effective[x].Timing.repeat.dayOfWeek').value)];
                    }
                    if (resource.has('Observation.effective[x].Timing.repeat.timeOfDay')) {
                        timing.repeat.timeOfDay = [String(resource.get('Observation.effective[x].Timing.repeat.timeOfDay').value)];
                    }
                    if (resource.has('Observation.effective[x].Timing.repeat.when')) {
                        timing.repeat.when = [String(resource.get('Observation.effective[x].Timing.repeat.when').value)];
                    }
                    if (resource.has('Observation.effective[x].Timing.repeat.offset')) {
                        timing.repeat.offset = Number(resource.get('Observation.effective[x].Timing.repeat.offset').value);
                    }
                }
                const _timing = data_type_factory_1.DataTypeFactory.createTiming(timing).toJSON();
                if (!fhir_util_1.FHIRUtil.isEmpty(_timing)) {
                    observation.effectiveTiming = _timing;
                }
            }
            if (resource.has('Observation.issued')) {
                const item = resource.get('Observation.issued');
                try {
                    let date = item.value;
                    if (!(item.value instanceof Date)) {
                        date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                    }
                    observation.issued = date.toISOString();
                }
                catch (e) { }
            }
            const performer = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'Observation.performer.Reference.');
            if (performer)
                observation.performer = [performer];
            if (resource.has('Observation.value[x].string')) {
                observation.valueString = String(resource.get('Observation.value[x].string').value);
            }
            if (resource.has('Observation.value[x].boolean')) {
                observation.valueBoolean = String(resource.get('Observation.value[x].boolean').value).toLowerCase() === 'true';
            }
            if (resource.has('Observation.value[x].dateTime')) {
                const item = resource.get('Observation.value[x].dateTime');
                try {
                    let date = item.value;
                    if (!(item.value instanceof Date)) {
                        date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                    }
                    observation.valueDateTime = data_type_factory_1.DataTypeFactory.createDateString(date);
                }
                catch (e) { }
            }
            const valuePeriod = keys.filter(_ => _.startsWith('Observation.value[x].Period'));
            if (valuePeriod.length) {
                const period = {};
                if (resource.has('Observation.value[x].Period.start')) {
                    const item = resource.get('Observation.value[x].Period.start');
                    try {
                        let date = item.value;
                        if (!(item.value instanceof Date)) {
                            date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                        }
                        period.start = data_type_factory_1.DataTypeFactory.createDateString(date);
                    }
                    catch (e) { }
                }
                if (resource.has('Observation.value[x].Period.end')) {
                    const item = resource.get('Observation.value[x].Period.end');
                    try {
                        let date = item.value;
                        if (!(item.value instanceof Date)) {
                            date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                        }
                        period.end = data_type_factory_1.DataTypeFactory.createDateString(date);
                    }
                    catch (e) { }
                }
                const _period = data_type_factory_1.DataTypeFactory.createPeriod(period).toJSON();
                if (!fhir_util_1.FHIRUtil.isEmpty(_period)) {
                    observation.valuePeriod = _period;
                }
            }
            if (resource.has('Observation.value[x].CodeableConcept')) {
                const item = resource.get('Observation.value[x].CodeableConcept');
                observation.valueCodeableConcept = data_type_factory_1.DataTypeFactory.createCodeableConcept(data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) }));
            }
            if (resource.has('Observation.value[x].Range.low')) {
                const item = resource.get('Observation.value[x].Range.low');
                if (!observation.valueRange)
                    observation.valueRange = {};
                // TODO: Quantity datatype: may need unit-value
                observation.valueRange.low = { value: Number(item.value) };
            }
            if (resource.has('Observation.value[x].Range.high')) {
                const item = resource.get('Observation.value[x].Range.high');
                if (!observation.valueRange)
                    observation.valueRange = {};
                observation.valueRange.high = { value: Number(item.value) };
            }
            if (resource.has('Observation.value[x].Ratio.numerator')) {
                const item = resource.get('Observation.value[x].Ratio.numerator');
                if (!observation.valueRatio)
                    observation.valueRatio = {};
                observation.valueRatio.numerator = { value: Number(item.value) };
            }
            if (resource.has('Observation.value[x].Ratio.denominator')) {
                const item = resource.get('Observation.value[x].Ratio.denominator');
                if (!observation.valueRatio)
                    observation.valueRatio = {};
                observation.valueRatio.denominator = { value: Number(item.value) };
            }
            const valueQuantity = keys.filter(_ => _.startsWith('Observation.value[x].Quantity'));
            if (valueQuantity.length) {
                const quantity = {};
                if (resource.has('Observation.value[x].Quantity.value')) {
                    const item = resource.get('Observation.value[x].Quantity.value');
                    quantity.value = Number(item.value);
                }
                if (resource.has('Observation.value[x].Quantity.comparator')) {
                    const item = resource.get('Observation.value[x].Quantity.comparator');
                    quantity.comparator = String(item.value);
                }
                if (resource.has('Observation.value[x].Quantity.unit')) {
                    const item = resource.get('Observation.value[x].Quantity.unit');
                    quantity.unit = String(item.value);
                }
                if (resource.has('Observation.value[x].Quantity.system')) {
                    const item = resource.get('Observation.value[x].Quantity.system');
                    quantity.system = String(item.value);
                }
                if (resource.has('Observation.value[x].Quantity.code')) {
                    const item = resource.get('Observation.value[x].Quantity.code');
                    quantity.code = String(item.value);
                }
                const _quantity = data_type_factory_1.DataTypeFactory.createQuantity(quantity).toJSON();
                if (!fhir_util_1.FHIRUtil.isEmpty(_quantity)) {
                    observation.valueQuantity = _quantity;
                }
            }
            if (resource.has('Observation.dataAbsentReason')) {
                const item = resource.get('Observation.dataAbsentReason');
                observation.dataAbsentReason = data_type_factory_1.DataTypeFactory.createCodeableConcept(data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) }));
            }
            if (resource.has('Observation.interpretation')) {
                const item = resource.get('Observation.interpretation');
                observation.interpretation = [data_type_factory_1.DataTypeFactory.createCodeableConcept(data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) }))];
            }
            if (resource.has('Observation.bodySite')) {
                const item = resource.get('Observation.bodySite');
                observation.bodySite = data_type_factory_1.DataTypeFactory.createCodeableConcept(data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) }));
            }
            if (resource.has('Observation.method')) {
                const item = resource.get('Observation.method');
                observation.method = data_type_factory_1.DataTypeFactory.createCodeableConcept(data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) }));
            }
            const specimen = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'Observation.specimen.Reference.');
            if (specimen)
                observation.specimen = specimen;
            const device = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'Observation.device.Reference.');
            if (device)
                observation.device = device;
            const observationComponent = keys.filter(_ => _.startsWith('Observation.component'));
            if (observationComponent.length) {
                const component = {};
                if (resource.has('Observation.component.code')) {
                    const item = resource.get('Observation.component.code');
                    component.code = data_type_factory_1.DataTypeFactory.createCodeableConcept(data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) }));
                }
                if (resource.has('Observation.component.dataAbsentReason')) {
                    const item = resource.get('Observation.component.dataAbsentReason');
                    component.dataAbsentReason = data_type_factory_1.DataTypeFactory.createCodeableConcept(data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) }));
                }
                if (resource.has('Observation.component.interpretation')) {
                    const item = resource.get('Observation.component.interpretation');
                    component.interpretation = [data_type_factory_1.DataTypeFactory.createCodeableConcept(data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) }))];
                }
                const _component = fhir_util_1.FHIRUtil.cleanJSON(component);
                if (!fhir_util_1.FHIRUtil.isEmpty(_component)) {
                    observation.component = [_component];
                }
            }
            // TODO: Component value[x]
            observation.id = this.generateID(observation);
            if (observation.id)
                resolve(observation);
            else {
                log.error('Id field is empty');
                reject('Id field is empty');
            }
            console.log(JSON.stringify(observation, null, 4));
        });
    }
    generateID(resource) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        let value = '';
        if (resource.id) {
            value += resource.id;
        }
        else {
            if (resource.status)
                value += resource.status;
            if (((_a = resource.code) === null || _a === void 0 ? void 0 : _a.coding) && resource.code.coding.length)
                value += resource.code.coding[0].code;
            if ((_c = (_b = resource.valueCodeableConcept) === null || _b === void 0 ? void 0 : _b.coding) === null || _c === void 0 ? void 0 : _c.length)
                value += resource.valueCodeableConcept.coding[0].code;
            if ((_d = resource.valueQuantity) === null || _d === void 0 ? void 0 : _d.value)
                value += resource.valueQuantity.value;
            if ((_e = resource.subject) === null || _e === void 0 ? void 0 : _e.reference)
                value += resource.subject.reference;
            if (resource.effectiveInstant)
                value += resource.effectiveInstant;
            if (resource.effectiveDateTime)
                value += resource.effectiveDateTime;
            if (resource.effectivePeriod)
                value += String((_f = resource.effectivePeriod) === null || _f === void 0 ? void 0 : _f.start) + String((_g = resource.effectivePeriod) === null || _g === void 0 ? void 0 : _g.end);
            if ((_k = (_j = (_h = resource.effectiveTiming) === null || _h === void 0 ? void 0 : _h.code) === null || _j === void 0 ? void 0 : _j.coding) === null || _k === void 0 ? void 0 : _k.length)
                value += resource.effectiveTiming.code.coding[0].code;
            if ((_m = (_l = resource.effectiveTiming) === null || _l === void 0 ? void 0 : _l.event) === null || _m === void 0 ? void 0 : _m.length)
                value += String(resource.effectiveTiming.event[0]);
            if ((_o = resource.effectiveTiming) === null || _o === void 0 ? void 0 : _o.repeat)
                value += JSON.stringify(resource.effectiveTiming.repeat);
            if ((_p = resource.component) === null || _p === void 0 ? void 0 : _p.length)
                value += JSON.stringify(resource.component);
        }
        return fhir_util_1.FHIRUtil.hash(value);
    }
}
exports.Observation = Observation;
//# sourceMappingURL=Observation.js.map