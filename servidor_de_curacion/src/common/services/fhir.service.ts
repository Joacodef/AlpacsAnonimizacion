import { environment } from '../../common/environment'
// import { FhirClient } from 'ng-fhir/FhirClient'
const FhirClient = require('fhir.js')
import axios from 'axios'
import http from 'http';
import jsum from 'jsum';
import { Logger } from "tslog";

const log: Logger = new Logger();

export class FhirService {

    config: any;
    client: typeof FhirClient;

    private internal_resource_cache;
    private irc_queue;

    constructor (isSource: boolean, fhirURL?: string) {
        if (fhirURL) {
            if (isSource) {
                environment.server.config.source.baseUrl = fhirURL;
            } else {
                environment.server.config.target.baseUrl = fhirURL;
            }
        }
        this.config = isSource ? environment.server.config.source : environment.server.config.target;
        this.client = new FhirClient(this.config)
        this.internal_resource_cache = {}
        this.irc_queue = []
    }

    /**
     * Set FHIR base url
     * @param url
     */
    setUrl (url: string) {
        this.config.baseUrl = url
        this.client = new FhirClient(this.config)
    }

    /**
     * Returns resources searched by resourceType and query as Bundle
     * @param resourceType
     * @param query
     * @param all
     * @returns {Promise<any>}
     */
    search (resourceType: string, query: any, all?: boolean): Promise<any> {
        if (!all) {
            return this.client.search({type: resourceType, query})
        } else {
            const q = Object.assign({}, query);
            q._summary = 'count';
            return new Promise((resolve, reject) => {
                this.client.search({type: resourceType, query: q})
                    .then(data => {
                        query._count = data.data.total || '1';
                        this.client.search({type: resourceType, query})
                            .then(result => {
                                resolve(result)
                            })
                            .catch(err => {
                                reject(err)
                            })
                    })
                    .catch(err => {
                        reject(err)
                    })
            })
        }
    }

    /**
     * Post resource with given reference ("Resource")
     * @param resource
     * @returns {Promise<any>}
     */
    postResource (resource: any): Promise<any> {
        return this.client.create({resource})
    }

    /**
     * Create resource with PUT request (with given id)
     * @param resource
     * @returns {Promise<any>}
     */
    putResource (resource: any): Promise<any> {
        return this.client.update({resource})
    }

    /**
     * Delete resource with given ResourceType and id (Reference)
     * @param resource
     * @returns {Promise<any>}
     */
    deleteResource (resource: fhir.Resource): Promise<any> {
        return this.client.delete({type: resource.resourceType, id: resource.id});
    }

    /**
     * Batch upload
     * @param resources
     * @param method
     */
    postBatch (resources: fhir.Resource[], method?: 'POST' | 'PUT'): Promise<any> {
        log.debug('Posting resource batch...')
        const httpAgent = new http.Agent({keepAlive: true});
        const transactionResource: fhir.Bundle = {
            resourceType: 'Bundle',
            type: 'batch',
            entry: []
        };
        for (const resource of resources) {
            const request: fhir.BundleEntryRequest = {
                method: method || 'POST',
                url: resource.resourceType + (method === 'PUT' ? `/${resource.id}` : '')
            };
            transactionResource.entry?.push({
                resource,
                request
            });
        }
        return axios.post(this.config.baseUrl, transactionResource, {headers: this.config.headers, httpAgent})
    }

    /**
     * Validates resources in batch
     * @param resources
     */
    validate (resources: fhir.Resource[]): Promise<any> {
        const httpAgent = new http.Agent({keepAlive: true});
        const transactionResource: fhir.Bundle = {
            resourceType: 'Bundle',
            type: 'batch',
            entry: []
        };
        for (const resource of resources) {
            let url;
            if (resource.meta?.profile?.length && resource.meta.profile[0]) {
                url = resource.resourceType + '/$validate?profile=' + resource.meta.profile[0];
            } else {
                url = resource.resourceType + '/$validate';
            }

            const request: fhir.BundleEntryRequest = {
                method: 'POST',
                url
            };
            transactionResource.entry?.push({
                resource,
                request
            })
        }
        return axios.post(this.config.baseUrl, transactionResource, {headers: this.config.headers, httpAgent})
    }

