import cron from "node-cron";
import { environment } from '../environment'
import { Logger } from "tslog";
import { AnonymityHelper } from "../utils/anonymityHelper";

const log: Logger = new Logger();


export class CronService {

    private schedule_active = environment.cronjob.active
    private schedule_code = environment.cronjob.code
    private anonymity_mapping = environment.anonymityMapping
    private anonymityHelper : AnonymityHelper

    constructor () {
      this.anonymityHelper = new AnonymityHelper()
    }

    cronAnonymization () {
      if (this.schedule_active) {
          cron.schedule(this.schedule_code, () => {
            this.anonymityHelper.prepareAnonymize(this.anonymity_mapping)
          })
      }
    }
}