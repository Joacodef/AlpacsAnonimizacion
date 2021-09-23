import Status from '../common/Status'
import {environment} from '../common/environment';
import {DeidentificationService} from '../common/services/deidentification.service';
import {Utils} from '../common/utils/util';
import {EvaluationService} from '../common/services/evaluation.service';
import { reject } from 'lodash';
import { Logger } from "tslog";

const log: Logger = new Logger();

export default class Deidentifier {
    // private state: {
    //     requiredElements: [],
    //     attributeMappings: {},
    //     parameterMappings: {},
    //     kAnonymityValidMappings: {},
    //     kValueMappings: {},
    //     evaluationService: any,
    //     typeMappings: {},
    //     rareValueMappings: {},
    //     deidentificationResults: {},
    //     profileUrlMappings: {},
    //     outcomeDetails: [],
    //     selectedResources: []
    // }
    private requiredElements = [];
    private attributeMappings = {};
    private parameterMappings = {};
    private kAnonymityValidMappings = {};
    private kValueMappings = {};
    private evaluationService;
    private typeMappings = {};
    private rareValueMappings = {};
    private deidentificationResults = {};
    private profileUrlMappings = {};
    private outcomeDetails = [];
    private selectedResources: any[] = [];

    private willBeAnonyed: string[] = [];
    private groupedByProfiles: string[] = [];
    private deidentificationService: any;
    private deidentificationStatus: Status = Status.LOADING;
    private mappingList: any[] = [];
    private selectedResource: string = '';
    private currentPage: number = 1;
    private isRestricted: boolean = true;
    private restrictedResourceNumber: number = 0;
    private loading: boolean = false;
    private saving: boolean = false;
    private savedResourceNumber: number = 0;
    private sourceIsTarget = environment.server.config.source.baseUrl === environment.server.config.target.baseUrl

    // get attributeMappings (): any { return this.state.attributeMappings }
    // set attributeMappings (value) { this.state.attributeMappings = value }

    // get parameterMappings (): any { return this.state.parameterMappings }
    // set parameterMappings (value) { this.state.parameterMappings = value }

    // get typeMappings (): any { return this.state.typeMappings }
    // set typeMappings (value) { this.state.typeMappings = value }

    // get rareValueMappings (): any { return this.state.rareValueMappings }
    // set rareValueMappings (value) { this.state.rareValueMappings = value }

    // get requiredElements (): any { return this.state.requiredElements }
    // set requiredElements (value) { this.state.requiredElements = value }

    // get kAnonymityValidMappings (): any { return this.state.kAnonymityValidMappings }
    // set kAnonymityValidMappings (value) { this.state.kAnonymityValidMappings = value }

    // get kValueMappings (): any { return this.state.kValueMappings }
    // set kValueMappings (value) { this.state.kValueMappings = value }

    // get deidentificationResults (): any { return this.state.deidentificationResults }
    // set deidentificationResults (value) { this.state.deidentificationResults = value }

    // get profileUrlMappings (): any { return this.state.profileUrlMappings }
    // set profileUrlMappings (value) { this.state.profileUrlMappings = value }

    // get selectedResources (): any { return this.state.selectedResources }
    // set selectedResources (value) { this.state.selectedResources = value }

    constructor (mappingJSON) {
        // this.selectedResources = ["Patient"]
        this.typeMappings = mappingJSON.typeMappings;
        this.parameterMappings = mappingJSON.parameterMappings;
        this.rareValueMappings = mappingJSON.rareValueMappings;
        this.requiredElements = mappingJSON.requiredElements || [];
        this.attributeMappings = mappingJSON.attributeMappings;
        this.kAnonymityValidMappings = mappingJSON.kAnonymityValidMappings;
        this.kValueMappings = mappingJSON.kValueMappings;
    }

