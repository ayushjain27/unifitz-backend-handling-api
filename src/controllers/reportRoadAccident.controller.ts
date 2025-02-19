import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import { ReportRoadAccidentService } from '../services';
import { body } from 'express-validator';
import Logger from '../config/winston';
import { Response } from 'express';
import HttpStatusCodes from 'http-status-codes';
import Request from '../types/request';

@injectable()
export class ReportRoadAccidentController {
  private reportRoadAccidentService: ReportRoadAccidentService;
  constructor(
    @inject(TYPES.ReportRoadAccidentService) reportRoadAccidentService: ReportRoadAccidentService
  ) {
    this.reportRoadAccidentService = reportRoadAccidentService;
  }

  createReportRoadAccidentUserDetail = async (req: Request, res: Response) => {
    const userDetailrequest = req.body;
    Logger.info(
      '<Controller>:<ReportRoadAccidentController>:<Create report road accident user detail controller initiated>'
    );
    try {
      const result = await this.reportRoadAccidentService.create(userDetailrequest);
      res.send({
        message: 'Employee Creation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  validate = (method: string) => {
    switch (method) {
      case 'createReportRoadAccidentUserDetail':
        return [
            body('reportId', 'Report Id is required')
            .exists()
            .isString(),
            body('phoneNumber', 'Phone Number is required')
              .exists()
              .isString(),
        ];
    }
  };
}
