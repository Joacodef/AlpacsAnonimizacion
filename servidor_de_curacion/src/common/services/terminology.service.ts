import axios, { AxiosInstance } from 'axios'
import { Logger } from "tslog";

const log: Logger = new Logger();

export class TerminologyService {

  private client: AxiosInstance
  private algorithm: string

  constructor () {}

  /**
   * Update the baseUrl of the client
   * @param url
   */
  setUrl (url: string) {
    this.client = axios.create({
      baseURL: url
    })
  }

  /**
   * Update terminology algorithm
   * @param algorithm
   */
  setAlgorithm (algorithm: string) {
    this.algorithm = algorithm
  }

  /**
   * Verifies Terminology Service CodeSystem endpoint
   */
  verify (): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.get('/CodeSystem/$metadata')
        .then(res => {
          const parameters: fhir.Parameters = res.data
          if (parameters.resourceType === 'Parameters') {
            resolve(res)
          } else {
            reject('ERROR.TERMINOLOGY_URL_NOT_VERIFIED')
          }
        })
        .catch(err => reject('ERROR.TERMINOLOGY_URL_NOT_VERIFIED' + ` ${err}`))
    })
  }

  /**
   * Batch translation/lookup of the values according to the source and target system
   * Executes /ConceptMap/$translate operation or /CodeSystem/$lookup if no target is specified
   * Returns batch-response in a bundle
   * @param body
   */
  translateBatch (body: store.ConceptMap[]): Promise<fhir.Bundle> {
    return new Promise((resolve, reject) => {
      const batchResource: fhir.Bundle = {
        resourceType: 'Bundle',
        type: 'batch',
        entry: []
      }
      for (const conceptMap of body) {
        let request: fhir.BundleEntryRequest
        const resource: fhir.Parameters = {
          resourceType: 'Parameters',
          parameter: []
        }
        if (conceptMap.target) {
          request = {
            method: 'POST',
            url: '/ConceptMap/$translate'
          }
          resource.parameter.push(
            {
              name: 'url',
              valueUri: this.algorithm
            },
            {
              name: 'coding',
              valueCoding: {
                system: conceptMap.source,
                code: conceptMap.value
              }
            },
            {
              name: 'target',
              valueUri: conceptMap.target
            }
          )
        }
        else {
          request = {
            method: 'POST',
            url: '/CodeSystem/$lookup'
          }
          resource.parameter.push(
            {
              valueUri: conceptMap.source,
              name: 'system'
            },
            {
              valueCode: conceptMap.value,
              name: 'code'
            }
          )
        }
        batchResource.entry.push({
          resource,
          request
        })
      }
      this.client.post('', batchResource)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          log.error(err)
          reject(err)
        })
    })
  }

  /**
   * Returns CodeSystem systems
   */
  getCodeSystems (): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.client.get('/CodeSystem/$metadata')
        .then(res => {
          const parameters: fhir.Parameters = res.data
          const codeSystemList: string[] = []

          parameters.parameter.forEach((_: fhir.ParametersParameter) => {
            if ((_.name === 'system' || _.name === 'organization') && _.valueCoding?.system) {
              codeSystemList.push(_.valueCoding.system)
            }
          })

          resolve(codeSystemList)
        })
        .catch(err => reject(err))
    })
  }

}
