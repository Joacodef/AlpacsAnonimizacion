import { DataTypeFactory } from './../factory/data-type-factory'
import { FHIRUtil } from './../../utils/fhir-util'
import { Generator } from './Generator'
import { Logger } from "tslog";

const log: Logger = new Logger();

export class DiagnosticReport implements Generator {

  DiagnosticReport () {}

  public generateResource (resource: Map<string, BufferResource>, profile: string | undefined): Promise<fhir.DiagnosticReport> {
    const diagnosticReport: fhir.DiagnosticReport = { resourceType: 'DiagnosticReport' } as fhir.DiagnosticReport

    return new Promise<fhir.DiagnosticReport>((resolve, reject) => {

      const keys: string[] = Array.from(resource.keys())

      if (resource.has('DiagnosticReport.id')) {
        diagnosticReport.id = String(resource.get('DiagnosticReport.id')?.value || '')
      }

      const _meta = keys.filter(_ => _.startsWith('DiagnosticReport.meta'))
      if (_meta.length) {
        const meta: fhir.Meta = {}
        if (resource.has('DiagnosticReport.meta.Meta.versionId')) {
          meta.versionId = String(resource.get('DiagnosticReport.meta.Meta.versionId')?.value || '')
        }
        if (resource.has('DiagnosticReport.meta.Meta.source')) {
          meta.source = String(resource.get('DiagnosticReport.meta.Meta.source')?.value || '')
        }
        if (resource.has('DiagnosticReport.meta.Meta.profile')) {
          meta.profile = [String(resource.get('DiagnosticReport.meta.Meta.profile')?.value || '')]
        }
        if (resource.has('DiagnosticReport.meta.Meta.security')) {
          const item = resource.get('DiagnosticReport.meta.Meta.security')
          meta.security = [DataTypeFactory.createCoding({system: item.fixedUri, code: String(item.value)})]
        }
        if (resource.has('DiagnosticReport.meta.Meta.tag')) {
          const item = resource.get('DiagnosticReport.meta.Meta.tag')
          meta.tag = [DataTypeFactory.createCoding({system: item.fixedUri, code: String(item.value)})]
        }
        diagnosticReport.meta = {...diagnosticReport.meta, ...meta}
      }

      const diagnosticReportIdentifier = keys.filter(_ => _.startsWith('DiagnosticReport.identifier'))
      if (diagnosticReportIdentifier.length) {
        const identifier: fhir.Identifier = {}
        if (resource.has('DiagnosticReport.identifier.Identifier.system')) {
          identifier.system = String(resource.get('DiagnosticReport.identifier.Identifier.system')?.value || '')
        }
        if (resource.has('DiagnosticReport.identifier.Identifier.value')) {
          identifier.value = String(resource.get('DiagnosticReport.identifier.Identifier.value')?.value || '')
        }

        diagnosticReport.identifier = [identifier]
      }

      if (resource.has('DiagnosticReport.status')) {
        diagnosticReport.status = String(resource.get('DiagnosticReport.status').value)
      }

      if (resource.has('DiagnosticReport.category')) {
        const item = resource.get('DiagnosticReport.category')
        diagnosticReport.category = DataTypeFactory.createCodeableConcept({system: item.fixedUri, code: String(item.value)})
      }

      if (resource.has('DiagnosticReport.code')) {
        const item = resource.get('DiagnosticReport.code')
        diagnosticReport.code = DataTypeFactory.createCodeableConcept({system: item.fixedUri, code: String(item.value), display: String(item.display)})
      }

      const subject = FHIRUtil.searchForReference(keys, resource, 'DiagnosticReport.subject.Reference.')
      if (subject) diagnosticReport.subject = subject

      const encounter = FHIRUtil.searchForReference(keys, resource, 'DiagnosticReport.encounter.Reference.')
      if (encounter) diagnosticReport.encounter = encounter

      if (resource.has('DiagnosticReport.effective[x].dateTime')) {
        const item = resource.get('DiagnosticReport.effective[x].dateTime')
        try {
          let date = item.value
          if (!(date instanceof Date)) { date = DataTypeFactory.createDate(String(item.value)) }
          diagnosticReport.effectiveDateTime = DataTypeFactory.createDateString(date)
        } catch (e) {  }
      }

      const effectivePeriod = keys.filter(_ => _.startsWith('DiagnosticReport.effective[x].Period'))
      if (effectivePeriod.length) {
        const period: fhir.Period = {}
        if (resource.has('DiagnosticReport.effective[x].Period.start')) {
          const item = resource.get('DiagnosticReport.effective[x].Period.start')
          try {
            let date = item.value
            if (!(item.value instanceof Date)) { date = DataTypeFactory.createDate(String(item.value)) }
            period.start = DataTypeFactory.createDateString(date)
          } catch (e) { console.error(e) }
        }
        if (resource.has('DiagnosticReport.effective[x].Period.end')) {
          const item = resource.get('DiagnosticReport.effective[x].Period.end')
          try {
            let date = item.value
            if (!(item.value instanceof Date)) { date = DataTypeFactory.createDate(String(item.value)) }
            period.end = DataTypeFactory.createDateString(date)
          } catch (e) { console.error(e) }
        }

        const _period = DataTypeFactory.createPeriod(period).toJSON()
        if (!FHIRUtil.isEmpty(_period)) {
          diagnosticReport.effectivePeriod = _period
        }
      }

      if (resource.has('DiagnosticReport.issued')) {
        diagnosticReport.issued = String(resource.get('DiagnosticReport.issued').value)
      }

      const performer = FHIRUtil.searchForReference(keys, resource, 'DiagnosticReport.performer.Reference.')
      if (performer) diagnosticReport.performer = [performer]


      const specimen = FHIRUtil.searchForReference(keys, resource, 'DiagnosticReport.specimen.Reference.')
      if (specimen) diagnosticReport.specimen = [specimen]

      const result = FHIRUtil.searchForReference(keys, resource, 'DiagnosticReport.result.Reference.')
      if (result) diagnosticReport.result = [result]

      const imagingStudy = FHIRUtil.searchForReference(keys, resource, 'DiagnosticReport.imagingStudy.Reference.')
      if (imagingStudy) diagnosticReport.imagingStudy = [imagingStudy]

      const DiagnosticReportImage = keys.filter(_ => _.startsWith('DiagnosticReport.media'))
      if (DiagnosticReportImage.length) {
        const image: fhir.DiagnosticReportImage = {} as fhir.DiagnosticReportImage

        if (resource.has('DiagnosticReport.media.comment')) {
          image.comment = String(resource.get('DiagnosticReport.media.comment').value)
        }

        const link = FHIRUtil.searchForReference(keys, resource, 'DiagnosticReport.image.link.Reference.')
        if (link) image.link = link

        const _image = FHIRUtil.cleanJSON(image)
        if (!FHIRUtil.isEmpty(_image)) {
          diagnosticReport.image = [_image]
        }
      }

      if (resource.has('DiagnosticReport.conclusion')) {
        diagnosticReport.conclusion = String(resource.get('DiagnosticReport.conclusion').value)
      }

      if (resource.has('DiagnosticReport.conclusionCode')) {
        const item = resource.get('DiagnosticReport.conclusionCode')
        diagnosticReport.codedDiagnosis = [DataTypeFactory.createCodeableConcept({system: item.fixedUri, code: String(item.value)})]
      }

      diagnosticReport.id = this.generateID(diagnosticReport)
      if (diagnosticReport.id) {
        resolve(diagnosticReport)
      }
      else {
        log.error('Id field is empty')
        reject('Id field is empty')
      }
    })
  }

  public generateID (resource: fhir.DiagnosticReport): string {
    let value: string = ''

    if (resource.id) value += resource.id

    return FHIRUtil.hash(value)
  }

}
