"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Organization = void 0;
const data_type_factory_1 = require("./../factory/data-type-factory");
const fhir_util_1 = require("./../../utils/fhir-util");
const tslog_1 = require("tslog");
const log = new tslog_1.Logger();
class Organization {
    Organization() { }
    generateResource(resource, profile) {
        const organization = { resourceType: 'Organization' };
        return new Promise((resolve, reject) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            const keys = Array.from(resource.keys());
            if (resource.has('Organization.id')) {
                organization.id = String(((_a = resource.get('Organization.id')) === null || _a === void 0 ? void 0 : _a.value) || '');
            }
            const _meta = keys.filter(_ => _.startsWith('Organization.meta'));
            if (_meta.length) {
                const meta = {};
                if (resource.has('Organization.meta.Meta.versionId')) {
                    meta.versionId = String(((_b = resource.get('Organization.meta.Meta.versionId')) === null || _b === void 0 ? void 0 : _b.value) || '');
                }
                if (resource.has('Organization.meta.Meta.source')) {
                    meta.source = String(((_c = resource.get('Organization.meta.Meta.source')) === null || _c === void 0 ? void 0 : _c.value) || '');
                }
                if (resource.has('Organization.meta.Meta.profile')) {
                    meta.profile = [String(((_d = resource.get('Organization.meta.Meta.profile')) === null || _d === void 0 ? void 0 : _d.value) || '')];
                }
                if (resource.has('Organization.meta.Meta.security')) {
                    const item = resource.get('Organization.meta.Meta.security');
                    meta.security = [data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) })];
                }
                if (resource.has('Organization.meta.Meta.tag')) {
                    const item = resource.get('Organization.meta.Meta.tag');
                    meta.tag = [data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) })];
                }
                organization.meta = Object.assign(Object.assign({}, organization.meta), meta);
            }
            // TODO: manage array
            const organizationIdentifier = keys.filter(_ => _.startsWith('Organization.identifier'));
            if (organizationIdentifier.length) {
                const identifier = {};
                if (resource.has('Organization.identifier.Identifier.system')) {
                    identifier.system = String(((_e = resource.get('Organization.identifier.Identifier.system')) === null || _e === void 0 ? void 0 : _e.value) || '');
                }
                if (resource.has('Organization.identifier.Identifier.value')) {
                    identifier.value = String(((_f = resource.get('Organization.identifier.Identifier.value')) === null || _f === void 0 ? void 0 : _f.value) || '');
                }
                organization.identifier = [identifier];
            }
            if (resource.has('Organization.active')) {
                const item = resource.get('Organization.active');
                organization.active = String(item.value).toLowerCase() === 'true';
            }
            // TODO: manage array
            if (resource.has('Organization.type')) {
                const item = resource.get('Organization.type');
                organization.type = [data_type_factory_1.DataTypeFactory.createCodeableConcept({ system: item.fixedUri, code: String(item.value) })];
            }
            if (resource.has('Organization.name')) {
                organization.name = String(resource.get('Organization.name').value);
            }
            if (resource.has('Organization.alias')) {
                organization.alias = [String(resource.get('Organization.alias').value)];
            }
            // TODO: manage array
            const organizationTelecom = keys.filter(_ => _.startsWith('Organization.telecom'));
            if (organizationTelecom.length) {
                // TODO: ContactPoint.period
                const telecom = {};
                if (resource.has('Organization.telecom.ContactPoint.system')) {
                    const item = resource.get('Organization.telecom.ContactPoint.system');
                    telecom.system = String(item.value);
                }
                if (resource.has('Organization.telecom.ContactPoint.value')) {
                    telecom.value = String(resource.get('Organization.telecom.ContactPoint.value').value);
                }
                if (resource.has('Organization.telecom.ContactPoint.use')) {
                    const item = resource.get('Organization.telecom.ContactPoint.use');
                    telecom.use = String(item.value);
                }
                if (resource.has('Organization.telecom.ContactPoint.rank')) {
                    telecom.rank = Number(resource.get('Organization.telecom.ContactPoint.rank').value);
                }
                const _telecom = data_type_factory_1.DataTypeFactory.createContactPoint(telecom).toJSON();
                if (!fhir_util_1.FHIRUtil.isEmpty(_telecom)) {
                    if ((_g = organization.telecom) === null || _g === void 0 ? void 0 : _g.length)
                        organization.telecom.push(_telecom);
                    else
                        organization.telecom = [_telecom];
                }
            }
            const organizationAddress = keys.filter(_ => _.startsWith('Organization.address'));
            if (organizationAddress.length) {
                const address = {};
                if (resource.has('Organization.address.Address.type')) {
                    address.type = String(resource.get('Organization.address.Address.type').value);
                }
                if (resource.has('Organization.address.Address.text')) {
                    address.text = String(resource.get('Organization.address.Address.text').value);
                }
                if (resource.has('Organization.address.Address.line')) {
                    address.line = [String(resource.get('Organization.address.Address.line').value)];
                }
                if (resource.has('Organization.address.Address.city')) {
                    address.city = String(resource.get('Organization.address.Address.city').value);
                }
                if (resource.has('Organization.address.Address.district')) {
                    address.district = String(resource.get('Organization.address.Address.district').value);
                }
                if (resource.has('Organization.address.Address.state')) {
                    address.state = String(resource.get('Organization.address.Address.state').value);
                }
                if (resource.has('Organization.address.Address.postalCode')) {
                    address.postalCode = String(resource.get('Organization.address.Address.postalCode').value);
                }
                if (resource.has('Organization.address.Address.country')) {
                    address.country = String(resource.get('Organization.address.Address.country').value);
                }
                const _address = data_type_factory_1.DataTypeFactory.createAddress(address).toJSON();
                if (!fhir_util_1.FHIRUtil.isEmpty(_address)) {
                    if ((_h = organization.address) === null || _h === void 0 ? void 0 : _h.length)
                        organization.address.push(_address);
                    else
                        organization.address = [_address];
                }
            }
            const partOf = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'Organization.partOf.Reference.');
            if (partOf)
                organization.partOf = partOf;
            // TODO: manage array
            const organizationContact = keys.filter(_ => _.startsWith('Organization.contact'));
            if (organizationContact.length) {
                const contact = {};
                if (resource.has('Organization.contact.purpose')) {
                    const item = resource.get('Organization.contact.purpose');
                    contact.purpose = data_type_factory_1.DataTypeFactory.createCodeableConcept(data_type_factory_1.DataTypeFactory.createCoding({ system: item.fixedUri, code: String(item.value) }));
                }
                if (resource.has('Organization.contact.name')) {
                    const contactName = keys.filter(_ => _.startsWith('Organization.contact.name'));
                    if (contactName.length) {
                        // TODO: HumanName.period
                        const name = {};
                        if (resource.has('Organization.contact.name.HumanName.use')) {
                            const item = resource.get('Organization.contact.name.HumanName.use');
                            name.use = String(item.value);
                        }
                        if (resource.has('Organization.contact.name.HumanName.text')) {
                            name.text = String(resource.get('Organization.contact.name.HumanName.text').value);
                        }
                        if (resource.has('Organization.contact.name.HumanName.family')) {
                            name.family = String(resource.get('Organization.contact.name.HumanName.family').value);
                        }
                        if (resource.has('Organization.contact.name.HumanName.given')) {
                            name.given = [String(resource.get('Organization.contact.name.HumanName.given').value)];
                        }
                        if (resource.has('Organization.contact.name.HumanName.prefix')) {
                            name.prefix = [String(resource.get('Organization.contact.name.HumanName.prefix').value)];
                        }
                        if (resource.has('Organization.contact.name.HumanName.suffix')) {
                            name.suffix = [String(resource.get('Organization.contact.name.HumanName.suffix').value)];
                        }
                        const _name = data_type_factory_1.DataTypeFactory.createHumanName(name).toJSON();
                        contact.name = _name;
                    }
                }
                const contactTelecom = keys.filter(_ => _.startsWith('Organization.contact.telecom'));
                if (contactTelecom.length) {
                    // TODO: ContactPoint.period
                    const telecom = {};
                    if (resource.has('Organization.contact.telecom.ContactPoint.system')) {
                        const item = resource.get('Organization.contact.telecom.ContactPoint.system');
                        telecom.system = String(item.value);
                    }
                    if (resource.has('Organization.contact.telecom.ContactPoint.value')) {
                        telecom.value = String(resource.get('Organization.contact.telecom.ContactPoint.value').value);
                    }
                    if (resource.has('Organization.contact.telecom.ContactPoint.use')) {
                        const item = resource.get('Organization.contact.telecom.ContactPoint.use');
                        telecom.use = String(item.value);
                    }
                    if (resource.has('Organization.contact.telecom.ContactPoint.rank')) {
                        telecom.rank = Number(resource.get('Organization.contact.telecom.ContactPoint.rank').value);
                    }
                    const _telecom = data_type_factory_1.DataTypeFactory.createContactPoint(telecom).toJSON();
                    if (!fhir_util_1.FHIRUtil.isEmpty(_telecom)) {
                        if ((_j = contact.telecom) === null || _j === void 0 ? void 0 : _j.length)
                            contact.telecom.push(_telecom);
                        else
                            contact.telecom = [_telecom];
                    }
                }
                const contactAddress = keys.filter(_ => _.startsWith('Organization.contact.address'));
                if (contactAddress.length) {
                    const address = {};
                    if (resource.has('Organization.contact.address.Address.type')) {
                        address.type = String(resource.get('Organization.contact.address.Address.type').value);
                    }
                    if (resource.has('Organization.contact.address.Address.text')) {
                        address.text = String(resource.get('Organization.contact.address.Address.text').value);
                    }
                    if (resource.has('Organization.contact.address.Address.line')) {
                        address.line = [String(resource.get('Organization.contact.address.Address.line').value)];
                    }
                    if (resource.has('Organization.contact.address.Address.city')) {
                        address.city = String(resource.get('Organization.contact.address.Address.city').value);
                    }
                    if (resource.has('Organization.contact.address.Address.district')) {
                        address.district = String(resource.get('Organization.contact.address.Address.district').value);
                    }
                    if (resource.has('Organization.contact.address.Address.state')) {
                        address.state = String(resource.get('Organization.contact.address.Address.state').value);
                    }
                    if (resource.has('Organization.contact.address.Address.postalCode')) {
                        address.postalCode = String(resource.get('Organization.contact.address.Address.postalCode').value);
                    }
                    if (resource.has('Organization.contact.address.Address.country')) {
                        address.country = String(resource.get('Organization.contact.address.Address.country').value);
                    }
                    const _address = data_type_factory_1.DataTypeFactory.createAddress(address).toJSON();
                    contact.address = _address;
                }
                const _contact = fhir_util_1.FHIRUtil.cleanJSON(contact);
                if (!fhir_util_1.FHIRUtil.isEmpty(_contact)) {
                    organization.contact = [_contact];
                }
            }
            // TODO: manage array
            const endpoint = fhir_util_1.FHIRUtil.searchForReference(keys, resource, 'Organization.endpoint.Reference.');
            if (endpoint)
                organization.endpoint = [endpoint];
            organization.id = this.generateID(organization);
            if (organization.id) {
                resolve(organization);
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
exports.Organization = Organization;
//# sourceMappingURL=Organization.js.map