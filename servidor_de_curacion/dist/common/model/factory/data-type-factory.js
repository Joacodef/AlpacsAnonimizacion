"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTypeFactory = void 0;
const data_type_model_1 = require("../data-type-model");
class DataTypeFactory {
    static createAddress(address) { return address ? new data_type_model_1.Address(address) : null; }
    static createAge(age) { return age ? new data_type_model_1.Age(age) : null; }
    static createAppointmentParticipant(appointmentParticipant) {
        return appointmentParticipant ? new data_type_model_1.AppointmentParticipant(appointmentParticipant) : null;
    }
    static createAttachment(attachment) { return attachment ? new data_type_model_1.Attachment(attachment) : null; }
    static createAuditEventAgent(auditEventAgent) {
        return auditEventAgent ? new data_type_model_1.AuditEventAgent(auditEventAgent) : null;
    }
    static createAuditEventAgentNetwork(auditEventAgentNetwork) {
        return auditEventAgentNetwork ? new data_type_model_1.AuditEventAgentNetwork(auditEventAgentNetwork) : null;
    }
    static createAuditEventSource(auditEventSource) {
        return auditEventSource ? new data_type_model_1.AuditEventSource(auditEventSource) : null;
    }
    static createCareTeamMember(careTeamMember) {
        return careTeamMember ? new data_type_model_1.CareTeamMember(careTeamMember) : null;
    }
    static createCodeableConcept(coding) {
        return coding ? new data_type_model_1.CodeableConcept({ coding: [coding] }) : null;
    }
    static createCoding(coding) { return coding ? new data_type_model_1.Coding(coding) : null; }
    static createContactPoint(contactPoint) { return contactPoint ? new data_type_model_1.ContactPoint(contactPoint) : null; }
    // static createDosage (dosage: fhir.DosageInstruction): Dosage { return dosage ? new Dosage(dosage) : null }
    static createGoalTarget(target) { return target ? new data_type_model_1.GoalTarget(target) : null; }
    static createHumanName(humanName) { return humanName ? new data_type_model_1.HumanName(humanName) : null; }
    static createIdentifier(identifier) { return identifier ? new data_type_model_1.Identifier(identifier) : null; }
    static createNote(note) { return note ? new data_type_model_1.Note(note) : null; }
    static createOrganizationContact(contact) {
        return contact ? new data_type_model_1.OrganizationContact(contact) : null;
    }
    static createPeriod(period) { return period ? new data_type_model_1.Period(period) : null; }
    static createQuantity(quantity) { return quantity ? new data_type_model_1.Quantity(quantity) : null; }
    static createRange(range) { return range ? new data_type_model_1.Range(range) : null; }
    static createRatio(ratio) { return ratio ? new data_type_model_1.Ratio(ratio) : null; }
    static createReference(reference) { return reference ? new data_type_model_1.Reference(reference) : null; }
    static createReferenceRange(referenceRange) {
        return referenceRange ? new data_type_model_1.ReferenceRange(referenceRange) : null;
    }
    static createTiming(timing) { return timing ? new data_type_model_1.Timing(timing) : null; }
    static createAllergyIntoleranceReaction(reaction) {
        return reaction ? new data_type_model_1.AllergyIntoleranceReaction(reaction) : null;
    }
    static createFamilyMemberHistoryCondition(fmhCondition) {
        return fmhCondition ? new data_type_model_1.FamilyMemberHistoryCondition(fmhCondition) : null;
    }
    static createDate(date) {
        return date ? new Date(date) : null;
    }
    static createDateString(date) {
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
    }
    static shortenDate(date) {
        return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
    }
}
exports.DataTypeFactory = DataTypeFactory;
//# sourceMappingURL=data-type-factory.js.map