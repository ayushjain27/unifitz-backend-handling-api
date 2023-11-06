import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Request from '../types/request';
import { JobCardService } from './../services/jobCard.service';

@injectable()
export class JobCardController {
  private jobCardService: JobCardService;
  constructor(@inject(TYPES.JobCardService) jobCardService: JobCardService) {
    this.jobCardService = jobCardService;
  }

  createJobCard = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const jobCardRequest = req.body;
    Logger.info(
      '<Controller>:<JobCardController>:<Create jobcard controller initiated>'
    );
    try {
      const result = await this.jobCardService.create(jobCardRequest, req);
      res.send({
        message: 'Job Card Creation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  validate = (method: string) => {
    switch (method) {
      case 'createJobCard':
        return [
          body('storeId', 'Store Id does not exist').exists().isString(),

          body('customerName', 'Customer name does not existzz')
            .exists()
            .isString(),

          body('mobileNumber', 'Mobile number does not exist')
            .exists()
            .isString()
        ];
    }
  };
}
