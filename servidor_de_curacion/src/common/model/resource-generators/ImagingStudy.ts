import { DataTypeFactory } from './../factory/data-type-factory'
import { FHIRUtil } from './../../utils/fhir-util'
import { Generator } from './Generator'
import { Logger } from "tslog";

const log: Logger = new Logger();

export class ImagingStudy implements Generator {

  ImagingStudy () {}

  public generateResource (resource: Map<string, BufferResource>, profile: string | undefined, conceptMap?: any): Promise<fhir.ImagingStudy> {
    const imagingStudy: fhir.ImagingStudy = { resourceType: 'ImagingStudy' } as fhir.ImagingStudy

    return new Promise<fhir.ImagingStudy>((resolve, reject) => {

      const keys: string[] = Array.from(resource.keys())

      if (resource.has('ImagingStudy.id')) {
        imagingStudy.id = String(resource.get('ImagingStudy.id')?.value || '')
      }

      const _meta = keys.filter(_ => _.startsWith('ImagingStudy.meta'))
      if (_meta.length) {
        const meta: fhir.Meta = {}
        if (resource.has('ImagingStudy.meta.Meta.versionId')) {
          meta.versionId = String(resource.get('ImagingStudy.meta.Meta.versionId')?.value || '')
        }
        if (resource.has('ImagingStudy.meta.Meta.source')) {
          meta.source = String(resource.get('ImagingStudy.meta.Meta.source')?.value || '')
        }
        if (resource.has('ImagingStudy.meta.Meta.profile')) {
          meta.profile = [String(resource.get('ImagingStudy.meta.Meta.profile')?.value || '')]
        }
        if (resource.has('ImagingStudy.meta.Meta.security')) {
          const item = resource.get('ImagingStudy.meta.Meta.security')
          meta.security = [DataTypeFactory.createCoding({system: item.fixedUri, code: String(item.value)})]
        }
        if (resource.has('ImagingStudy.meta.Meta.tag')) {
          const item = resource.get('ImagingStudy.meta.Meta.tag')
          meta.tag = [DataTypeFactory.createCoding({system: item.fixedUri, code: String(item.value)})]
        }
        imagingStudy.meta = {...imagingStudy.meta, ...meta}
      }

      const imagingStudyIdentifier = keys.filter(_ => _.startsWith('ImagingStudy.identifier'))
      if (imagingStudyIdentifier.length) {
        const identifier: fhir.Identifier = {}
        if (resource.has('ImagingStudy.identifier.Identifier.system')) {
          identifier.system = String(resource.get('ImagingStudy.identifier.Identifier.system')?.value || '')
        }
        if (resource.has('ImagingStudy.identifier.Identifier.value')) {
          identifier.value = String(resource.get('ImagingStudy.identifier.Identifier.value')?.value || '')
        }

        imagingStudy.identifier = [identifier]
      }

      if (resource.has('ImagingStudy.status')) {
        imagingStudy.status = String(resource.get('ImagingStudy.status').value)
      }

      if (resource.has('ImagingStudy.modality.Coding.code')) {
        const item = resource.get('ImagingStudy.modality.Coding.code')
        imagingStudy.modality = [DataTypeFactory.createCoding({system: item.fixedUri, code: item.value})]
      }

      const subject = FHIRUtil.searchForReference(keys, resource, 'ImagingStudy.subject.Reference.')
      if (subject) imagingStudy.subject = subject

      const encounter = FHIRUtil.searchForReference(keys, resource, 'ImagingStudy.encounter.Reference.')
      if (encounter) imagingStudy.encounter = encounter

      if (resource.has('ImagingStudy.started')) {
        const item = resource.get('ImagingStudy.started')
        try {
          let date = item.value
          if (!(item.value instanceof Date)) { date = DataTypeFactory.createDate(String(item.value)) }
          imagingStudy.started = DataTypeFactory.createDateString(date)
        } catch (e) {  }
      }

      if (resource.has('ImagingStudy.numberOfSeries')) {
        imagingStudy.numberOfSeries = Number(resource.get('ImagingStudy.numberOfSeries').value)
      }

      if (resource.has('ImagingStudy.numberOfInstances')) {
        imagingStudy.numberOfInstances = Number(resource.get('ImagingStudy.numberOfInstances').value)
      }

      if (resource.has('ImagingStudy.reasonCode')) {
        const item = resource.get('ImagingStudy.reasonCode')
        imagingStudy.reasonCode = [DataTypeFactory.createCodeableConcept({system: item.fixedUri, code: String(item.value)})]
      }

      const reasonReference = FHIRUtil.searchForReference(keys, resource, 'ImagingStudy.reasonReference.Reference.')
      if (reasonReference) imagingStudy.reasonReference = [reasonReference]

      if (resource.has('ImagingStudy.description')) {
        imagingStudy.description = String(resource.get('ImagingStudy.description').value)
      }

      const imagingStudySeries = keys.filter(_ => _.startsWith('ImagingStudy.series'))
      if (imagingStudySeries.length) {
        const series: fhir.ImagingStudySeries = {} as fhir.ImagingStudySeries
        if (resource.has('ImagingStudy.series.uid')) {
          series.uid = String(resource.get('ImagingStudy.series.uid').value)
        }
        if (resource.has('ImagingStudy.series.number')) {
          series.number = Number(resource.get('ImagingStudy.series.number').value)
        }
        if (resource.has('ImagingStudy.series.modality.Coding.code')) {
          const item = resource.get('ImagingStudy.series.modality.Coding.code')
          series.modality = DataTypeFactory.createCoding({system: item.fixedUri, code: item.value})
        }
        if (resource.has('ImagingStudy.series.description')) {
          series.description = String(resource.get('ImagingStudy.series.description').value)
        }
        if (resource.has('ImagingStudy.series.numberOfInstances')) {
          series.numberOfInstances = Number(resource.get('ImagingStudy.series.numberOfInstances').value)
        }
        if (resource.has('ImagingStudy.series.bodySite.Coding.code')) {
          const item = resource.get('ImagingStudy.series.bodySite.Coding.code')
          series.bodySite = DataTypeFactory.createCoding({system: item.fixedUri, code: String(item.value), display: String(item.display)})
        }
        if (resource.has('ImagingStudy.series.laterality.Coding.code')) {
          const item = resource.get('ImagingStudy.series.laterality.Coding.code')
          series.laterality = DataTypeFactory.createCoding({system: item.fixedUri, code: String(item.value), display: String(item.display)})
        }
        if (resource.has('ImagingStudy.series.started')) {
          const item = resource.get('ImagingStudy.series.started')
          try {
            let date = item.value
            if (!(item.value instanceof Date)) { date = DataTypeFactory.createDate(String(item.value)) }
            series.started = DataTypeFactory.createDateString(date)
          } catch (e) {  }
        }
        const imagingStudySeriesPerformer = keys.filter(_ => _.startsWith('ImagingStudy.series.performer'))
        const performerActors = keys.filter(_ => _.startsWith('ImagingStudy.series.performer.actor.Reference.'))
        const performerFunctions = keys.filter(_ => _.startsWith('ImagingStudy.series.performer.function.'))
        if (imagingStudySeriesPerformer.length) {
          series.performer = []
          for (let index = 0; index < performerActors.length; index++) {
            const performer: fhir.ImagingStudySeriesPerformer = {} as fhir.ImagingStudySeriesPerformer
            if (resource.has(performerFunctions[index])) {
              const item = resource.get(performerFunctions[index])
              performer.function = DataTypeFactory.createCodeableConcept({system: item.fixedUri, code: String(item.value)})
            }

            const actor = FHIRUtil.searchForReference(keys, resource, performerActors[index])
            if (actor) performer.actor = actor

            const _performer = FHIRUtil.cleanJSON(performer)
            if (!FHIRUtil.isEmpty(_performer)) {
              series.performer.push(_performer)
            }
          }
        }
        const imagingStudySeriesInstance = keys.filter(_ => _.startsWith('ImagingStudy.series.instance'))
        if (imagingStudySeriesInstance.length) {
          const instance: fhir.ImagingStudySeriesInstance = {} as fhir.ImagingStudySeriesInstance
          if (resource.has('ImagingStudy.series.instance.uid')) {
            instance.uid = String(resource.get('ImagingStudy.series.instance.uid').value)
          }
          if (resource.has('ImagingStudy.series.instance.sopClass.Coding.code')) {
            const item = resource.get('ImagingStudy.series.instance.sopClass.Coding.code')
            instance.sopClass = DataTypeFactory.createCoding({system: item.fixedUri, code: item.value})
          }
          if (resource.has('ImagingStudy.series.instance.number')) {
            instance.number = Number(resource.get('ImagingStudy.series.instance.number').value)
          }
          if (resource.has('ImagingStudy.series.instance.title')) {
            instance.title = String(resource.get('ImagingStudy.series.instance.title').value)
          }

          const _instance = FHIRUtil.cleanJSON(instance)
          if (!FHIRUtil.isEmpty(_instance)) {
            series.instance = [_instance]
          }
        }
        const _series = FHIRUtil.cleanJSON(series)
        if (!FHIRUtil.isEmpty(_series)) {
          imagingStudy.series = [_series]
        }
      }

      imagingStudy.id = this.generateID(imagingStudy)


      if (imagingStudy.id) {
        resolve(imagingStudy)
      }
      else {
        log.error('Id field is empty')
        reject('Id field is empty')
      }
    })
  }

  public generateID (resource: fhir.ImagingStudy): string {
    let value: string = ''

    if (resource.id) value += resource.id

    return FHIRUtil.hash(value)
  }

}
