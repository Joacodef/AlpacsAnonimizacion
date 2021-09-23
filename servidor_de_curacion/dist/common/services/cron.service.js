"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const environment_1 = require("../environment");
const tslog_1 = require("tslog");
const anonymityHelper_1 = require("../utils/anonymityHelper");
const log = new tslog_1.Logger();
class CronService {
    constructor() {
        this.schedule_active = environment_1.environment.cronjob.active;
        this.schedule_code = environment_1.environment.cronjob.code;
        this.anonymity_mapping = environment_1.environment.anonymityMapping;
        this.anonymityHelper = new anonymityHelper_1.AnonymityHelper();
    }
    cronAnonymization() {
        if (this.schedule_active) {
            node_cron_1.default.schedule(this.schedule_code, () => {
                this.anonymityHelper.prepareAnonymize(this.anonymity_mapping);
            });
        }
    }
}
exports.CronService = CronService;
//# sourceMappingURL=cron.service.js.map