    created () {
        this.deidentificationService = new DeidentificationService(this.typeMappings, this.parameterMappings, this.rareValueMappings, this.requiredElements);
        this.evaluationService = new EvaluationService();

        Object.keys(this.attributeMappings).forEach(key => {
            if (this.attributeMappings[key] !== environment.attributeTypes.INSENSITIVE) {
                this.willBeAnonyed.push(key);
            }
        });
        if (this.willBeAnonyed.length) {
            this.groupedByProfiles = Utils.groupBy(this.willBeAnonyed, item => {
                return [item.split('.')[1]];
            });
            const groupedByResources = Utils.groupBy(this.groupedByProfiles, attributes => {
                return [attributes[0].split('.')[0]];
            });
            this.deidentificationResults = {};
            this.fetchAllData(groupedByResources).then(res => {
                this.deidentificationStatus = Status.PENDING;
            }).catch(err => err);
        } else {
            this.deidentificationStatus = Status.PENDING;
        }
    }

    prepare (): Promise<void> {
        return new Promise((resolve, reject) => {
            this.deidentificationService = new DeidentificationService(this.typeMappings, this.parameterMappings, this.rareValueMappings, this.requiredElements);
            this.evaluationService = new EvaluationService();

            Object.keys(this.attributeMappings).forEach(key => {
                if (this.attributeMappings[key] !== environment.attributeTypes.INSENSITIVE) {
                    this.willBeAnonyed.push(key);
                }
            });
            if (this.willBeAnonyed.length) {
                this.groupedByProfiles = Utils.groupBy(this.willBeAnonyed, item => {
                    return [item.split('.')[1]];
                });
                const groupedByResources = Utils.groupBy(this.groupedByProfiles, attributes => {
                    return [attributes[0].split('.')[0]];
                });
                this.deidentificationResults = {};
                this.fetchAllData(groupedByResources).then(res => {
                    this.deidentificationStatus = Status.PENDING;
                    resolve()
                }).catch(err => {
                    reject(err)
                });
            } else {
                this.deidentificationStatus = Status.PENDING;
                resolve()
            }
        })
    }

    fetchAllData (groupedByResources): Promise<any> {
        const dataPromises = groupedByResources.map(profileGroups => {
            return new Promise<void>((resolve, reject) => {
                const baseResource = profileGroups.find(attributes => attributes[0].split('.')[0] === attributes[0].split('.')[1]);
                if (baseResource) { // fetch all data of base resource
                    const resource = baseResource[0].split('.')[0];
                    if (!this.deidentificationResults[resource]) {
                        this.deidentificationResults[resource] = {status: Status.LOADING, entries: [], count: 0, outcomeDetails: [],
                            risks: [], restrictedEntries: [], informationLoss: 0};
                    }
                    this.deidentificationService.getEntries(resource, resource).then(entries => {
                        this.deidentificationResults[resource].entries = entries.entries;
                        if (entries.entries !== undefined) {
                            this.deidentificationResults[resource].count = entries.entries.length;
                            this.deidentificationResults[resource].status = Status.PENDING;
                            this.getResultsAsMapping();
                            resolve();
                        } else {
                            reject('No resources found')
                        }
                    }).catch(err => {
                        reject(err)
                    });
                } else { // fetch profiles' data and put them in entries
                    const profilePromises = profileGroups.map(groups => {
                        const resource = groups[0].split('.')[0];
                        const profile = groups[0].split('.')[1];
                        if (!this.deidentificationResults[resource]) {
                            this.deidentificationResults[resource] = {status: Status.LOADING, entries: [], count: 0, outcomeDetails: [],
                                risks: [], restrictedEntries: [], informationLoss: 0};
                        }
                        return this.deidentificationService.getEntries(resource, profile)
                    });
                    Promise.all(profilePromises).then(results => {
                        results.forEach((result: any) => {
                            this.deidentificationResults[result.resource].entries.push(...result.entries);
                            this.deidentificationResults[result.resource].count += result.entries.length;
                            this.deidentificationResults[result.resource].status = Status.PENDING;
                            this.getResultsAsMapping();
                        });
                        resolve();
                    }).catch(err => {
                        reject(err)
                    });
                }
            });
        });
        return new Promise<void>((resolve, reject) => {
            Promise.all(dataPromises).then(res => resolve()).catch(err => reject(err));
        });
    }

