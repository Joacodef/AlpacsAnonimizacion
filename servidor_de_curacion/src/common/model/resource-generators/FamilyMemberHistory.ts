import { DataTypeFactory } from './../factory/data-type-factory'
import { FHIRUtil } from './../../utils/fhir-util'
import { Generator } from './Generator'
import { Period } from '../data-type-model'
import { Logger } from "tslog";

const log: Logger = new Logger();

export class FamilyMemberHistory implements Generator {

  FamilyMemberHistory () {}

  public generateResource (resource: Map<string, BufferResource>, profile: string | undefined): Promise<fhir.FamilyMemberHistory> {
    const familyMemberHistory: fhir.FamilyMemberHistory = { resourceType: 'FamilyMemberHistory' } as fhir.FamilyMemberHistory

    return new Promise<fhir.FamilyMemberHistory>((resolve, reject) => {

      const keys: string[] = Array.from(resource.keys())

      if (resource.has('FamilyMemberHistory.id')) {
        familyMemberHistory.id = String(resource.get('FamilyMemberHistory.id')?.value || '')
      }

      const _meta = keys.filter(_ => _.startsWith('FamilyMemberHistory.meta'))
      if (_meta.length) {
        const meta: fhir.Meta = {}
        if (resource.has('FamilyMemberHistory.meta.Meta.versionId')) {
          meta.versionId = String(resource.get('FamilyMemberHistory.meta.Meta.versionId')?.value || '')
        }
        if (resource.has('FamilyMemberHistory.meta.Meta.source')) {
          meta.source = String(resource.get('FamilyMemberHistory.meta.Meta.source')?.value || '')
        }
        if (resource.has('FamilyMemberHistory.meta.Meta.profile')) {
          meta.profile = [String(resource.get('FamilyMemberHistory.meta.Meta.profile')?.value || '')]
        }
        if (resource.has('FamilyMemberHistory.meta.Meta.security')) {
          const item = resource.get('FamilyMemberHistory.meta.Meta.security')
          meta.security = [DataTypeFactory.createCoding({system: item.fixedUri, code: String(item.value)})]
        }
        if (resource.has('FamilyMemberHistory.meta.Meta.tag')) {
          const item = resource.get('FamilyMemberHistory.meta.Meta.tag')
          meta.tag = [DataTypeFactory.createCoding({system: item.fixedUri, code: String(item.value)})]
        }
        familyMemberHistory.meta = {...familyMemberHistory.meta, ...meta}
      }

      const familyMemberHistoryIdentifier = keys.filter(_ => _.startsWith('FamilyMemberHistory.identifier'))
      if (familyMemberHistoryIdentifier.length) {
        const identifier: fhir.Identifier = {}
        if (resource.has('FamilyMemberHistory.identifier.Identifier.system')) {
          identifier.system = String(resource.get('FamilyMemberHistory.identifier.Identifier.system')?.value || '')
        }
        if (resource.has('FamilyMemberHistory.identifier.Identifier.value')) {
          identifier.value = String(resource.get('FamilyMemberHistory.identifier.Identifier.value')?.value || '')
        }

        familyMemberHistory.identifier = [identifier]
      }

      if (resource.has('FamilyMemberHistory.status')) {
        familyMemberHistory.status = String(resource.get('FamilyMemberHistory.status').value)
      }

      const patient = FHIRUtil.searchForReference(keys, resource, 'FamilyMemberHistory.patient.Reference.')
      if (patient) familyMemberHistory.patient = patient

      if (resource.has('FamilyMemberHistory.date')) {
        const item = resource.get('FamilyMemberHistory.date')
        try {
          let date = item.value
          if (!(date instanceof Date)) { date = DataTypeFactory.createDate(String(item.value)) }
          familyMemberHistory.date = DataTypeFactory.shortenDate(date)
        } catch (e) {  }
      }

      if (resource.has('FamilyMemberHistory.name')) {
        familyMemberHistory.name = String(resource.get('FamilyMemberHistory.name').value)
      }

      if (resource.has('FamilyMemberHistory.relationship')) {
        const item = resource.get('FamilyMemberHistory.relationship')
        familyMemberHistory.relationship = DataTypeFactory.createCodeableConcept({system: item.fixedUri, code: String(item.value)})
      }

      // TODO as CodeableConcept
      if (resource.has('FamilyMemberHistory.sex')) {
        // familyMemberHistory.gender = String(resource.get('FamilyMemberHistory.sex').value).toLowerCase()
        const codesystemAdministrativeGender: string[] = ['male', 'female', 'unknown', 'other']
        const value = String(resource.get('FamilyMemberHistory.sex').value).toLowerCase()
        if (!codesystemAdministrativeGender.includes(value)) {
          familyMemberHistory.gender = 'unknown'
        } else {
          familyMemberHistory.gender = value
        }
      }

      const bornPeriod = keys.filter(_ => _.startsWith('FamilyMemberHistory.born[x].Period'))
      if (bornPeriod.length) {
        const period: fhir.Period = {}
        if (resource.has('FamilyMemberHistory.born[x].Period.start')) {
          const item = resource.get('FamilyMemberHistory.born[x].Period.start')
          try {
            let date = item.value
            if (!(item.value instanceof Date)) { date = DataTypeFactory.createDate(String(item.value)) }
            period.start = DataTypeFactory.createDateString(date)
          } catch (e) { console.error(e) }
        }
        if (resource.has('FamilyMemberHistory.born[x].Period.end')) {
          const item = resource.get('FamilyMemberHistory.born[x].Period.end')
          try {
            let date = item.value
            if (!(item.value instanceof Date)) { date = DataTypeFactory.createDate(String(item.value)) }
            period.end = DataTypeFactory.createDateString(date)
          } catch (e) { console.error(e) }
        }

        const _period = DataTypeFactory.createPeriod(period).toJSON()
        if (!FHIRUtil.isEmpty(_period)) {
          familyMemberHistory.bornPeriod = _period
        }
      }

      if (resource.has('FamilyMemberHistory.born[x].bornDate')) {
        const item = resource.get('FamilyMemberHistory.born[x].bornDate')
        try {
          let date = item.value
          if (!(date instanceof Date)) { date = DataTypeFactory.createDate(String(item.value)) }
          familyMemberHistory.bornDate = DataTypeFactory.shortenDate(date)
        } catch (e) {  }
      }

      if (resource.has('FamilyMemberHistory.born[x].string')) {
        const item = resource.get('FamilyMemberHistory.born[x].string')
        familyMemberHistory.bornString = String(item.value)
      }

      const ageAge = keys.filter(_ => _.startsWith('FamilyMemberHistory.age[x].Age'))
      if (ageAge.length) {
        const age: fhir.Age = {}
        if (resource.has('FamilyMemberHistory.age[x].Age.value')) {
          const item = resource.get('FamilyMemberHistory.age[x].Age.value')
          age.value = Number(item.value)
        }
        if (resource.has('FamilyMemberHistory.age[x].Age.comparator')) {
          const item = resource.get('FamilyMemberHistory.age[x].Age.comparator')
          age.comparator = String(item.value)
        }
        if (resource.has('FamilyMemberHistory.age[x].Age.unit')) {
          const item = resource.get('FamilyMemberHistory.age[x].Age.unit')
          age.unit = String(item.value)
        }
        if (resource.has('FamilyMemberHistory.age[x].Age.system')) {
          const item = resource.get('FamilyMemberHistory.age[x].Age.system')
          age.system = String(item.value)
        }
        if (resource.has('FamilyMemberHistory.age[x].Age.code')) {
          const item = resource.get('FamilyMemberHistory.age[x].Age.code')
          age.code = String(item.value)
        }

        const _age = DataTypeFactory.createAge(age).toJSON()
        if (!FHIRUtil.isEmpty(_age)) {
          familyMemberHistory.ageAge = _age
        }
      }

      if (resource.has('FamilyMemberHistory.age[x].string')) {
        const item = resource.get('FamilyMemberHistory.age[x].string')
        familyMemberHistory.ageString = String(item.value)
      }

      if (resource.has('FamilyMemberHistory.estimatedAge')) {
        const item = resource.get('FamilyMemberHistory.estimatedAge')
        familyMemberHistory.estimatedAge = String(item.value).toLowerCase() === 'true'
      }

      if (resource.has('FamilyMemberHistory.deceased[x].boolean')) {
        const item = resource.get('FamilyMemberHistory.deceased[x].boolean')
        familyMemberHistory.deceasedBoolean = String(item.value).toLowerCase() === 'true'
      }

      if (resource.has('FamilyMemberHistory.deceased[x].date')) {
        const item = resource.get('FamilyMemberHistory.deceased[x].date')
        try {
          let date = item.value
          if (!(date instanceof Date)) { date = DataTypeFactory.createDate(String(item.value)) }
          familyMemberHistory.deceasedDate = DataTypeFactory.createDateString(date)
        } catch (e) {  }
      }

      const deceasedAge = keys.filter(_ => _.startsWith('FamilyMemberHistory.deceased[x].Age'))
      if (deceasedAge.length) {
        const age: fhir.Age = {}
        if (resource.has('FamilyMemberHistory.deceased[x].Age.value')) {
          const item = resource.get('FamilyMemberHistory.deceased[x].Age.value')
          age.value = Number(item.value)
        }
        if (resource.has('FamilyMemberHistory.deceased[x].Age.comparator')) {
          const item = resource.get('FamilyMemberHistory.deceased[x].Age.comparator')
          age.comparator = String(item.value)
        }
        if (resource.has('FamilyMemberHistory.deceased[x].Age.unit')) {
          const item = resource.get('FamilyMemberHistory.deceased[x].Age.unit')
          age.unit = String(item.value)
        }
        if (resource.has('FamilyMemberHistory.deceased[x].Age.system')) {
          const item = resource.get('FamilyMemberHistory.deceased[x].Age.system')
          age.system = String(item.value)
        }
        if (resource.has('FamilyMemberHistory.deceased[x].Age.code')) {
          const item = resource.get('FamilyMemberHistory.deceased[x].Age.code')
          age.code = String(item.value)
        }

        const _age = DataTypeFactory.createAge(age).toJSON()
        if (!FHIRUtil.isEmpty(_age)) {
          familyMemberHistory.deceasedAge = _age
        }
      }

      if (resource.has('FamilyMemberHistory.deceased[x].string')) {
        const item = resource.get('FamilyMemberHistory.deceased[x].string')
        familyMemberHistory.deceasedString = String(item.value)
      }

      if (resource.has('FamilyMemberHistory.reasonCode')) {
        const item = resource.get('FamilyMemberHistory.reasonCode')
        familyMemberHistory.reasonCode = [DataTypeFactory.createCodeableConcept({system: item.fixedUri, code: String(item.value)})]
      }

      const reasonReference = FHIRUtil.searchForReference(keys, resource, 'FamilyMemberHistory.reasonReference.Reference.')
      if (reasonReference) familyMemberHistory.reasonReference = [reasonReference]

      const FamilyMemberHistoryCondition = keys.filter(_ => _.startsWith('FamilyMemberHistory.condition'))
      if (FamilyMemberHistoryCondition.length) {
        const condition: fhir.FamilyMemberHistoryCondition = {} as fhir.FamilyMemberHistoryCondition
        if (resource.has('FamilyMemberHistory.condition.code')) {
          const item = resource.get('FamilyMemberHistory.condition.code')
          condition.code = DataTypeFactory.createCodeableConcept(
            DataTypeFactory.createCoding({system: item.fixedUri, code: String(item.value)})
          )
        }
        if (resource.has('FamilyMemberHistory.condition.outcome')) {
          const item = resource.get('FamilyMemberHistory.condition.outcome')
          condition.outcome = DataTypeFactory.createCodeableConcept(
            DataTypeFactory.createCoding({system: item.fixedUri, code: String(item.value)})
          )
        }

        if (resource.has('FamilyMemberHistory.condition.contributedToDeath')) {
          const item = resource.get('FamilyMemberHistory.condition.contributedToDeath')
          condition.contributedToDeath = String(item.value).toLowerCase() === 'true'
        }

        const onsetAge = keys.filter(_ => _.startsWith('FamilyMemberHistory.condition.onset[x].Age'))
        if (onsetAge.length) {
          const age: fhir.Age = {}
          if (resource.has('FamilyMemberHistory.condition.onset[x].Age.value')) {
            const item = resource.get('FamilyMemberHistory.condition.onset[x].Age.value')
            age.value = Number(item.value)
          }
          if (resource.has('FamilyMemberHistory.condition.onset[x].Age.comparator')) {
            const item = resource.get('FamilyMemberHistory.condition.onset[x].Age.comparator')
            age.comparator = String(item.value)
          }
          if (resource.has('FamilyMemberHistory.condition.onset[x].Age.unit')) {
            const item = resource.get('FamilyMemberHistory.condition.onset[x].Age.unit')
            age.unit = String(item.value)
          }
          if (resource.has('FamilyMemberHistory.condition.onset[x].Age.system')) {
            const item = resource.get('FamilyMemberHistory.condition.onset[x].Age.system')
            age.system = String(item.value)
          }
          if (resource.has('FamilyMemberHistory.condition.onset[x].Age.code')) {
            const item = resource.get('FamilyMemberHistory.condition.onset[x].Age.code')
            age.code = String(item.value)
          }

          const _age = DataTypeFactory.createAge(age).toJSON()
          if (!FHIRUtil.isEmpty(_age)) {
            condition.onsetAge = _age
          }
        }

        if (resource.has('FamilyMemberHistory.condition.onset[x].string')) {
          const item = resource.get('FamilyMemberHistory.condition.onset[x].string')
          condition.onsetString = String(item.value)
        }

        const onsetRange = keys.filter(_ => _.startsWith('FamilyMemberHistory.condition.onset[x].Period'))
        if (onsetRange.length) {
          const period: fhir.Period = {}
          if (resource.has('FamilyMemberHistory.condition.onset[x].Period.start')) {
            const item = resource.get('FamilyMemberHistory.condition.onset[x].Period.start')
            try {
              let date = item.value
              if (!(item.value instanceof Date)) { date = DataTypeFactory.createDate(String(item.value)) }
              period.start = DataTypeFactory.createDateString(date)
            } catch (e) { console.error(e) }
          }
          if (resource.has('FamilyMemberHistory.condition.onset[x].Period.end')) {
            const item = resource.get('FamilyMemberHistory.condition.onset[x].Period.end')
            try {
              let date = item.value
              if (!(item.value instanceof Date)) { date = DataTypeFactory.createDate(String(item.value)) }
              period.end = DataTypeFactory.createDateString(date)
            } catch (e) { console.error(e) }
          }

          const _period = DataTypeFactory.createPeriod(period).toJSON()
          if (!FHIRUtil.isEmpty(_period)) {
            condition.onsetPeriod = _period
          }
        }

        const _condition = FHIRUtil.cleanJSON(condition)
        if (!FHIRUtil.isEmpty(_condition)) {
          familyMemberHistory.condition = [_condition]
        }
      }

      familyMemberHistory.id = this.generateID(familyMemberHistory)

      if (familyMemberHistory.id) {
        resolve(familyMemberHistory)
      }
      else {
        log.error('Id field is empty')
        reject('Id field is empty')
      }
    })
  }

  public generateID (resource: fhir.FamilyMemberHistory): string {
    let value: string = ''

    if (resource.id) value += resource.id

    return FHIRUtil.hash(value)
  }

}
