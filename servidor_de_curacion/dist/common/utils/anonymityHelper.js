"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnonymityHelper = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const AnonymityEngine_1 = __importDefault(require("../../components/AnonymityEngine"));
const environment_1 = require("../environment");
const tslog_1 = require("tslog");
const log = new tslog_1.Logger();
class AnonymityHelper {
    constructor() {
        this.mappings_path = environment_1.environment.mappingPath;
    }
    prepareAnonymize(mapping_file) {
        log.info('Running anonymization');
        try {
            const rawdata = fs_1.default.readFileSync(path_1.default.join(this.mappings_path + mapping_file));
            const mappingJSON = JSON.parse(rawdata.toString());
            const backgroundAnonymityEngine = new AnonymityEngine_1.default(mappingJSON);
            backgroundAnonymityEngine.prepare().then(_ => {
                backgroundAnonymityEngine.anonymizeAll();
            }).catch(err => {
                log.warn('Failed: ' + err);
            });
        }
        catch (error) {
            log.error(error);
        }
    }
}
exports.AnonymityHelper = AnonymityHelper;
//# sourceMappingURL=anonymityHelper.js.map