    anonymizeAll () {
        const selectedResourceNames = this.selectedResources.map(obj => obj.resource);
        // const selectedResourceNames = this.selectedResources
        const selectedGroups = this.groupedByProfiles.filter(attributes => {
            const resource: string = attributes[0].split('.')[0];
            return selectedResourceNames.includes(resource);
        })
        this.restrictedResourceNumber = 0;
        this.deidentificationStatus = Status.IN_PROGRESS;
        const promises = selectedGroups.map(attributes => {
            const resource: string = attributes[0].split('.')[0];
            this.deidentificationResults[resource].status = Status.IN_PROGRESS;
            this.getResultsAsMapping();

            const profile: string = attributes[0].split('.')[1];
            const identifiers: string[][] = [];
            const quasis: string[][] = [];
            const sensitives: string[][] = [];
            for (const key of attributes) {
                if (this.attributeMappings[key] === environment.attributeTypes.ID) {
                    identifiers.push(key.split('.').slice(2));
                } else if (this.attributeMappings[key] === environment.attributeTypes.QUASI) {
                    quasis.push(key.split('.').slice(2));
                } else if (this.attributeMappings[key] === environment.attributeTypes.SENSITIVE) {
                    sensitives.push(key.split('.').slice(2));
                }
            }
            const resourceEntries = this.deidentificationResults[resource].entries;
            const entries = JSON.parse(JSON.stringify(resourceEntries));
            if (resource !== profile) { // not the base resource, needs to be filtered
                // UNCOMMENT AND RETRIEVE this.profileUrlMappings[profile] TO ALLOW MULTIPLE PROFILES
                // [entries, this.deidentificationResults[resource].entries] = Utils.partition(resourceEntries,
                //     entry => entry.resource.meta.profile.includes(this.profileUrlMappings[profile]));
                return this.deidentificationService.deidentify(resource, profile, identifiers, quasis, sensitives, entries,
                    this.kAnonymityValidMappings[resource], this.kValueMappings[resource]);
            } else { // base resource
                return new Promise((resolve, reject) => {
                    // base resources will be de-identified later in order to contain profiles as well
                    resolve({isBaseResource: true, resource, identifiers, quasis, sensitives});
                });
            }
        });
        Promise.all(promises).then(response => {
            const baseResources: any[] = [];
            const validatedResources: string[] = [];
            response.forEach((type: any) => {
                if (!type.isBaseResource) {
                    this.deidentificationResults[type.resource].entries.push(...type.entries);
                    this.deidentificationResults[type.resource].restrictedEntries.push(...type.restrictedEntries);
                    // this.$store.dispatch(types.Fhir.CALCULATE_RISKS, type);
                    this.calculateRisk(type);
                }
                const baseResource = response.find(res => res.isBaseResource && res.resource === type.resource);
                if (baseResource && !baseResources.includes(baseResource)) {
                    baseResources.push(baseResource);
                }
            });
            response.forEach((type: any) => {
                const resource = baseResources.find(res => res.resource === type.resource);
                if (!resource && !validatedResources.includes(type.resource)) {
                    // this.validateEntriesByType(type.resource);
                    this.saveEntriesByType(type.resource);
                    validatedResources.push(type.resource);
                }
            });
            baseResources.forEach(baseResource => {
                const resource = baseResource.resource;
                const entries = JSON.parse(JSON.stringify(this.deidentificationResults[resource].entries));
                this.deidentificationService.deidentify(resource, resource, baseResource.identifiers, baseResource.quasis,
                    baseResource.sensitives, entries, this.kAnonymityValidMappings[resource], this.kValueMappings[resource]).then(type => {
                    this.deidentificationResults[type.resource].entries = type.entries;
                    this.deidentificationResults[type.resource].restrictedEntries.push(...type.restrictedEntries);
                    // this.$store.dispatch(types.Fhir.CALCULATE_RISKS, type);
                    this.calculateRisk(type);
                    // this.validateEntriesByType(type.resource);
                    this.saveEntriesByType(type.resource);
                }).catch(err => err);
            });
        }).catch(err => err);
    }

    saveEntriesByType (resourceType) {
        this.deidentificationResults[resourceType].status = Status.DONE;
        this.deidentificationStatus = Status.SUCCESS;
        // this.$notify.success(String(this.$t('SUCCESS.RESOURCES_ARE_DEIDENTIFIED')));
        log.info('Success: resources are deifentified')
        this.showWarningForRestrictedResources(this.deidentificationResults[resourceType].restrictedEntries.length);
        this.getResultsAsMapping();
        this.saveToRepository(this.sourceIsTarget);
    }

