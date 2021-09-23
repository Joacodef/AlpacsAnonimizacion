"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FamilyMemberHistory = void 0;
const data_type_factory_1 = require("./../factory/data-type-factory");
const fhir_util_1 = require("./../../utils/fhir-util");
const tslog_1 = require("tslog");
const log = new tslog_1.Logger();
class FamilyMemberHistory {
    FamilyMemberHistory() { }
    generateResource(resource, profile) {
        const familyMemberHistory = { resourceType: 'FamilyMemberHistory' };
        return new Promise((resolve, reject) => {
            var _a, _b, _c, _d, _e, _f;
            const keys = Array.from(resource.keys());
            if (resource.has('FamilyMemberHistory.id')) {
                familyMemberHistory.id = String(((_a = resource.get('FamilyMemberHistory.id')) === null || _a === void 0 ? void 0 : _a.value) || '');
            }
            const _meta = keys.filter(_ => _.startsWith('FamilyMemberHistory.meta'));
            if (_meta.length) {
                const meta = {};
                if (resource.has('FamilyMemberHistory.meta.Meta.versionId')) {
                    meta.versionId = String(((_b = resource.get('FamilyMemberHistory.meta.Meta.versionId')) === null || _b === void 0 ? void 0 : _b.value) || '');
                }
                if (resource.has('FamilyMemberHistory.meta.Meta.source')) {
                    meta.source = String(((_c = resource.get('FamilyMemberHistory.meta.Meta.source')) === null || _c === void 0 ? void 0 : _c.value) || '');
                }
                if (resource.has('FamilyMemberHistory.meta.Meta.profile')) {
                    meta.profile = [String(((_d = resource.get('FamilyMemberHistory.meta.Meta.profile')) === null || _d === void 0 ? void 0 : _d.value) || '')];
                }
                if (resource.has('FamilyMemberHistory.meta.Meta.security')) {
                    const item = resource.get('FamilyMemberHistory.meta.Meta.security');
                    meta.security = [data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) })];
                }
                if (resource.has('FamilyMemberHistory.meta.Meta.tag')) {
                    const item = resource.get('FamilyMemberHistory.meta.Meta.tag');
                    meta.tag = [data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) })];
                }
                familyMemberHistory.meta = Object.assign(Object.assign({}, familyMemberHistory.meta), meta);
            }
            const familyMemberHistoryIdentifier = keys.filter(_ => _.startsWith('FamilyMemberHistory.identifier'));
            if (familyMemberHistoryIdentifier.length) {
                const identifier = {};
                if (resource.has('FamilyMemberHistory.identifier.Identifier.system')) {
                    identifier.system = String(((_e = resource.get('FamilyMemberHistory.identifier.Identifier.system')) === null || _e === void 0 ? void 0 : _e.value) || '');
                }
                if (resource.has('FamilyMemberHistory.identifier.Identifier.value')) {
                    identifier.value = String(((_f = resource.get('FamilyMemberHistory.identifier.Identifier.value')) === null || _f === void 0 ? void 0 : _f.value) || '');
                }
                familyMemberHistory.identifier = [identifier];
            }
            if (resource.has('FamilyMemberHistory.status')) {
                familyMemberHistory.status = String(resource.get('FamilyMemberHistory.status').value);
            }
            const patient = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'FamilyMemberHistory.patient.Reference.');
            if (patient)
                familyMemberHistory.patient = patient;
            if (resource.has('FamilyMemberHistory.date')) {
                const item = resource.get('FamilyMemberHistory.date');
                try {
                    let date = item.value;
                    if (!(date instanceof Date)) {
                        date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                    }
                    familyMemberHistory.date = data_type_factory_1.DataTypeFactory.shortenDate(date);
                }
                catch (e) { }
            }
            if (resource.has('FamilyMemberHistory.name')) {
                familyMemberHistory.name = String(resource.get('FamilyMemberHistory.name').value);
            }
            if (resource.has('FamilyMemberHistory.relationship')) {
                const item = resource.get('FamilyMemberHistory.relationship');
                familyMemberHistory.relationship = data_type_factory_1.DataTypeFactory.createCodeableConcept({ system: item.fixedUri, code: String(item.value) });
            }
            // TODO as CodeableConcept
            if (resource.has('FamilyMemberHistory.sex')) {
                // familyMemberHistory.gender = String(resource.get('FamilyMemberHistory.sex').value).toLowerCase()
                const codesystemAdministrativeGender = ['male', 'female', 'unknown', 'other'];
                const value = String(resource.get('FamilyMemberHistory.sex').value).toLowerCase();
                if (!codesystemAdministrativeGender.includes(value)) {
                    familyMemberHistory.gender = 'unknown';
                }
                else {
                    familyMemberHistory.gender = value;
                }
            }
            const bornPeriod = keys.filter(_ => _.startsWith('FamilyMemberHistory.born[x].Period'));
            if (bornPeriod.length) {
                const period = {};
                if (resource.has('FamilyMemberHistory.born[x].Period.start')) {
                    const item = resource.get('FamilyMemberHistory.born[x].Period.start');
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
                if (resource.has('FamilyMemberHistory.born[x].Period.end')) {
                    const item = resource.get('FamilyMemberHistory.born[x].Period.end');
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
                    familyMemberHistory.bornPeriod = _period;
                }
            }
            if (resource.has('FamilyMemberHistory.born[x].bornDate')) {
                const item = resource.get('FamilyMemberHistory.born[x].bornDate');
                try {
                    let date = item.value;
                    if (!(date instanceof Date)) {
                        date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                    }
                    familyMemberHistory.bornDate = data_type_factory_1.DataTypeFactory.shortenDate(date);
                }
                catch (e) { }
            }
            if (resource.has('FamilyMemberHistory.born[x].string')) {
                const item = resource.get('FamilyMemberHistory.born[x].string');
                familyMemberHistory.bornString = String(item.value);
            }
            const ageAge = keys.filter(_ => _.startsWith('FamilyMemberHistory.age[x].Age'));
            if (ageAge.length) {
                const age = {};
                if (resource.has('FamilyMemberHistory.age[x].Age.value')) {
                    const item = resource.get('FamilyMemberHistory.age[x].Age.value');
                    age.value = Number(item.value);
                }
                if (resource.has('FamilyMemberHistory.age[x].Age.comparator')) {
                    const item = resource.get('FamilyMemberHistory.age[x].Age.comparator');
                    age.comparator = String(item.value);
                }
                if (resource.has('FamilyMemberHistory.age[x].Age.unit')) {
                    const item = resource.get('FamilyMemberHistory.age[x].Age.unit');
                    age.unit = String(item.value);
                }
                if (resource.has('FamilyMemberHistory.age[x].Age.system')) {
                    const item = resource.get('FamilyMemberHistory.age[x].Age.system');
                    age.system = String(item.value);
                }
                if (resource.has('FamilyMemberHistory.age[x].Age.code')) {
                    const item = resource.get('FamilyMemberHistory.age[x].Age.code');
                    age.code = String(item.value);
                }
                const _age = data_type_factory_1.DataTypeFactory.createAge(age).toJSON();
                if (!fhir_util_1.FHIRUtil.isEmpty(_age)) {
                    familyMemberHistory.ageAge = _age;
                }
            }
            if (resource.has('FamilyMemberHistory.age[x].string')) {
                const item = resource.get('FamilyMemberHistory.age[x].string');
                familyMemberHistory.ageString = String(item.value);
            }
            if (resource.has('FamilyMemberHistory.estimatedAge')) {
                const item = resource.get('FamilyMemberHistory.estimatedAge');
                familyMemberHistory.estimatedAge = String(item.value).toLowerCase() === 'true';
            }
            if (resource.has('FamilyMemberHistory.deceased[x].boolean')) {
                const item = resource.get('FamilyMemberHistory.deceased[x].boolean');
                familyMemberHistory.deceasedBoolean = String(item.value).toLowerCase() === 'true';
            }
            if (resource.has('FamilyMemberHistory.deceased[x].date')) {
                const item = resource.get('FamilyMemberHistory.deceased[x].date');
                try {
                    let date = item.value;
                    if (!(date instanceof Date)) {
                        date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                    }
                    familyMemberHistory.deceasedDate = data_type_factory_1.DataTypeFactory.createDateString(date);
                }
                catch (e) { }
            }
            const deceasedAge = keys.filter(_ => _.startsWith('FamilyMemberHistory.deceased[x].Age'));
            if (deceasedAge.length) {
                const age = {};
                if (resource.has('FamilyMemberHistory.deceased[x].Age.value')) {
                    const item = resource.get('FamilyMemberHistory.deceased[x].Age.value');
                    age.value = Number(item.value);
                }
                if (resource.has('FamilyMemberHistory.deceased[x].Age.comparator')) {
                    const item = resource.get('FamilyMemberHistory.deceased[x].Age.comparator');
                    age.comparator = String(item.value);
                }
                if (resource.has('FamilyMemberHistory.deceased[x].Age.unit')) {
                    const item = resource.get('FamilyMemberHistory.deceased[x].Age.unit');
                    age.unit = String(item.value);
                }
                if (resource.has('FamilyMemberHistory.deceased[x].Age.system')) {
                    const item = resource.get('FamilyMemberHistory.deceased[x].Age.system');
                    age.system = String(item.value);
                }
                if (resource.has('FamilyMemberHistory.deceased[x].Age.code')) {
                    const item = resource.get('FamilyMemberHistory.deceased[x].Age.code');
                    age.code = String(item.value);
                }
                const _age = data_type_factory_1.DataTypeFactory.createAge(age).toJSON();
                if (!fhir_util_1.FHIRUtil.isEmpty(_age)) {
                    familyMemberHistory.deceasedAge = _age;
                }
            }
            if (resource.has('FamilyMemberHistory.deceased[x].string')) {
                const item = resource.get('FamilyMemberHistory.deceased[x].string');
                familyMemberHistory.deceasedString = String(item.value);
            }
            if (resource.has('FamilyMemberHistory.reasonCode')) {
                const item = resource.get('FamilyMemberHistory.reasonCode');
                familyMemberHistory.reasonCode = [data_type_factory_1.DataTypeFactory.createCodeableConcept({ system: item.fixedUri, code: String(item.value) })];
            }
            const reasonReference = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'FamilyMemberHistory.reasonReference.Reference.');
            if (reasonReference)
                familyMemberHistory.reasonReference = [reasonReference];
            const FamilyMemberHistoryCondition = keys.filter(_ => _.startsWith('FamilyMemberHistory.condition'));
            if (FamilyMemberHistoryCondition.length) {
                const condition = {};
                if (resource.has('FamilyMemberHistory.condition.code')) {
                    const item = resource.get('FamilyMemberHistory.condition.code');
                    condition.code = data_type_factory_1.DataTypeFactory.createCodeableConcept(data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) }));
                }
                if (resource.has('FamilyMemberHistory.condition.outcome')) {
                    const item = resource.get('FamilyMemberHistory.condition.outcome');
                    condition.outcome = data_type_factory_1.DataTypeFactory.createCodeableConcept(data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) }));
                }
                if (resource.has('FamilyMemberHistory.condition.contributedToDeath')) {
                    const item = resource.get('FamilyMemberHistory.condition.contributedToDeath');
                    condition.contributedToDeath = String(item.value).toLowerCase() === 'true';
                }
                const onsetAge = keys.filter(_ => _.startsWith('FamilyMemberHistory.condition.onset[x].Age'));
                if (onsetAge.length) {
                    const age = {};
                    if (resource.has('FamilyMemberHistory.condition.onset[x].Age.value')) {
                        const item = resource.get('FamilyMemberHistory.condition.onset[x].Age.value');
                        age.value = Number(item.value);
                    }
                    if (resource.has('FamilyMemberHistory.condition.onset[x].Age.comparator')) {
                        const item = resource.get('FamilyMemberHistory.condition.onset[x].Age.comparator');
                        age.comparator = String(item.value);
                    }
                    if (resource.has('FamilyMemberHistory.condition.onset[x].Age.unit')) {
                        const item = resource.get('FamilyMemberHistory.condition.onset[x].Age.unit');
                        age.unit = String(item.value);
                    }
                    if (resource.has('FamilyMemberHistory.condition.onset[x].Age.system')) {
                        const item = resource.get('FamilyMemberHistory.condition.onset[x].Age.system');
                        age.system = String(item.value);
                    }
                    if (resource.has('FamilyMemberHistory.condition.onset[x].Age.code')) {
                        const item = resource.get('FamilyMemberHistory.condition.onset[x].Age.code');
                        age.code = String(item.value);
                    }
                    const _age = data_type_factory_1.DataTypeFactory.createAge(age).toJSON();
                    if (!fhir_util_1.FHIRUtil.isEmpty(_age)) {
                        condition.onsetAge = _age;
                    }
                }
                if (resource.has('FamilyMemberHistory.condition.onset[x].string')) {
                    const item = resource.get('FamilyMemberHistory.condition.onset[x].string');
                    condition.onsetString = String(item.value);
                }
                const onsetRange = keys.filter(_ => _.startsWith('FamilyMemberHistory.condition.onset[x].Period'));
                if (onsetRange.length) {
                    const period = {};
                    if (resource.has('FamilyMemberHistory.condition.onset[x].Period.start')) {
                        const item = resource.get('FamilyMemberHistory.condition.onset[x].Period.start');
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
                    if (resource.has('FamilyMemberHistory.condition.onset[x].Period.end')) {
                        const item = resource.get('FamilyMemberHistory.condition.onset[x].Period.end');
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
                        condition.onsetPeriod = _period;
                    }
                }
                const _condition = fhir_util_1.FHIRUtil.cleanJSON(condition);
                if (!fhir_util_1.FHIRUtil.isEmpty(_condition)) {
                    familyMemberHistory.condition = [_condition];
                }
            }
            familyMemberHistory.id = this.generateID(familyMemberHistory);
            if (familyMemberHistory.id) {
                resolve(familyMemberHistory);
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
exports.FamilyMemberHistory = FamilyMemberHistory;
//# sourceMappingURL=FamilyMemberHistory.js.map