    /**
     * Validates a single resource, batch validation not supported by HAPI FHIR
     * @param resources
     */
    validateResource (resource: fhir.Resource): Promise<any> {
        log.debug("Validating resource id: " + resource.id)
        const httpAgent = new http.Agent({keepAlive: true});

        let url

        if (resource.meta?.profile?.length && resource.meta.profile[0])
            url = this.config.baseUrl + '/' + resource.resourceType + '/$validate?profile=' + resource.meta.profile[0]
        else
            url = this.config.baseUrl + '/' + resource.resourceType + '/$validate'

        return axios.post(url, resource, {headers: this.config.headers, httpAgent})
    }

    // HELPERS
    getResourceBy (resourceType: string, query: string, value: string): Promise<any> {
        const url = this.config.baseUrl + '/' + resourceType + '?' + query + '=' + value
        return axios.get(url)
      }

    add_element (array: any[], resource: any, attribute: string): any {
    const should_add_element = new Array<boolean>(array.length).fill(true)
    array.forEach((value, index) => {
        resource[attribute].forEach((iter_item, resource_index) => {
        if (iter_item?.uid === value.uid) {
            should_add_element[index] = false
            if (value.instance) {
            resource[attribute][resource_index] = this.add_element(value.instance, iter_item, 'instance')
            }
        }
        })
    })
    should_add_element.forEach((value, index) => {
        if (value) {
        resource[attribute].push(array[index])
        }
    })
    return resource
    }

    getNumberOf (resource: fhir.ImagingStudy): fhir.ImagingStudy {
    let numberOfSeries = 0
    let numberOfInstances = 0
    resource.series.forEach((thisSeries, seriesIndex) => {
        numberOfInstances += thisSeries.instance.length
        numberOfSeries += 1
        resource.series[seriesIndex].numberOfInstances = thisSeries.instance.length
    })
    resource.numberOfSeries = numberOfSeries
    resource.numberOfInstances = numberOfInstances
    return resource
    }

    fixOrganization (resource: fhir.ImagingStudy, organizations: any): fhir.ImagingStudy {
        if (resource.series !== undefined) {
            resource.series.forEach((thisSeries, seriesIndex) => {
                if (thisSeries.performer !== undefined) {
                    thisSeries.performer.forEach((thisPerformer, performerIndex) => {
                        const reference_string : string = thisPerformer.actor.reference
                        const resource_type = reference_string.split('/')[0]
                        const resource_id = reference_string.split('/')[1]
                        if (resource_type === 'Organization' &&
                            resource.series[seriesIndex].performer[performerIndex].actor !== undefined)
                        {
                            if (organizations[resource_id] !== undefined) {
                                resource.series[seriesIndex].performer[performerIndex].actor.reference = 'Organization/' + organizations[resource_id].id
                            } else {
                                resource.series[seriesIndex].performer[performerIndex] = undefined
                            }
                        }
                    });
                }
            });
        }
        return resource
    }

