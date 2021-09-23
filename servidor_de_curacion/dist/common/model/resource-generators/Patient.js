"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Patient = void 0;
const data_type_factory_1 = require("./../factory/data-type-factory");
const fhir_util_1 = require("./../../utils/fhir-util");
const tslog_1 = require("tslog");
const log = new tslog_1.Logger();
class Patient {
    Patient() { }
    generateResource(resource, profile) {
        const patient = { resourceType: 'Patient' };
        return new Promise((resolve, reject) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            const keys = Array.from(resource.keys());
            if (resource.has('Patient.id')) {
                patient.id = String(((_a = resource.get('Patient.id')) === null || _a === void 0 ? void 0 : _a.value) || '');
            }
            const _meta = keys.filter(_ => _.startsWith('Patient.meta'));
            if (_meta.length) {
                const meta = {};
                if (resource.has('Patient.meta.Meta.versionId')) {
                    meta.versionId = String(((_b = resource.get('Patient.meta.Meta.versionId')) === null || _b === void 0 ? void 0 : _b.value) || '');
                }
                if (resource.has('Patient.meta.Meta.source')) {
                    meta.source = String(((_c = resource.get('Patient.meta.Meta.source')) === null || _c === void 0 ? void 0 : _c.value) || '');
                }
                if (resource.has('Patient.meta.Meta.profile')) {
                    meta.profile = [String(((_d = resource.get('Patient.meta.Meta.profile')) === null || _d === void 0 ? void 0 : _d.value) || '')];
                }
                if (resource.has('Patient.meta.Meta.security')) {
                    const item = resource.get('Patient.meta.Meta.security');
                    meta.security = [data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) })];
                }
                if (resource.has('Patient.meta.Meta.tag')) {
                    const item = resource.get('Patient.meta.Meta.tag');
                    meta.tag = [data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) })];
                }
                patient.meta = Object.assign(Object.assign({}, patient.meta), meta);
            }
            const patientIdentifier = keys.filter(_ => _.startsWith('Patient.identifier'));
            if (patientIdentifier.length) {
                const identifier = {};
                if (resource.has('Patient.identifier.Identifier.system')) {
                    identifier.system = String(((_e = resource.get('Patient.identifier.Identifier.system')) === null || _e === void 0 ? void 0 : _e.value) || '');
                }
                if (resource.has('Patient.identifier.Identifier.value')) {
                    identifier.value = String(((_f = resource.get('Patient.identifier.Identifier.value')) === null || _f === void 0 ? void 0 : _f.value) || '');
                }
                patient.identifier = [identifier];
            }
            if (resource.has('Patient.active')) {
                const item = resource.get('Patient.active');
                patient.active = String(item.value).toLowerCase() === 'true';
            }
            if (resource.has('Patient.gender')) {
                // patient.gender = String(resource.get('Patient.gender').value).toLowerCase()
                const codesystemAdministrativeGender = ['male', 'female', 'unknown', 'other'];
                const value = String(resource.get('Patient.gender').value).toLowerCase();
                if (!codesystemAdministrativeGender.includes(value)) {
                    patient.gender = 'unknown';
                }
                else {
                    patient.gender = value;
                }
            }
            if (resource.has('Patient.maritalStatus')) {
                const item = resource.get('Patient.maritalStatus');
                patient.maritalStatus = data_type_factory_1.DataTypeFactory.createCodeableConcept({ system: item.fixedUri, code: String(item.value) });
            }
            const patientTelecom = keys.filter(_ => _.startsWith('Patient.telecom'));
            if (patientTelecom.length) {
                // TODO: ContactPoint.period
                const telecom = {};
                if (resource.has('Patient.telecom.ContactPoint.system')) {
                    const item = resource.get('Patient.telecom.ContactPoint.system');
                    telecom.system = String(item.value);
                }
                if (resource.has('Patient.telecom.ContactPoint.value')) {
                    telecom.value = String(resource.get('Patient.telecom.ContactPoint.value').value);
                }
                if (resource.has('Patient.telecom.ContactPoint.use')) {
                    const item = resource.get('Patient.telecom.ContactPoint.use');
                    telecom.use = String(item.value);
                }
                if (resource.has('Patient.telecom.ContactPoint.rank')) {
                    telecom.rank = Number(resource.get('Patient.telecom.ContactPoint.rank').value);
                }
                const _telecom = data_type_factory_1.DataTypeFactory.createContactPoint(telecom).toJSON();
                if (!fhir_util_1.FHIRUtil.isEmpty(_telecom)) {
                    if ((_g = patient.telecom) === null || _g === void 0 ? void 0 : _g.length)
                        patient.telecom.push(_telecom);
                    else
                        patient.telecom = [_telecom];
                }
            }
            if (resource.has('Patient.birthDate')) {
                const item = resource.get('Patient.birthDate');
                try {
                    let date = item.value;
                    if (!(date instanceof Date)) {
                        date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                    }
                    patient.birthDate = data_type_factory_1.DataTypeFactory.shortenDate(date);
                }
                catch (e) { }
            }
            if (resource.has('Patient.deceased[x].dateTime')) {
                const item = resource.get('Patient.deceased[x].dateTime');
                try {
                    let date = item.value;
                    if (!(date instanceof Date)) {
                        date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                    }
                    patient.deceasedDateTime = data_type_factory_1.DataTypeFactory.createDateString(date);
                }
                catch (e) { }
            }
            if (resource.has('Patient.deceased[x].boolean')) {
                const item = resource.get('Patient.deceased[x].boolean');
                patient.deceasedBoolean = String(item.value).toLowerCase() === 'true';
            }
            if (resource.has('Patient.multipleBirth[x].boolean')) {
                const item = resource.get('Patient.multipleBirth[x].boolean');
                patient.multipleBirthBoolean = String(item.value).toLowerCase() === 'true';
            }
            if (resource.has('Patient.multipleBirth[x].integer')) {
                patient.multipleBirthInteger = Number(resource.get('Patient.multipleBirth[x].integer').value);
            }
            const patientName = keys.filter(_ => _.startsWith('Patient.name'));
            if (patientName.length) {
                // TODO: HumanName.period
                const name = {};
                if (resource.has('Patient.name.HumanName.use')) {
                    const item = resource.get('Patient.name.HumanName.use');
                    name.use = String(item.value);
                }
                if (resource.has('Patient.name.HumanName.text')) {
                    name.text = String(resource.get('Patient.name.HumanName.text').value);
                }
                if (resource.has('Patient.name.HumanName.family')) {
                    name.family = String(resource.get('Patient.name.HumanName.family').value);
                }
                if (resource.has('Patient.name.HumanName.given')) {
                    name.given = [String(resource.get('Patient.name.HumanName.given').value)];
                }
                if (resource.has('Patient.name.HumanName.prefix')) {
                    name.prefix = [String(resource.get('Patient.name.HumanName.prefix').value)];
                }
                if (resource.has('Patient.name.HumanName.suffix')) {
                    name.suffix = [String(resource.get('Patient.name.HumanName.suffix').value)];
                }
                const _name = data_type_factory_1.DataTypeFactory.createHumanName(name).toJSON();
                if (!fhir_util_1.FHIRUtil.isEmpty(_name)) {
                    if ((_h = patient.name) === null || _h === void 0 ? void 0 : _h.length)
                        patient.name.push(_name);
                    else
                        patient.name = [_name];
                }
            }
            const patientAddress = keys.filter(_ => _.startsWith('Patient.address'));
            if (patientAddress.length) {
                const address = {};
                if (resource.has('Patient.address.Address.type')) {
                    address.type = String(resource.get('Patient.address.Address.type').value);
                }
                if (resource.has('Patient.address.Address.text')) {
                    address.text = String(resource.get('Patient.address.Address.text').value);
                }
                if (resource.has('Patient.address.Address.line')) {
                    address.line = [String(resource.get('Patient.address.Address.line').value)];
                }
                if (resource.has('Patient.address.Address.city')) {
                    address.city = String(resource.get('Patient.address.Address.city').value);
                }
                if (resource.has('Patient.address.Address.district')) {
                    address.district = String(resource.get('Patient.address.Address.district').value);
                }
                if (resource.has('Patient.address.Address.state')) {
                    address.state = String(resource.get('Patient.address.Address.state').value);
                }
                if (resource.has('Patient.address.Address.postalCode')) {
                    address.postalCode = String(resource.get('Patient.address.Address.postalCode').value);
                }
                if (resource.has('Patient.address.Address.country')) {
                    address.country = String(resource.get('Patient.address.Address.country').value);
                }
                const _address = data_type_factory_1.DataTypeFactory.createAddress(address).toJSON();
                if (!fhir_util_1.FHIRUtil.isEmpty(_address)) {
                    if ((_j = patient.address) === null || _j === void 0 ? void 0 : _j.length)
                        patient.address.push(_address);
                    else
                        patient.address = [_address];
                }
            }
            patient.id = this.generateID(patient);
            if (patient.id) {
                resolve(patient);
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
exports.Patient = Patient;
//# sourceMappingURL=Patient.js.map