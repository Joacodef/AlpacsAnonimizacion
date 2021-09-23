'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AnonymityEngine_1 = __importDefault(require("./components/AnonymityEngine"));
const GeneratorEngine_1 = __importDefault(require("./components/GeneratorEngine"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const environment_1 = require("./common/environment");
const dicomextractor_service_1 = require("./common/services/dicomextractor.service");
const tslog_1 = require("tslog");
const cron_service_1 = require("./common/services/cron.service");
const log = new tslog_1.Logger();
const PORT = 8484; // process.env.PORT;
const ADDRESS = '0.0.0.0'; // 128.0.9.114;
log.info('Initializing Express...');
const expressApp = express_1.default();
expressApp.use(body_parser_1.default.json()); // support json encoded bodies
expressApp.use(body_parser_1.default.urlencoded({ extended: true })); // support encoded bodies
// Prepare Generator Engine
const backgroundGeneratorEngine = new GeneratorEngine_1.default();
backgroundGeneratorEngine.created();
const mappings_path = environment_1.environment.mappingPath;
// POST generate
expressApp.post('/generate', (req, res) => {
    try {
        const mapping_file = req.body.mapping;
        const data = req.body.resources;
        const checkid = req.body.checkid;
        log.silly("nombre de archivo de mapeo:", mapping_file);
        const rawdata = fs_1.default.readFileSync(path_1.default.join(mappings_path + mapping_file));
        const entries = JSON.parse(rawdata.toString());
        const chunkSize = 1000; // nº of resources per transaction
        if (checkid === "true" && environment_1.environment.DICOMFilter.encrypt) {
            const DE = new dicomextractor_service_1.DICOMextractor();
            log.silly("data:", data);
            DE.checkid(entries, data).then(res => {
                backgroundGeneratorEngine.validate(entries.fileSourceList[0], chunkSize, res);
            }).catch(err => {
                log.error("Error at DICOMextractor.checkid: " + err);
            });
        }
        else {
            backgroundGeneratorEngine.validate(entries.fileSourceList[0], chunkSize, data);
        }
    }
    catch (error) {
        log.error(error);
    }
    res.json({ message: '200 OK' });
});
// GET privacy_mapping
expressApp.get('/privacy_mapping', (req, res) => {
    const anonymity_mapping = environment_1.environment.anonymityMapping;
    const rawdata = fs_1.default.readFileSync(path_1.default.join(mappings_path + anonymity_mapping));
    const mappingJSON = JSON.parse(rawdata.toString());
    res.json({ message: '200 OK', data: mappingJSON });
});
// POST deidentify ##SE RECOMIENDO SOLO PARA HACER PRUEBAS
expressApp.post('/deidentify', (req, res) => {
    try {
        const mapping_file = req.body.mapping;
        const rawdata = fs_1.default.readFileSync(path_1.default.join(mappings_path + mapping_file));
        const mappingJSON = JSON.parse(rawdata.toString());
        const backgroundAnonymityEngine = new AnonymityEngine_1.default(mappingJSON);
        backgroundAnonymityEngine.prepare().then(_ => {
            backgroundAnonymityEngine.anonymizeAll();
        }).catch(err => {
            log.error("Error at prepare data");
            log.error(err);
        });
    }
    catch (error) {
        log.error(error);
    }
    res.json({ message: '200 OK' });
});
// Initialize CronService
const cronService = new cron_service_1.CronService();
cronService.cronAnonymization();
expressApp.listen(PORT, ADDRESS, () => {
    log.info('Fhir Service Online');
    log.info(`Network access via: ${ADDRESS}:${PORT}.`);
});
//# sourceMappingURL=index.js.map