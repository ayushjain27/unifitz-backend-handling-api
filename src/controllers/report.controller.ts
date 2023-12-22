import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import { ReportService } from '../services/report.service';
import { body, validationResult, query } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import Logger from '../config/winston';
import { Response } from 'express';
import Request from '../types/request';

@injectable()
export class ReportController {
  private reportService: ReportService;
  constructor(@inject(TYPES.ReportService) reportService: ReportService) {
    this.reportService = reportService;
  }

  createReport = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const reportRequest = req.body;
    Logger.info(
      '<Controller>:<ReportController>:<Create report controller initiated>'
    );
    try {
      const result = await this.reportService.create(reportRequest);
      res.send({
        message: 'Report Creation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateReport = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const reportId = req.params.reportId;
    if (!reportId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Report Id is not present' } });
      return;
    }
    const reportRequest = req.body;
    Logger.info(
      '<Controller>:<ReportController>:<Update report controller initiated>'
    );

    try {
      const result = await this.reportService.update(reportRequest, reportId);
      res.send({
        message: 'Report Update Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAll = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<ReportController>:<Get All request controller initiated>'
    );
    try {
      const userName = req?.userId;
      const role = req?.role;
      // const role = req?.role;
      // if (role !== AdminRole.ADMIN) {
      //   throw new Error('User not allowed');
      // }
      const result = await this.reportService.getAll(userName, role);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllReportsByReportId = async (req: Request, res: Response) => {
    const reportId = req.params.reportId;

    if (!reportId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Report Id is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<ReportController>:<Get All reports by store id controller initiated>'
    );

    try {
      const result = await this.reportService.getReportByReportId(reportId);
      res.send({
        message: 'Report Fetch Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  createNotes = async (req: Request, res: Response) => {
    const { reportId } = req.body;
    Logger.info(
      '<Controller>:<ProductController>:<Upload Product request initiated>'
    );
    const notesRequest = req.body;
    try {
      const userName = req?.userId;
      const result = await this.reportService.createNotes(
        reportId,
        notesRequest,
        userName
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateReportStatus = async (req: Request, res: Response) => {
    const { reportId } = req.body;
    const payload = req.body;
    Logger.info('<Controller>:<ReportController>:<Update Store Status>');

    try {
      const userName = req?.userId;
      const result = await this.reportService.updateStatus(
        reportId,
        payload,
        userName
      );
      Logger.info('<Controller>:<ReportController>: <Report: updated status>');
      res.send({
        message: 'Store Updation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  validate = (method: string) => {
    switch (method) {
      case 'createReport':
        return [
          body('storeId', 'Store Id does not exist').exists().isString(),
          body('customerId', 'Customer Id does not exist').exists().isString()
        ];
    }
  };
}
