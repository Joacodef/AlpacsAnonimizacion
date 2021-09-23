import fs from 'fs'
import path from 'path'
import anonymityEngine from '../../components/AnonymityEngine'
import { environment } from '../environment'
import { Logger } from "tslog";

const log: Logger = new Logger();

export class AnonymityHelper {

    private mappings_path = environment.mappingPath

    constructor () {}

    prepareAnonymize (mapping_file: string) {
        log.info('Running anonymization')
        try {
            const rawdata = fs.readFileSync(path.join(this.mappings_path + mapping_file));
            const mappingJSON = JSON.parse(rawdata.toString());
            const backgroundAnonymityEngine = new anonymityEngine(mappingJSON)
            backgroundAnonymityEngine.prepare().then(_ => {
                backgroundAnonymityEngine.anonymizeAll()
            }).catch(err => {
                log.warn('Failed: ' + err)
            })
        } catch (error) {
            log.error(error)
        }
    }
}