    validateEntriesByType (resourceType) {
        this.deidentificationResults[resourceType].outcomeDetails = [];
        const entries = this.deidentificationResults[resourceType].entries;
        if (!entries.length) {
            this.deidentificationResults[resourceType].status = Status.DONE;
            this.deidentificationStatus = Status.SUCCESS;
            // this.$notify.success(String(this.$t('SUCCESS.RESOURCES_ARE_DEIDENTIFIED')));
            log.info('Success: resources are deifentified')
            this.showWarningForRestrictedResources(this.deidentificationResults[resourceType].restrictedEntries.length);
            this.getResultsAsMapping();
            this.saveToRepository(this.sourceIsTarget);
        } else {
            this.validateEntries(entries).then(response => {
                response.forEach(bulk => {
                    bulk.data.entry.map((entry: fhir.BundleEntry) => {
                        let operationOutcome: fhir.OperationOutcome;
                        if (!entry.resource) {
                            operationOutcome = entry.response?.outcome as fhir.OperationOutcome
                        } else {
                            operationOutcome = entry.resource as fhir.OperationOutcome;
                        }
                        operationOutcome.issue.map(issue => {
                            if (issue.severity === 'error' || issue.severity === 'fatal') {
                                this.deidentificationResults[resourceType].outcomeDetails.push({status: Status.ERROR, resourceType, message: `${issue.location} : ${issue.diagnostics}`} as OutcomeDetail);
                                this.deidentificationResults[resourceType].status = Status.ERROR;
                                this.deidentificationStatus = Status.ERROR;
                                // this.$notify.error(String(this.$t('ERROR.VALIDATION_FAILED')))
                                log.error('Error: Validation Failed')
                            } else if (issue.severity === 'information') {
                                this.deidentificationResults[resourceType].outcomeDetails.push({status: Status.SUCCESS, resourceType, message: `Status: ${entry.response?.status}`} as OutcomeDetail);
                                if (!this.isError(this.deidentificationResults[resourceType].status) && !this.isWarning(this.deidentificationResults[resourceType].status)) {
                                    this.deidentificationResults[resourceType].status = Status.DONE;
                                }
                            } else if (issue.severity === 'warning') {
                                this.deidentificationResults[resourceType].outcomeDetails.push({status: Status.WARNING, resourceType, message: `${issue.location} : ${issue.diagnostics}`} as OutcomeDetail);
                                if (!this.isError(this.deidentificationResults[resourceType].status)) {
                                    this.deidentificationResults[resourceType].status = Status.WARNING;
                                }
                            }
                        })
                    });
                });
                if (!this.isError(this.deidentificationStatus)) {
                    this.deidentificationStatus = Status.SUCCESS;
                    // this.$notify.success(String(this.$t('SUCCESS.RESOURCES_ARE_DEIDENTIFIED')));
                    log.info('Success: resources are deifentified')
                }
                this.showWarningForRestrictedResources(this.deidentificationResults[resourceType].restrictedEntries.length);
                this.getResultsAsMapping();
            }).catch(err => err);
        }
    }

    validateEntries (entries) {
        return this.evaluationService.validateEntries(entries);
    }

