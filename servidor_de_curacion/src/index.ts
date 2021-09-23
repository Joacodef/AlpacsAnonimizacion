'use strict'
import anonymityEngine from './components/AnonymityEngine'
import generatorEngine from './components/GeneratorEngine'
import bodyParser from 'body-parser'
import express from 'express'
import fs from 'fs'
import path from 'path'
import { environment } from './common/environment'
import { DICOMextractor } from './common/services/dicomextractor.service'
import { Logger } from "tslog";
import { CronService } from './common/services/cron.service'

const log: Logger = new Logger();

const PORT = 8484 // process.env.PORT;
const ADDRESS = '0.0.0.0' // 128.0.9.114;

log.info('Initializing Express...')

const expressApp = express()
expressApp.use(bodyParser.json()); // support json encoded bodies
expressApp.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// Prepare Generator Engine
const backgroundGeneratorEngine = new generatorEngine()
backgroundGeneratorEngine.created()
const mappings_path = environment.mappingPath


// POST generate
expressApp.post('/generate', (req, res) => {
  try {
    const mapping_file = req.body.mapping
    const data = req.body.resources
    const checkid = req.body.checkid
    log.silly("nombre de archivo de mapeo:",mapping_file)

    const rawdata = fs.readFileSync(path.join(mappings_path + mapping_file))
    const entries = JSON.parse(rawdata.toString())
    const chunkSize = 1000 // nº of resources per transaction

    if (checkid === "true" && environment.DICOMFilter.encrypt) {
      const DE = new DICOMextractor()
      log.silly("data:",data)
      DE.checkid(entries, data).then(res => {
        backgroundGeneratorEngine.validate(entries.fileSourceList[0], chunkSize, res)
      }).catch(err => {
        log.error("Error at DICOMextractor.checkid: " + err)
      })
    } else {
      backgroundGeneratorEngine.validate(entries.fileSourceList[0], chunkSize, data)
    }
  } catch (error) {
    log.error(error)
  }

  res.json({ message: '200 OK' });
});
// GET privacy_mapping
expressApp.get('/privacy_mapping', (req, res) => {
  const anonymity_mapping = environment.anonymityMapping
  const rawdata = fs.readFileSync(path.join(mappings_path + anonymity_mapping));
  const mappingJSON = JSON.parse(rawdata.toString())
  res.json({ message: '200 OK', data: mappingJSON})
})
// POST deidentify ##SE RECOMIENDO SOLO PARA HACER PRUEBAS
expressApp.post('/deidentify', (req, res) => {
  try {
    const mapping_file = req.body.mapping
    const rawdata = fs.readFileSync(path.join(mappings_path + mapping_file));
    const mappingJSON = JSON.parse(rawdata.toString());
    const backgroundAnonymityEngine = new anonymityEngine(mappingJSON)
    backgroundAnonymityEngine.prepare().then(_ => {
      backgroundAnonymityEngine.anonymizeAll()
    }).catch(err => {
      log.error("Error at prepare data")
      log.error(err)
    })
  } catch (error) {
    log.error(error)
  }
  res.json({ message: '200 OK' });
});

// Initialize CronService
const cronService = new CronService()
cronService.cronAnonymization()

expressApp.listen(PORT, ADDRESS, () => {
  log.info('Fhir Service Online')
  log.info(`Network access via: ${ADDRESS}:${PORT}.`);
});