    prepareResources (resources: fhir.Resource[]): Promise<fhir.Resource[]> {
        const organizationPromises = []
        const organizations = {}
        const unique_resources = {}

        log.debug("Preparing Resources...")

        // Search if Organization exists, and update reference
        if (!environment.additionalRules.postOrganization) {
            // Filter resource array to only keep the unique resources (no duplicates, no 'Organization')
            resources.forEach(resource => {
                if (resource.resourceType === 'Organization') { organizations[resource.id] = resource }
                else { unique_resources[jsum.digest(resource, 'SHA256', 'hex')] = resource }
            })

            for (const [_, organization] of Object.entries(organizations)) {
                const resource: any = organization
                if (resource.resourceType === 'Organization') {
                    organizationPromises.push(
                        this.getResourceBy(resource.resourceType, 'name' , resource.name).then(responseResource => {
                            if (responseResource.data.total !== 0) {
                                // log.debug("Resource Organization with name '" + resource.name + "' found.")
                                organizations[resource.id] = responseResource.data.entry[0].resource
                                return organizations[resource.id]
                            }
                            else {
                                log.warn("Failed: Resource Organization with name '" + resource.name + "' not found.")
                                organizations[resource.id] = undefined
                                return organizations[resource.id]
                            }
                        }).catch(e => { log.error(e) })
                    )
                }
            }
        } else {
            // Filter resource array to only keep the unique resources (no duplicates)
            resources.forEach(resource => { unique_resources[jsum.digest(resource, 'SHA256', 'hex')] = resource })
        }

        return Promise.all(organizationPromises).then(_ => {
            const promises = []
            // Group all Resource 'ImagingStudy' that belongs to the same study
            let last_checksum = ""
            for (const [checksum_key, resource_value] of Object.entries(unique_resources)) {
                const resource: any = resource_value
                if (resource.resourceType === 'ImagingStudy') {
                    if (last_checksum !== "" && unique_resources[last_checksum].id === resource.id) {
                        unique_resources[last_checksum] = this.add_element(resource.series, unique_resources[last_checksum], 'series')
                        unique_resources[last_checksum] = this.getNumberOf(unique_resources[last_checksum])
                        delete unique_resources[checksum_key]
                    } else {
                        last_checksum = checksum_key
                        unique_resources[last_checksum] = this.getNumberOf(unique_resources[last_checksum])
                    }
                }
            }

            for (const [checksum_key, resource_value] of Object.entries(unique_resources)) {
                const resource: any = resource_value
                // Check if resource 'ImagingStudy' is up to date
                if (resource.resourceType === 'ImagingStudy') {
                    let cached_resource = this.internal_resource_cache[resource.id]
                    // Check if resource 'ImagingStudy is in internal cache to avoid unnecessary FHIR requests
                    if (cached_resource) {
                        // Fix reference to Organization
                        if (!environment.additionalRules.postOrganization) {
                            unique_resources[checksum_key] = this.fixOrganization(unique_resources[checksum_key], organizations)
                        }
                        // Update cache resource with new series/instance
                        unique_resources[checksum_key] = this.add_element(cached_resource.series, unique_resources[checksum_key], 'series')
                        unique_resources[checksum_key] = this.getNumberOf(unique_resources[checksum_key])
                        this.internal_resource_cache[resource.id] = unique_resources[checksum_key]
                        cached_resource = unique_resources[checksum_key]
                        // lastIndexOf to search backward, as it is expected to be found at the end of the array
                        const queue_index = this.irc_queue.lastIndexOf(resource.id)
                        if (queue_index !== -1) {
                            delete this.irc_queue[queue_index]
                        }
                        this.irc_queue.push(resource.id)
                        promises.push(cached_resource)
                    } else {
                        promises.push(
                            this.getResourceBy(resource.resourceType, '_id' , resource.id).then(responseResource => {
                                // Fix reference to Organization
                                if (!environment.additionalRules.postOrganization) {
                                    unique_resources[checksum_key] = this.fixOrganization(unique_resources[checksum_key], organizations)
                                }
                                if (responseResource.data.total !== 0) {
                                    const foundResource = responseResource.data.entry[0].resource
                                    unique_resources[checksum_key] = this.add_element(foundResource.series, resource, 'series')
                                    unique_resources[checksum_key] = this.getNumberOf(unique_resources[checksum_key])
                                }
                                // unique_resources[checksum_key].series.forEach((thisSeries, seriesIndex) => {
                                //     thisSeries.performer.forEach((thisperformer, performerIndex) => {
                                //         const reference_string : string = thisperformer.actor.reference
                                //         const resource_type = reference_string.split('/')[0]
                                //         const resource_id = reference_string.split('/')[1]
                                //         if (resource_type === 'Organization') {
                                //             unique_resources[checksum_key].series[seriesIndex].performer[performerIndex].actor.reference = 'Organization/' + organizations[resource_id].id
                                //         }
                                //     });
                                // });
                                this.internal_resource_cache[resource.id] = unique_resources[checksum_key]
                                return unique_resources[checksum_key]
                            }).catch(e => {
                                log.error(e)
                            })
                        )
                    }
                } else {
                    promises.push(resource)
                }
            }

            // Clean cache if neccessary
            this.cleanInternalCache()
            // Return array of resources
            return Promise.all(promises).then(result => {
                return result // .filter(e => {return e != null})
            }).catch(_ => _)
        })
    }

    cleanInternalCache (): void {
        if (this.irc_queue.length > environment.cacheOptions.maxResources) {
            for (let i = 0; i < environment.cacheOptions.onMaxDeleteCount; i++) {
                const front_resource_id = this.irc_queue.shift();
                delete this.internal_resource_cache[front_resource_id]
            }
        }
    }
}