    calculateRisk (type) {
        const tempRisk = {profile: type.profile, lowestProsecutor: 0, highestProsecutor: 0, averageProsecutor: 0,
            recordsAffectedByLowest: 0, recordsAffectedByHighest: 0};
        const equivalenceClasses = this.evaluationService.generateEquivalenceClasses(type, this.parameterMappings, this.typeMappings);
        const totalNumberOfRecords = type.entries.length;
        const numberOfEqClasses = equivalenceClasses.length;
        const maxLengthOfEqClasses = Math.max.apply(Math, equivalenceClasses.map(a => a.length));
        const minLengthOfEqClasses = Math.min.apply(Math, equivalenceClasses.map(a => a.length));
        tempRisk.lowestProsecutor = 1 / maxLengthOfEqClasses;
        tempRisk.highestProsecutor = 1 / minLengthOfEqClasses;
        tempRisk.averageProsecutor = numberOfEqClasses / totalNumberOfRecords;

        const numberOfRecsAffectedByLowest = equivalenceClasses.map(a => a.length).filter(a => a >= maxLengthOfEqClasses).length;
        const numberOfRecsAffectedByHighest = equivalenceClasses.map(a => a.length).filter(a => a >= minLengthOfEqClasses).length;
        tempRisk.recordsAffectedByLowest = numberOfRecsAffectedByLowest / totalNumberOfRecords;
        tempRisk.recordsAffectedByHighest = numberOfRecsAffectedByHighest / totalNumberOfRecords;

        this.deidentificationResults[type.resource].risks.push(tempRisk);

        // AECS F. Kohlmayer, et al. in https://doi.org/10.1016/j.jbi.2015.09.007
        // https://books.google.com.tr/books?id=2R7XTlebSF8C&pg=PA215&lpg=PA215&dq=Average+Equivalence+Class+Size&source=bl&ots=WAbLwIhZiY&sig=ACfU3U1viElk7WQkkJIN9CxiWVkFHOfb0A&hl=tr&sa=X&ved=2ahUKEwj_wYqbn9npAhXQOcAKHaWeCDoQ6AEwCXoECAgQAg#v=onepage&q=Average%20Equivalence%20Class%20Size&f=false
        let eqClassSizesSum = 0;
        equivalenceClasses.forEach(eqClass => {
            eqClassSizesSum += Math.pow(eqClass.length, 2);
        })
        this.deidentificationResults[type.resource].informationLoss = eqClassSizesSum / Math.pow(totalNumberOfRecords, 2);
    }

    // openOutcomeDetailCard (outcomeDetails: OutcomeDetail[]) {
    // 	this.$store.commit(types.Fhir.SET_OUTCOME_DETAILS, outcomeDetails)
    // 	this.$q.dialog({
    // 		component: OutcomeCard,
    // 		parent: this
    // 	})
    // }

    // @Watch('deidentificationResults')
    getResultsAsMapping () {
        const mappings: any[] = [];
        for (const resource of Object.keys(this.deidentificationResults)) {
            const tempObj = {resource};
            for (const key of Object.keys(this.deidentificationResults[resource])) {
                tempObj[key] = this.deidentificationResults[resource][key];
            }
            mappings.push(tempObj);
        }
        this.mappingList = mappings;
        if (!this.selectedResources.length) {
            this.selectedResources = this.mappingList.slice();
        } else {
            this.selectedResources = this.selectedResources.map(resource => this.mappingList.find(res => res.resource === resource.resource));
        }
        // this.$forceUpdate();
    }

    saveToRepository (isSource: boolean) {
        this.saving = true;
        this.loading = true;
        // this.$store.dispatch(types.Fhir.SAVE_ENTRIES, isSource)
        this.saveEntries(isSource).then(response => {
                this.savedResourceNumber = response;
                this.loading = false;
                // this.$notify.success(String(this.$t('SUCCESS.RESOURCES_ARE_SAVED')))
                log.info('Success: Resources are saved')
            }).catch(err => {
                this.savedResourceNumber = 0;
                this.loading = false;
                // this.$notify.error(String(this.$t('ERROR.RESOURCES_NOT_SAVED')))
                log.error('Error: Resources not saved')
            });
    }

    saveEntries (isSource) {
        return this.evaluationService.saveEntries(this.deidentificationResults, this.selectedResources, isSource);
    }

    risksShowCondition (risk, risks, resource) {
        const baseResource = risks.find(obj => obj.profile === resource);
        if (baseResource) {
            return risk === baseResource;
        }
        return true;
    }

    progressLabel (progress: number) {
        return (progress * 100).toFixed(2);
    }

    getRiskDetail (risk: string, isLabel: boolean) {
        let langString = isLabel ? 'LABELS.' : 'RISK_INFO.';
        switch (risk) {
            case 'lowestProsecutor':
                langString += 'LOWEST_PROSECUTOR';
                break;
            case 'highestProsecutor':
                langString += 'HIGHEST_PROSECUTOR';
                break;
            case 'averageProsecutor':
                langString += 'AVERAGE_PROSECUTOR';
                break;
            case 'recordsAffectedByLowest':
                langString += 'RECORDS_AFFECTED_BY_LOWEST';
                break;
            case 'recordsAffectedByHighest':
                langString += 'RECORDS_AFFECTED_BY_HIGHEST';
                break;
        }
        return String(langString);
    }

