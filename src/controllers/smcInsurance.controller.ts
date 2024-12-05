import { inject, injectable } from 'inversify';
import { Response } from 'express';
import HttpStatusCodes from 'http-status-codes';
import { TYPES } from '../config/inversify.types';

import { SmcInsuranceService } from '../services/smcInsurance.service';
import Logger from '../config/winston';

@injectable()
export class SmcInsuranceController {
  private smcInsuranceService: SmcInsuranceService;
  constructor(
    @inject(TYPES.SmcInsuranceService) smcInsuranceService: SmcInsuranceService
  ) {
    this.smcInsuranceService = smcInsuranceService;
  }

  createSmcInsurance = async (req: Request, res: Response) => {
    const smcInsuranceRequest = req.body;
    Logger.info(
      '<Controller>:<SmcInsuranceController>:<Create new smcInsurance controller request controller initiated>'
    );
    try {
      const result = await this.smcInsuranceService.create(smcInsuranceRequest);
      res.send({
        message: 'Smc Insurance Created Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getAllSmcInsurance = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<SmcInsuranceController>:<Get all smcInsurance controller request controller initiated>'
    );
    try {
      const result = await this.smcInsuranceService.getAllSmcInsurance();
      res.send({
        message: 'Smc Insurance Fetched Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };
}
