"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FamilyMemberHistoryCondition = exports.AllergyIntoleranceReaction = exports.Timing = exports.ReferenceRange = exports.Reference = exports.Ratio = exports.Range = exports.Quantity = exports.Period = exports.OrganizationContact = exports.Note = exports.Identifier = exports.HumanName = exports.GoalTarget = exports.ContactPoint = exports.Coding = exports.CodeableConcept = exports.CareTeamMember = exports.AuditEventSource = exports.AuditEventAgentNetwork = exports.AuditEventAgent = exports.Attachment = exports.AppointmentParticipant = exports.Age = exports.Address = void 0;
const data_type_factory_1 = require("./factory/data-type-factory");
const fhir_util_1 = require("./../utils/fhir-util");
class Address {
    constructor(address) {
        this.line = [];
        this.use = address.use;
        this.type = address.type;
        this.text = address.text;
        this.line = address.line;
        this.city = address.city;
        this.district = address.district;
        this.state = address.state;
        this.postalCode = address.postalCode;
        this.country = address.country;
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            use: this.use,
            type: this.type,
            text: this.text,
            line: this.line,
            city: this.city,
            district: this.district,
            state: this.state,
            postalCode: this.postalCode,
            country: this.country
        });
    }
}
exports.Address = Address;
class Age {
    constructor(age) {
        this.value = age.value;
        this.system = age.system;
        this.code = age.code;
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            value: this.value,
            system: this.system,
            code: this.code
        });
    }
}
exports.Age = Age;
class AppointmentParticipant {
    constructor(participant) {
        this.type = [];
        if (participant.type) {
            for (const type of participant.type) {
                this.type.push(data_type_factory_1.DataTypeFactory.createCodeableConcept(type));
            }
        }
        this.actor = data_type_factory_1.DataTypeFactory.createReference(participant.actor);
        this.required = participant.required;
        this.status = participant.status;
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            type: (this.type && this.type.length) ? this.type.map((t) => t.toJSON()) : undefined,
            actor: this.actor,
            required: this.required,
            status: this.status
        });
    }
}
exports.AppointmentParticipant = AppointmentParticipant;
class Attachment {
    constructor(attachment) {
        if (!attachment) {
            return;
        }
        this.contentType = attachment.contentType;
        this.language = attachment.language;
        this.data = attachment.data;
        this.url = attachment.url;
        this.size = attachment.size;
        this.hash = attachment.hash;
        this.title = attachment.title;
        this.creation = attachment.creation ? new Date(attachment.creation) : null;
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            contentType: this.contentType,
            language: this.language,
            data: this.data,
            url: this.url,
            size: this.size,
            hash: this.hash,
            title: this.title,
            creation: this.creation && this.creation.toISOString()
        });
    }
}
exports.Attachment = Attachment;
class AuditEventAgent {
    constructor(agent) {
        this.userId = data_type_factory_1.DataTypeFactory.createIdentifier(agent.userId);
        this.reference = data_type_factory_1.DataTypeFactory.createReference(agent.reference);
        this.altId = agent.altId;
        this.name = agent.name;
        this.requestor = agent.requestor;
        this.network = data_type_factory_1.DataTypeFactory.createAuditEventAgentNetwork(agent.network);
        if (agent.role) {
            this.role = [];
            for (const role of agent.role) {
                this.role.push(data_type_factory_1.DataTypeFactory.createCodeableConcept(role));
            }
        }
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            role: (this.role && this.role.length) ? this.role.map((role) => role.toJSON()) : undefined,
            reference: this.reference && this.reference.toJSON(),
            userId: this.userId && this.userId.toJSON(),
            altId: this.altId,
            name: this.name,
            requestor: this.requestor,
            network: this.network && this.network.toJSON()
        });
    }
}
exports.AuditEventAgent = AuditEventAgent;
class AuditEventAgentNetwork {
    constructor(network) {
        this.address = network.address;
        this.type = network.type;
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            address: this.address,
            type: this.type
        });
    }
}
exports.AuditEventAgentNetwork = AuditEventAgentNetwork;
class AuditEventSource {
    constructor(source) {
        this.site = source.site;
        this.identifier = data_type_factory_1.DataTypeFactory.createIdentifier(source.identifier);
        if (source.type) {
            this.type = [];
            for (const coding of source.type) {
                this.type.push(data_type_factory_1.DataTypeFactory.createCoding(coding));
            }
        }
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            site: this.site,
            identifier: this.identifier && this.identifier.toJSON(),
            type: this.type && this.type.map((c) => c.toJSON())
        });
    }
}
exports.AuditEventSource = AuditEventSource;
class CareTeamMember {
    constructor(member) {
        if (member.extension) {
            // for (const extension of member.extension) {
            //   if (extension.url === environment.extensions.CARE_TEAM_MANAGER) {
            //     this.isManager = extension.valueBoolean
            //   }
            // }
        }
        this.role = data_type_factory_1.DataTypeFactory.createCodeableConcept(member.role);
        this.member = data_type_factory_1.DataTypeFactory.createReference(member.member);
        this.onBehalfOf = data_type_factory_1.DataTypeFactory.createReference(member.onBehalfOf);
        this.period = data_type_factory_1.DataTypeFactory.createPeriod(member.period);
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            // extension: (this.isManager == null) ? null : [{
            //   url: environment.extensions.CARE_TEAM_MANAGER,
            //   valueBoolean: this.isManager
            // }],
            role: this.role && this.role.toJSON(),
            member: this.member,
            onBehalfOf: this.onBehalfOf,
            period: this.period && this.period.toJSON()
        });
    }
}
exports.CareTeamMember = CareTeamMember;
class CodeableConcept {
    constructor(codeableConcept) {
        this.coding = [];
        if (!codeableConcept) {
            return null;
        }
        if (codeableConcept.coding) {
            for (const coding of codeableConcept.coding) {
                this.coding.push(data_type_factory_1.DataTypeFactory.createCoding(coding));
            }
        }
        this.text = codeableConcept.text;
    }
    getCodes() {
        return (this.coding || []).map((_coding) => _coding.code).filter(_ => _);
    }
    getDisplays() {
        return (this.coding || []).map((_coding) => _coding.display).filter(_ => _);
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            coding: this.coding && this.coding.map((c) => c.toJSON()),
            text: this.text
        });
    }
}
exports.CodeableConcept = CodeableConcept;
class Coding {
    constructor(coding) {
        this.system = coding.system;
        this.version = coding.version;
        this.code = coding.code;
        this.display = coding.display;
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            system: this.system,
            version: this.version,
            code: this.code,
            display: this.display
        });
    }
}
exports.Coding = Coding;
class ContactPoint {
    constructor(contactPoint) {
        this.system = contactPoint.system;
        this.value = contactPoint.value;
        this.use = contactPoint.use;
        this.rank = contactPoint.rank;
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            system: this.system,
            value: this.value,
            use: this.use,
            rank: this.rank
        });
    }
}
exports.ContactPoint = ContactPoint;
// export class Dosage implements IElement {
//
//   text: string
//   timing: Timing
//   asNeeded: boolean
//   site: CodeableConcept
//   route: CodeableConcept
//   doseAndRate: Quantity
//   maxDosePerAdministration: Quantity
//
//   public constructor (dosage: fhir.DosageInstruction) {
//     this.text = dosage.text
//     this.timing = DataTypeFactory.createTiming(dosage.timing)
//     this.asNeeded = dosage.asNeededBoolean
//     this.site = DataTypeFactory.createCodeableConcept(dosage.site)
//     this.route = DataTypeFactory.createCodeableConcept(dosage.route)
//     this.dose = DataTypeFactory.createQuantity(dosage.doseQuantity)
//     this.maxDosePerAdministration = DataTypeFactory.createQuantity(dosage.maxDosePerAdministration)
//   }
//
//   toJSON (): fhir.DosageInstruction {
//     if (this.dose && this.dose.code && !this.dose.system) {
//       this.dose.system = 'http://unitsofmeasure.org'
//     }
//     return FHIRUtil.cleanJSON({
//       text: this.text,
//       timing: this.timing && this.timing.toJSON(),
//       asNeededBoolean: this.asNeeded,
//       site: this.site && this.site.toJSON(),
//       route: this.route && this.route.toJSON(),
//       doseQuantity: this.dose && this.dose.toJSON(),
//       maxDosePerAdministration: this.maxDosePerAdministration && this.maxDosePerAdministration.toJSON()
//     })
//   }
// }
// export class DoseAndRateElement implements IElement{
//   type: CodeableConcept
//   doseRange: Range
//   doseQuantity: Quantity
//   rateRange: Range
//   rateQuantity: Quantity
//
//   constructor () {
//
//   }
//
// }
class GoalTarget {
    constructor(target) {
        this.measure = data_type_factory_1.DataTypeFactory.createCodeableConcept(target.measure);
        this.detailQuantity = data_type_factory_1.DataTypeFactory.createQuantity(target.detailQuantity);
        this.detailRange = data_type_factory_1.DataTypeFactory.createRange(target.detailRange);
        this.detailCodeableConcept = data_type_factory_1.DataTypeFactory.createCodeableConcept(target.detailCodeableConcept);
        this.dueDate = target.dueDate ? new Date(target.dueDate) : null;
        if (target.extension) {
            this.components = [];
            target.extension.filter(extension => extension.url === 'component').forEach(extension => {
                const component = {};
                extension.extension.forEach(_ext => {
                    switch (_ext.url) {
                        case 'measure':
                            component.measure = _ext.valueCodeableConcept;
                            break;
                        case 'value':
                            if (_ext.valueQuantity) {
                                component.detailQuantity = _ext.valueQuantity;
                            }
                            else if (_ext.valueRange) {
                                component.detailRange = _ext.valueRange;
                            }
                            break;
                    }
                });
                const componentObj = data_type_factory_1.DataTypeFactory.createGoalTarget(component);
                if (componentObj) {
                    this.components.push(componentObj);
                }
            });
            if (!this.components.length) {
                this.components = undefined;
            }
        }
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            extension: this.components && this.components.length ? this.components.map(component => {
                return {
                    url: 'component',
                    extension: [{
                            url: 'measure',
                            valueCodeableConcept: component.measure && component.measure.toJSON()
                        }, fhir_util_1.FHIRUtil.cleanJSON({
                            url: 'value',
                            valueRange: component.detailRange ? component.detailRange.toJSON() : undefined,
                            valueQuantity: component.detailQuantity ? component.detailQuantity.toJSON() : undefined
                        })]
                };
            }) : undefined,
            measure: this.measure && this.measure.toJSON(),
            detailQuantity: this.detailQuantity && this.detailQuantity.toJSON(),
            detailRange: this.detailRange && this.detailRange.toJSON(),
            detailCodeableConcept: this.detailCodeableConcept && this.detailCodeableConcept.toJSON(),
            dueDate: this.dueDate && this.dueDate.toISODateString()
        });
    }
}
exports.GoalTarget = GoalTarget;
class HumanName {
    constructor(humanName) {
        this.use = humanName.use;
        this.text = humanName.text;
        this.family = humanName.family;
        this.given = humanName.given;
        this.prefix = humanName.prefix;
        this.suffix = humanName.suffix;
        this.period = data_type_factory_1.DataTypeFactory.createPeriod(humanName.period);
    }
    toJSON() {
        var _a;
        return fhir_util_1.FHIRUtil.cleanJSON({
            use: this.use,
            text: this.text,
            family: this.family,
            given: this.given,
            prefix: this.prefix,
            suffix: this.suffix,
            period: (_a = this.period) === null || _a === void 0 ? void 0 : _a.toJSON()
        });
    }
}
exports.HumanName = HumanName;
class Identifier {
    constructor(identifier) {
        this.use = identifier.use;
        this.type = data_type_factory_1.DataTypeFactory.createCodeableConcept(identifier.type);
        this.system = identifier.system;
        this.value = identifier.value;
        this.period = data_type_factory_1.DataTypeFactory.createPeriod(identifier.period);
        this.assigner = data_type_factory_1.DataTypeFactory.createReference(identifier.assigner);
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            use: this.use,
            type: this.type && this.type.toJSON(),
            system: this.system,
            value: this.value,
            period: this.period && this.period.toJSON(),
            assigner: this.assigner
        });
    }
}
exports.Identifier = Identifier;
class Note {
    constructor(resource) {
        this.authorReference = data_type_factory_1.DataTypeFactory.createReference(resource.authorReference);
        this.authorString = resource.authorString;
        this.time = resource.time ? new Date(resource.time) : null;
        this.text = resource.text;
        // for (const extension of (resource.extension || [])) {
        //   if (extension.url === environment.extensions.ACTION_TYPE) {
        //     this.action = <'create'|'update'|'delete'>extension.valueCode
        //   }
        // }
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            authorReference: this.authorReference,
            authorString: this.authorString,
            time: this.time && this.time.toISOString(),
            text: this.text
            // extension: this.action ? [{
            // url: environment.extensions.ACTION_TYPE,
            //   valueCode: this.action
            // }] : undefined
        });
    }
}
exports.Note = Note;
class OrganizationContact {
    constructor(contact) {
        this.telecom = [];
        if (contact.name) {
            this.name = '';
            this.prefix = contact.name.prefix;
            this.given = contact.name.given;
            this.family = contact.name.family;
            if (this.prefix) {
                for (const prefix of this.prefix) {
                    this.name += prefix + ' ';
                }
            }
            if (this.given) {
                for (const given of this.given) {
                    this.name += given + ' ';
                }
            }
            this.name += this.family;
        }
        this.purpose = data_type_factory_1.DataTypeFactory.createCodeableConcept(contact.purpose);
        this.address = data_type_factory_1.DataTypeFactory.createAddress(contact.address);
        if (contact.telecom) {
            for (const telecom of contact.telecom) {
                this.telecom.push(data_type_factory_1.DataTypeFactory.createContactPoint(telecom));
            }
        }
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            name: fhir_util_1.FHIRUtil.cleanJSON({
                prefix: this.prefix,
                given: this.given,
                family: this.family
            }),
            purpose: this.purpose && this.purpose.toJSON(),
            address: this.address && this.address.toJSON(),
            telecom: this.telecom && this.telecom.map((t) => t.toJSON())
        });
    }
}
exports.OrganizationContact = OrganizationContact;
class Period {
    constructor(period) {
        if (!period) {
            return;
        }
        this.start = period.start ? new Date(period.start).toISOString() : null;
        this.end = period.end ? new Date(period.end).toISOString() : null;
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            start: this.start,
            end: this.end
        });
    }
}
exports.Period = Period;
class Quantity {
    constructor(quantity) {
        this.value = quantity.value;
        this.unit = quantity.unit;
        this.system = quantity.system;
        this.code = quantity.code;
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            value: this.value,
            unit: this.unit,
            system: this.system,
            code: this.code
        });
    }
}
exports.Quantity = Quantity;
class Range {
    constructor(range) {
        this.low = data_type_factory_1.DataTypeFactory.createQuantity(range.low);
        this.high = data_type_factory_1.DataTypeFactory.createQuantity(range.high);
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            low: this.low && this.low.toJSON(),
            high: this.high && this.high.toJSON()
        });
    }
}
exports.Range = Range;
class Ratio {
    constructor(ratio) {
        this.numerator = data_type_factory_1.DataTypeFactory.createQuantity(ratio.numerator);
        this.denominator = data_type_factory_1.DataTypeFactory.createQuantity(ratio.denominator);
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            numerator: this.numerator && this.numerator.toJSON(),
            denominator: this.denominator && this.denominator.toJSON()
        });
    }
}
exports.Ratio = Ratio;
class Reference {
    constructor(ref) {
        this.reference = ref.reference;
        this.identifier = data_type_factory_1.DataTypeFactory.createIdentifier(ref.identifier);
        this.display = ref.display;
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            reference: this.reference,
            identifier: this.identifier && this.identifier.toJSON(),
            display: this.display
        });
    }
}
exports.Reference = Reference;
class ReferenceRange {
    constructor(referenceRange) {
        this.low = data_type_factory_1.DataTypeFactory.createQuantity(referenceRange.low);
        this.high = data_type_factory_1.DataTypeFactory.createQuantity(referenceRange.high);
        this.age = data_type_factory_1.DataTypeFactory.createRange(referenceRange.age);
        this.text = referenceRange.text;
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            low: this.low && this.low.toJSON(),
            high: this.high && this.high.toJSON(),
            age: this.age && this.age.toJSON(),
            text: this.text
        });
    }
}
exports.ReferenceRange = ReferenceRange;
class Timing {
    constructor(timing) {
        this.event = [];
        if (timing.event) {
            for (const event of timing.event) {
                this.event.push(new Date(event));
            }
        }
        this.code = data_type_factory_1.DataTypeFactory.createCodeableConcept(timing.code);
        if (timing.repeat) {
            this.bounds = data_type_factory_1.DataTypeFactory.createPeriod(timing.repeat.boundsPeriod);
            this.count = timing.repeat.count;
            this.countMax = timing.repeat.countMax;
            this.duration = timing.repeat.duration;
            this.durationMax = timing.repeat.durationMax;
            this.durationUnit = timing.repeat.durationUnit;
            this.frequency = timing.repeat.frequency;
            this.frequencyMax = timing.repeat.frequencyMax;
            this.period = timing.repeat.period;
            this.periodMax = timing.repeat.periodMax;
            this.periodUnit = timing.repeat.periodUnit;
            this.dayOfWeek = timing.repeat.dayOfWeek;
            this.timeOfDay = timing.repeat.timeOfDay;
            this.when = timing.repeat.when;
            this.offset = timing.repeat.offset;
        }
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            event: (this.event && this.event.length) ? this.event.map((e) => e.toISOString()) : undefined,
            code: this.code && this.code.toJSON(),
            repeat: fhir_util_1.FHIRUtil.cleanJSON({
                boundsPeriod: this.bounds && this.bounds.toJSON(),
                count: this.count,
                countMax: this.countMax,
                duration: this.duration,
                durationMax: this.durationMax,
                durationUnit: this.durationUnit,
                frequency: this.frequency,
                frequencyMax: this.frequencyMax,
                period: this.period,
                periodMax: this.periodMax,
                periodUnit: this.periodUnit,
                dayOfWeek: this.dayOfWeek,
                timeOfDay: this.timeOfDay,
                when: this.when,
                offset: this.offset
            })
        });
    }
}
exports.Timing = Timing;
class AllergyIntoleranceReaction {
    constructor(reaction) {
        this.manifestation = [];
        this.substance = data_type_factory_1.DataTypeFactory.createCodeableConcept(reaction.substance);
        if (reaction.manifestation) {
            for (const manifestation of reaction.manifestation) {
                this.manifestation.push(data_type_factory_1.DataTypeFactory.createCodeableConcept(manifestation));
            }
        }
        this.description = reaction.description;
        this.onset = reaction.onset ? new Date(reaction.onset) : null;
        this.severity = reaction.severity;
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            substance: this.substance && this.substance.toJSON(),
            manifestation: this.manifestation && this.manifestation.map((m) => m.toJSON()),
            description: this.description,
            onset: this.onset && this.onset.toISOString(),
            severity: this.severity
        });
    }
}
exports.AllergyIntoleranceReaction = AllergyIntoleranceReaction;
class FamilyMemberHistoryCondition {
    constructor(fmhCondition) {
        this.note = [];
        this.code = data_type_factory_1.DataTypeFactory.createCodeableConcept(fmhCondition.code);
        this.outcome = data_type_factory_1.DataTypeFactory.createCodeableConcept(fmhCondition.outcome);
        // TODO: this.onset = fmhCondition.onset...
        for (const note of (fmhCondition.note || [])) {
            this.note.push(data_type_factory_1.DataTypeFactory.createNote(note));
        }
    }
    toJSON() {
        return fhir_util_1.FHIRUtil.cleanJSON({
            code: this.code && this.code.toJSON(),
            outcome: this.outcome && this.outcome.toJSON(),
            // onset...: this.onset,
            note: (this.note && this.note.length) ? this.note.map((n) => n.toJSON()) : undefined
        });
    }
}
exports.FamilyMemberHistoryCondition = FamilyMemberHistoryCondition;
//# sourceMappingURL=data-type-model.js.map