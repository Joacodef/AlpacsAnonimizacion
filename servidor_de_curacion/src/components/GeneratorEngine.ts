import generators from '../common/model/resource-generators'
import Status from '../common/Status'
import { environment } from '../common/environment'
import { FhirService } from '../common/services/fhir.service'
import { TerminologyService } from '../common/services/terminology.service'
import { LoDashStatic } from 'lodash'
import { cellType } from '../common/model/data-table'
import { FHIRUtil } from '../common/utils/fhir-util'
import { FileSource, Record, Sheet, SourceDataElement } from '../common/model/file-source'
import { Logger } from "tslog";

const log: Logger = new Logger();

export default class BackgroundEngine {
  private CHUNK_SIZE: number = 1000
  private fhirBaseUrl: fhir.uri
  private terminologyBaseUrl: fhir.uri
  private mappingObj: Map<string, any> = new Map<string, any>()
  private transformBatch: any[] = []
  $fhirService: FhirService
  $terminologyService: TerminologyService
  $_: LoDashStatic

  created () {
    const url = environment.server.config.source.baseUrl// + ":" + environment.server.config.port
    this.$fhirService = new FhirService(true)
    this.fhirBaseUrl = url
    this.$fhirService.setUrl(this.fhirBaseUrl)
    this.$terminologyService = new TerminologyService()
    this.$terminologyService.setUrl(environment.server.config.terminology.url)
    this.$terminologyService.setAlgorithm(environment.server.config.terminology.algorithm)
  }
  /**
   * Puts resources into the FHIR Repository
   */
  public onTransform (resources) {
    const map: Map<string, fhir.Resource[]> = new Map<string, fhir.Resource[]>()
    resources.forEach(obj => {
      map.set(obj.resource, obj.data)
    })
    const completeResourceList = [].concat(...resources.map(item => { return item.data }))
    // Batch upload resources
    // Max capacity CHUNK_SIZE resources
    const len = Math.ceil(completeResourceList!.length / this.CHUNK_SIZE)

    const batchPromiseList: Promise<any>[] = []
    log.debug("Posting data...")
    for (let i = 0, p = Promise.resolve(); i < len; i++) {
      batchPromiseList.push(p.then(() => new Promise((resolveBatch, rejectBatch) => {
        this.$fhirService.prepareResources(completeResourceList!.slice(i * this.CHUNK_SIZE, (i + 1) * this.CHUNK_SIZE)).then( newResourceList => {
          this.$fhirService.postBatch(newResourceList, 'PUT')
            .then(res => {
              const bundle: fhir.Bundle = res.data as fhir.Bundle
              const outcomeDetails: OutcomeDetail[] = []
              let hasError: boolean = false

              // Check batch bundle response for errors
              Promise.all(bundle.entry.map(_ => {
                if (!_.resource) {
                  if (_.response?.status === '200 OK' || _.response?.status === '201 Created') {
                    outcomeDetails.push({status: Status.SUCCESS, resourceType: _.response.location?.split('/')[0], message: `Status: ${_.response?.status}`} as OutcomeDetail)
                  } else {
                    log.error("Post resource failed.")
                    log.error(_.response?.status)
                    log.error(_.response?.outcome)
                    hasError = true
                    outcomeDetails.push({status: Status.ERROR, resourceType: _.response.location?.split('/')[0], message: `${_.response?.location} : ${_.response?.outcome}`} as OutcomeDetail)
                  }
                } else {
                  log.debug("Post data successful")
                  outcomeDetails.push({status: Status.SUCCESS, resourceType: _.response.location?.split('/')[0], message: `Status: ${_.response?.status}`} as OutcomeDetail)
                }
              }) || [])
                .then(() => {
                  if (hasError) {
                    log.error("Some resources were not created.")
                    rejectBatch(outcomeDetails)
                  } else {
                    log.info("Resources created.")
                    resolveBatch(outcomeDetails)
                  }
                })
                .catch(err => {
                  log.error("Posting data failed.")
                  rejectBatch(err)
                })
            })
            .catch(err => {
              log.error("Posting data failed at postBatch.")
              rejectBatch(err)
            })
          }).catch(err => {
            log.error("Posting data failed at prepareResources.")
            log.error(err)
          })
      }).catch(err => {
        log.error(err)
      })))
    }

    return Promise.all(batchPromiseList)
      .then(res => {
        const concatResult: OutcomeDetail[] = [].concat.apply([], res)
        const status = !concatResult.length || !!concatResult.find(_ => _.status === Status.ERROR) ? Status.ERROR : Status.SUCCESS
      })
  }

