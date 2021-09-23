"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Patient_1 = require("./Patient");
const Observation_1 = require("./Observation");
const ImagingStudy_1 = require("./ImagingStudy");
const Organization_1 = require("./Organization");
const Device_1 = require("./Device");
const FamilyMemberHistory_1 = require("./FamilyMemberHistory");
const DiagnosticReport_1 = require("./DiagnosticReport");
const generators = new Map();
generators.set('Patient', new Patient_1.Patient());
generators.set('Observation', new Observation_1.Observation());
generators.set('ImagingStudy', new ImagingStudy_1.ImagingStudy());
generators.set('FamilyMemberHistory', new FamilyMemberHistory_1.FamilyMemberHistory());
generators.set('Organization', new Organization_1.Organization());
generators.set('DiagnosticReport', new DiagnosticReport_1.DiagnosticReport());
generators.set('Device', new Device_1.Device());
exports.default = generators;
//# sourceMappingURL=index.js.map