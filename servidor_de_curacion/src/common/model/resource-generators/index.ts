import { Patient } from './Patient'
import { Observation } from './Observation'
import { ImagingStudy } from './ImagingStudy'
import { Organization } from './Organization'
import { Device } from './Device'
import { FamilyMemberHistory } from './FamilyMemberHistory'
import { DiagnosticReport } from './DiagnosticReport'

const generators: Map<string, any> = new Map<string, any>()
generators.set('Patient', new Patient())
generators.set('Observation', new Observation())
generators.set('ImagingStudy', new ImagingStudy())
generators.set('FamilyMemberHistory', new FamilyMemberHistory())
generators.set('Organization', new Organization())
generators.set('DiagnosticReport', new DiagnosticReport())
generators.set('Device', new Device())

export default generators
