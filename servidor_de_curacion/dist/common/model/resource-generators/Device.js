"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Device = void 0;
const data_type_factory_1 = require("./../factory/data-type-factory");
const fhir_util_1 = require("./../../utils/fhir-util");
const tslog_1 = require("tslog");
const log = new tslog_1.Logger();
class Device {
    Device() { }
    generateResource(resource, profile) {
        const device = { resourceType: 'Device' };
        if (profile)
            device.meta = { profile: [profile] };
        const udiCarrier = {};
        const deviceName = { name: '', type: '' };
        return new Promise((resolve, reject) => {
            var _a, _b, _c, _d, _e, _f;
            const keys = Array.from(resource.keys());
            if (resource.has('Device.id')) {
                device.id = String(((_a = resource.get('Device.id')) === null || _a === void 0 ? void 0 : _a.value) || '');
            }
            const _meta = keys.filter(_ => _.startsWith('Device.meta'));
            if (_meta.length) {
                const meta = {};
                if (resource.has('Device.meta.Meta.versionId')) {
                    meta.versionId = String(((_b = resource.get('Device.meta.Meta.versionId')) === null || _b === void 0 ? void 0 : _b.value) || '');
                }
                if (resource.has('Device.meta.Meta.source')) {
                    meta.source = String(((_c = resource.get('Device.meta.Meta.source')) === null || _c === void 0 ? void 0 : _c.value) || '');
                }
                if (resource.has('Device.meta.Meta.profile')) {
                    meta.profile = [String(((_d = resource.get('Device.meta.Meta.profile')) === null || _d === void 0 ? void 0 : _d.value) || '')];
                }
                if (resource.has('Device.meta.Meta.security')) {
                    const item = resource.get('Device.meta.Meta.security');
                    meta.security = [data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) })];
                }
                if (resource.has('Device.meta.Meta.tag')) {
                    const item = resource.get('Device.meta.Meta.tag');
                    meta.tag = [data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) })];
                }
                device.meta = Object.assign(Object.assign({}, device.meta), meta);
            }
            const deviceIdentifier = keys.filter(_ => _.startsWith('Device.identifier'));
            if (deviceIdentifier.length) {
                const identifier = {};
                if (resource.has('Device.identifier.Identifier.system')) {
                    identifier.system = String(((_e = resource.get('Device.identifier.Identifier.system')) === null || _e === void 0 ? void 0 : _e.value) || '');
                }
                if (resource.has('Device.identifier.Identifier.value')) {
                    identifier.value = String(((_f = resource.get('Device.identifier.Identifier.value')) === null || _f === void 0 ? void 0 : _f.value) || '');
                }
                device.identifier = [identifier];
            }
            if (resource.has('Device.status')) {
                device.status = String(resource.get('Device.status').value);
            }
            const patient = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'Device.patient.Reference.');
            if (patient)
                device.patient = patient;
            const owner = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'Device.owner.Reference.');
            if (owner)
                device.owner = owner;
            const location = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'Device.location.Reference.');
            if (location)
                device.location = location;
            if (resource.has('Device.url')) {
                device.url = String(resource.get('Device.url').value);
            }
            if (resource.has('Device.manufacturer')) {
                device.manufacturer = String(resource.get('Device.manufacturer').value);
            }
            if (resource.has('Device.lotNumber')) {
                device.lotNumber = String(resource.get('Device.lotNumber').value);
            }
            if (resource.has('Device.manufactureDate')) {
                const item = resource.get('Device.manufactureDate');
                try {
                    let date = item.value;
                    if (!(item.value instanceof Date)) {
                        date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                    }
                    device.manufactureDate = data_type_factory_1.DataTypeFactory.createDateString(date);
                }
                catch (e) {
                    console.error(e);
                }
            }
            if (resource.has('Device.expirationDate')) {
                const item = resource.get('Device.expirationDate');
                try {
                    let date = item.value;
                    if (!(item.value instanceof Date)) {
                        date = data_type_factory_1.DataTypeFactory.createDate(String(item.value));
                    }
                    device.expirationDate = data_type_factory_1.DataTypeFactory.createDateString(date);
                }
                catch (e) {
                    console.error(e);
                }
            }
            if (resource.has('Device.serialNumber')) {
                device.serialNumber = String(resource.get('Device.serialNumber').value);
            }
            if (resource.has('Device.deviceName.name')) {
                deviceName.name = String(resource.get('Device.deviceName.name').value);
            }
            if (resource.has('Device.deviceName.type')) {
                deviceName.type = String(resource.get('Device.deviceName.type').value);
            }
            if (resource.has('Device.modelNumber')) {
                device.modelNumber = String(resource.get('Device.modelNumber').value);
            }
            if (resource.has('Device.partNumber')) {
                device.partNumber = String(resource.get('Device.partNumber').value);
            }
            if (resource.has('Device.type')) {
                const item = resource.get('Device.type');
                device.type = data_type_factory_1.DataTypeFactory.createCodeableConcept(data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) }));
            }
            if (resource.has('Device.udiCarrier.deviceIdentifier')) {
                udiCarrier.deviceIdentifier = String(resource.get('Device.udiCarrier.deviceIdentifier').value);
            }
            if (resource.has('Device.udiCarrier.issuer')) {
                udiCarrier.issuer = String(resource.get('Device.udiCarrier.issuer').value);
            }
            if (resource.has('Device.udiCarrier.jurisdiction')) {
                udiCarrier.jurisdiction = String(resource.get('Device.udiCarrier.jurisdiction').value);
            }
            if (resource.has('Device.udiCarrier.carrierAIDC')) {
                udiCarrier.carrierAIDC = String(resource.get('Device.udiCarrier.carrierAIDC').value);
            }
            if (resource.has('Device.udiCarrier.carrierHRF')) {
                udiCarrier.carrierHRF = String(resource.get('Device.udiCarrier.carrierHRF').value);
            }
            if (resource.has('Device.udiCarrier.entryType')) {
                device.status = String(resource.get('Device.udiCarrier.entryType').value);
            }
            if (!fhir_util_1.FHIRUtil.isEmpty(udiCarrier))
                device.udiCarrier = udiCarrier;
            // if (!FHIRUtil.isEmpty(deviceName)) device.deviceName = [deviceName]
            device.id = this.generateID(device);
            if (device.id)
                resolve(device);
            else {
                log.error('Id field is empty');
                reject('Id field is empty');
            }
        });
    }
    generateID(resource) {
        let value = '';
        // TODO: serialNumber ?
        if (resource.id) {
            value += resource.id;
        }
        else {
            if (resource.serialNumber)
                value += resource.serialNumber;
        }
        return fhir_util_1.FHIRUtil.hash(value);
    }
}
exports.Device = Device;
//# sourceMappingURL=Device.js.map