    // exportConfigurations () {
    // 	this.$q.loading.show({spinner: undefined})
    // 	this.$store.dispatch(types.Fhir.CURRENT_STATE).then(state => {
    // 		ipcRenderer.send(ipcChannels.TO_BACKGROUND, ipcChannels.File.EXPORT_FILE, JSON.stringify(state))
    // 		ipcRenderer.on(ipcChannels.File.EXPORT_DONE, (event, result) => {
    // 			if (result) {
    // 				this.$notify.success(String(this.$t('SUCCESS.FILE_IS_EXPORTED')))
    // 			}
    // 			this.$q.loading.hide()
    // 			ipcRenderer.removeAllListeners(ipcChannels.File.EXPORT_DONE)
    // 		})
    // 	})
    // 	.catch(() => {
    // 		this.$q.loading.hide()
    // 		this.$notify.error(String(this.$t('ERROR.CANNOT_EXPORT_CONFIGS')))
    // 	});
    // }

    // saveConfigurations () {
    // 	this.$q.dialog({
    // 		title: `${this.$t('TOOLTIPS.SAVE_CONFIGURATION')}`,
    // 		prompt: {
    // 			model: '',
    // 			isValid: val => val.length > 0,
    // 			type: 'text'
    // 		},
    // 		cancel: true,
    // 		persistent: true
    // 	}).onOk(configName => {
    // 		this.$store.dispatch(types.Fhir.CURRENT_STATE).then(state => {
    // 			let fileStore: any = localStorage.getItem(localStorageKey.EXPORTABLE_STATE)
    // 			if (fileStore) {
    // 				fileStore = JSON.parse(fileStore) as any[]
    // 				fileStore.push({date: new Date(), name: configName, data: state})
    // 			} else {
    // 				fileStore = [{date: new Date(), name: configName, data: state}]
    // 			}
    // 			localStorage.setItem(localStorageKey.EXPORTABLE_STATE, JSON.stringify(fileStore))
    // 			this.$notify.success(String(this.$t('SUCCESS.SAVED')))
    // 		}).catch(err => err);
    // 	})
    // }

    showWarningForRestrictedResources (restricted: number) {
        if (restricted) {
            this.restrictedResourceNumber += restricted;
            // this.restrictionWarning = true;
        }
    }

    // showJSONResources (resourceType: string, isRestricted: boolean) {
    // 	this.currentPage = 1;
    // 	const length = isRestricted ? this.deidentificationResults[resourceType].restrictedEntries.length : this.deidentificationResults[resourceType].entries.length;
    // 	this.maxPage = Math.ceil(length / environment.JSON_NUMBER_IN_A_PAGE);
    // 	this.selectedResource = resourceType;
    // 	this.isRestricted = isRestricted;
    // 	this.jsonResources = true;
    // }

    // getJsonsInPage () {
    // 	const totalPages = environment.JSON_NUMBER_IN_A_PAGE;
    // 	if (this.isRestricted) {
    // 		return this.deidentificationResults[this.selectedResource].restrictedEntries.slice( (this.currentPage - 1) *
    // 			totalPages, (this.currentPage - 1) * totalPages + totalPages );
    // 	} else {
    // 		return this.deidentificationResults[this.selectedResource].entries.slice( (this.currentPage - 1) *
    // 			totalPages, (this.currentPage - 1) * totalPages + totalPages );
    // 	}
    // }

    getResourceNumber (index: number) {
        const previosPages = this.currentPage - 1;
        return this.selectedResource + ' ' + Number((previosPages * environment.JSON_NUMBER_IN_A_PAGE) + index + 1);
    }

    // @Watch('selectedResources', { immediate: true, deep: true })
    // disableSave () {
    // 	if (!this.selectedResources.length) {
    // 		return true;
    // 	}
    // 	for (const resource of this.selectedResources) {
    // 		if (this.isError(resource.status) || this.isInProgress(resource.status) ||
    // 			this.isPending(resource.status) || this.isLoading(resource.status)) {
    // 			return true;
    // 		}
    // 	}
    // 	return false;
    // }

    public isError (value: string): boolean {
        return value === Status.ERROR
    }

    public isWarning (value: string): boolean {
      return value === Status.WARNING
    }
}