  // WIP
  public validate (mappingJson: any, reqChunkSize: number, dataJson: any): Promise<any> {
    this.transformBatch.length = 0 // EMPTY
    const dataToValidate = this.loadRecord(mappingJson)[0]
    const sheets = dataToValidate.sheets
    const fileName = dataToValidate.fileName
    const data = {fileName, sheets}
    // Update chunk size
    this.CHUNK_SIZE = reqChunkSize

    return new Promise<void>((resolveValidation) => {
      const filePath = data.fileName
      const conceptMap: Map<string, fhir.ConceptMap> = new Map<string, fhir.ConceptMap>()
      data.sheets.reduce((promise: Promise<any>, sheet: store.Sheet) =>
          promise.then(() => new Promise<void>((resolveSheet, rejectSheet) => {

            const entries = dataJson
            const sheetRecords: store.Record[] = sheet.records

            // Create resources row by row in entries
            // Start validation operation
            const resources: Map<string, fhir.Resource[]> = new Map<string, fhir.Resource[]>()
            const bufferResourceList: BufferResourceDefinition[] = []
            const conceptMapList: store.ConceptMap[] = []

            Promise.all(entries.map((entry) => {
              return new Promise<void>((resolveOneRow, rejectOneRow) => {
                // For each row create buffer resources

                Promise.all(sheetRecords.map((record: store.Record) => {
                  return new Promise<void>((resolveRecord, rejectRecord) => {
                    if (!resources.get(record.resource)) resources.set(record.resource, [])

                    const generator = generators.get(record.resource)!
                    const bufferResourceMap: Map<string, BufferResource> = new Map<string, BufferResource>()

                    if (generator) {
                      Promise.all(record.data.map((sourceData: store.SourceTargetGroup) => {
                        return new Promise<void>((resolveTargets, rejectTargets) => {
                          const entryValue: any = sourceData.defaultValue || entry[sourceData.value]
                          if (entryValue !== undefined && entryValue !== null && entryValue !== '') {
                            let value = String(entryValue).trim()
                            if (sourceData.type === cellType.n) {
                              value = value.replace(',', '.')
                            }

                            Promise.all(sourceData.target.map((target: store.Target) => {
                              // Buffer Resource creation
                              // target.value.substr(target.value.length - 3) === '[x]'
                              const key = target.type ? `${target.value}.${target.type}` : target.value
                              bufferResourceMap.set(key, FHIRUtil.cleanJSON({
                                value,
                                sourceType: sourceData.type,
                                targetType: target.type,
                                fixedUri: target.fixedUri,
                                display: undefined
                              }))

                              if (sourceData.conceptMap && sourceData.conceptMap.source) {
                                conceptMapList.push({value, resourceKey: key, ...sourceData.conceptMap})
                              }
                            }))
                              .then(() => resolveTargets())
                              .catch(() => rejectTargets())
                          } else resolveTargets()
                        })
                      }))
                        .then(() => {
                          // End of one record
                          bufferResourceList.push({resourceType: record.resource, profile: record.profile, data: bufferResourceMap})
                          resolveRecord()

                        })
                        .catch(err => rejectRecord(err))
                    } else {
                      rejectRecord(`${record.resource} resource couldn't be generated. Generator doesn't exist.`)
                    }
                  })
                }))
                  .then(() => resolveOneRow())
                  .catch(err => rejectOneRow(err))

              })
            }))
              .then(() => { // End of sheet
                let chunkPromise = Promise.resolve()
                if (conceptMapList.length) {
                  log.debug("Translating...")
                  const conceptMappingCountPerResource: number = conceptMapList.length / bufferResourceList.length
                  chunkPromise = chunkPromise.then(() => {
                    return new Promise((resolveChunk, rejectChunk) => {

                      this.$terminologyService.translateBatch(conceptMapList)
                        .then((bundle: fhir.Bundle) => {

                          const bundleEntry: fhir.BundleEntry[] = bundle.entry
                          const bundleEntrySize: number = bundle.entry.length
                          for (let j = 0; j < bundleEntrySize; j++) {
                            if (bundleEntry[j].response.status === '404') {
                              log.warn('Translation not found: ' + JSON.stringify(bundleEntry[j].resource, null, 4))
                            } else {
                              const parametersParameters: fhir.ParametersParameter[] = (bundleEntry[j].resource as fhir.Parameters).parameter

                              if (parametersParameters.find(_ => _.name === 'result')?.valueBoolean === true) {
                                const matchConcept: fhir.ParametersParameter | undefined = parametersParameters.find(_ => _.name === 'match')?.part?.find(_ => _.name === 'concept')
                                if (matchConcept) {
                                  const key: string = conceptMapList[j].resourceKey
                                  bufferResourceList[(j + 1)/conceptMappingCountPerResource - 1].data.get(key).value = matchConcept.valueCoding.code
                                  bufferResourceList[(j + 1)/conceptMappingCountPerResource - 1].data.get(key).fixedUri = matchConcept.valueCoding.system
                                  bufferResourceList[(j + 1)/conceptMappingCountPerResource - 1].data.get(key).display = matchConcept.valueCoding.display
                                }
                              }
                              else if (parametersParameters.find(_ => _.name === 'designation') !== undefined) {
                                const matchConcept: fhir.ParametersParameter | undefined = parametersParameters.find(_ => _.name === 'display')
                                if (matchConcept) {
                                  const key: string = conceptMapList[j].resourceKey
                                  bufferResourceList[(j + 1)/conceptMappingCountPerResource - 1].data.get(key).display = matchConcept.valueString
                                }
                              }
                            }
                          }
                          resolveChunk()
                        })
                        .catch(err => {
                          log.error('Error while trying to translate: ' + err)
                          resolveChunk()
                        })

                    })
                  })
                }

                chunkPromise.then(() => {
                  // End of translation
                  // Generate resources
                  Promise.all(bufferResourceList.map((bufferResourceDefinition: BufferResourceDefinition) => {
                    return new Promise<void>(resolve => {
                      const generator = generators.get(bufferResourceDefinition.resourceType)
                      const currResourceList: fhir.Resource[] = resources.get(bufferResourceDefinition.resourceType)

                      generator.generateResource(bufferResourceDefinition.data, bufferResourceDefinition.profile)
                        .then((res: fhir.Resource) => {

                          currResourceList.push(res)
                          setTimeout(() => { resolve() }, 0)

                        })
                        .catch(err => {

                          setTimeout(() => { resolve() }, 0)

                        })
                    })
                  }))
                    .then(() => {
                      if (entries.length) {
                        Promise.all(Array.from(resources.keys()).map(resourceType => {
                          const resourceList = resources.get(resourceType) || []
                          const dataTransform = { resource: resourceType, data: resourceList }
                          const batchPromiseList: Promise<any>[] = []

                          if (environment.validationRules.performValidation) {
                            log.debug("Validating...")
                            return new Promise((resolve, reject) => {
                              if (environment.validationRules.validateBatch) {
                                // Batch validate resources
                                // Max capacity CHUNK_SIZE resources
                                const len = Math.ceil(resourceList.length / this.CHUNK_SIZE)
                                for (let i = 0, p = Promise.resolve(); i < len; i++) {
                                  batchPromiseList.push(p.then(() => new Promise((resolveBatch, rejectBatch) => {
                                    this.$fhirService.validate(resourceList)
                                      .then(res => {
                                        const outcomeDetails: OutcomeDetail[] = []
                                        // Check response for errors
                                        const operationOutcome: fhir.OperationOutcome = res.data as fhir.OperationOutcome
                                        let isValidated: boolean = true
                                        operationOutcome.issue.map(issue => {
                                          if (issue.severity === 'error' || issue.severity === 'fatal') {
                                            isValidated = false
                                            outcomeDetails.push({status: Status.ERROR, resourceType, message: `${issue.location} : ${issue.diagnostics}`} as OutcomeDetail)
                                            log.error(JSON.stringify(outcomeDetails))
                                            rejectBatch(outcomeDetails)
                                          }
                                        })

                                        if (isValidated) {
                                          outcomeDetails.push({status: Status.SUCCESS, resourceType, message: `Status: ${res.status}`} as OutcomeDetail)
                                          // console.log(JSON.stringify(outcomeDetails))
                                          resolveBatch(outcomeDetails)
                                        }
                                      })
                                      .catch(err => {
                                        rejectBatch(err)
                                      })
                                  })))
                                }
                              } else {
                                // Validate resources one by one, CPU heavy taxing, not recommended
                                const len = resourceList.length
                                for (let i = 0, p = Promise.resolve(); i < len; i++) {
                                  batchPromiseList.push(p.then(() => new Promise((resolveBatch, rejectBatch) => {
                                    this.$fhirService.validateResource(resourceList[i])
                                      .then(res => {
                                        // console.log('response: ' + JSON.stringify(res.status , null, 4))
                                        const outcomeDetails: OutcomeDetail[] = []
                                        // Check response for errors
                                        const operationOutcome: fhir.OperationOutcome = res.data as fhir.OperationOutcome
                                        let isValidated: boolean = true
                                        operationOutcome.issue.map(issue => {
                                          if (issue.severity === 'error' || issue.severity === 'fatal') {
                                            isValidated = false
                                            outcomeDetails.push({status: Status.ERROR, resourceType, message: `${issue.location} : ${issue.diagnostics}`} as OutcomeDetail)
                                            log.error(JSON.stringify(outcomeDetails))
                                            rejectBatch(outcomeDetails)
                                          }
                                        })

                                        if (isValidated) {
                                          outcomeDetails.push({status: Status.SUCCESS, resourceType, message: `Status: ${res.status}`} as OutcomeDetail)
                                          // console.log(JSON.stringify(outcomeDetails))
                                          resolveBatch(outcomeDetails)
                                        }
                                      })
                                      .catch(err => {
                                        console.error("Validation failed for resource: " + resourceList[i].resourceType)
                                        // console.error(JSON.stringify(err.message, null, 4))
                                        rejectBatch(err)
                                      })
                                  })))
                                }
                              }
                              Promise.all(batchPromiseList)
                                .then(res => {
                                  if (res.length) {
                                    this.transformBatch.push(dataTransform)
                                    log.info(`Batch process completed for Resource: ${resourceType}`)
                                    resolve([].concat.apply([], res))
                                  } else {
                                    log.info(`There is no ${resourceType} Resource created. See the logs for detailed error information.`)
                                    reject([{
                                      status: Status.ERROR,
                                      message: `There is no ${resourceType} Resource created. See the logs for detailed error information.`,
                                      resourceType: 'OperationOutcome'
                                    } as OutcomeDetail])
                                  }
                                })
                                .catch(err => {
                                  reject(err)
                                })
                            }).catch(err => {
                              log.error(err)
                            })
                          } else {
                            this.transformBatch.push(dataTransform)
                            return new Promise((resolve, reject) => { resolve("") })
                          }
                        }))
                          .then((res: any[]) => {
                            resolveSheet()
                            const outcomeDetails: OutcomeDetail[] = [].concat.apply([], res)
                            const status = !outcomeDetails.length || !!outcomeDetails.find(_ => _.status === Status.ERROR) ? Status.ERROR : Status.SUCCESS
                          })
                          .catch(err => {
                            log.error(err)
                            resolveSheet()
                          })

                      } else {
                        resolveSheet()
                      }
                    })
                    .catch(err => {
                      log.error(err)
                      resolveSheet()
                    })

                })
              })
              .catch(err => {
                log.error(err)
                resolveSheet()
              })
          }))
        , Promise.resolve()
      )
        .then(() => {
          this.onTransform(this.transformBatch)
          // resolveValidation(this.transformBatch)
          resolveValidation()
        })
        .catch(err => {
          resolveValidation()
        })
    })
  }
  // WIP - ignore
  getMapping (data): Map<string, any> {
    const sourceFileList = [data as FileSource ]
    sourceFileList.map((file: FileSource) => {
      this.mappingObj[file.path] = {}
      const currFile = this.mappingObj[file.path]
      file.sheets?.map((sheet: Sheet) => {

        const columns = (sheet.headers?.filter(h => h.record?.length) || []) as SourceDataElement[]
        currFile[sheet.label] = {}

        columns.map((column: SourceDataElement) => {

          // const groupIds = column.group ? Object.keys(column.group) : []
          column.record!.map((record: Record) => {
            if (record.target && record.target.length) {
              currFile[sheet.label][record.recordId] = [
                ...(currFile[sheet.label][record.recordId] || []),
                FHIRUtil.cleanJSON({
                  value: column.value,
                  type: column.type,
                  target: record.target,
                  conceptMap: column.conceptMap,
                  defaultValue: column.defaultValue
                })
              ]
            }
          })
        })
        this.mappingObj[file.path] = currFile
      })
    })
    return this.mappingObj
  }
  // WIP - ignore
  loadRecord (data): store.SavedRecord[] {
    const savedRecords: store.SavedRecord[] = []
    this.mappingObj = this.getMapping(data)
    Object.keys(this.mappingObj).map((fileName: string) => {
      const file = this.mappingObj[fileName]
      const sheets: store.Sheet[] = []
      Object.keys(file).map((sheetName: string) => {
        // Obj (key, value) (record, header)
        const sheet = file[sheetName]
        const records: store.Record[] = []
        Object.keys(sheet).map((recordId: string) => {
          const record = sheet[recordId]
          records.push(
            {
              recordId,
              resource: record[0].target[0].resource,
              profile: record[0].target[0].profile,
              data: record
            } as store.Record
          )
        })
        if (records.length) sheets.push({sheetName, records})
      })
      if (sheets.length) savedRecords.push({fileName, sheets})
    })
    return savedRecords
  }
}
