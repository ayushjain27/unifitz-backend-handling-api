import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Request from '../types/request';
import { JobCardService } from './../services/jobCard.service';
import { CreateInvoiceService } from './../services/createInvoice.service';

@injectable()
export class CreateInvoiceController {
  private createInvoiceService: CreateInvoiceService;
  constructor(
    @inject(TYPES.CreateInvoiceService)
    createInvoiceService: CreateInvoiceService
  ) {
    this.createInvoiceService = createInvoiceService;
  }

  createAdditionalItems = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<CreateInvoiceController>:<Create invoice request initiated>'
    );
    try {
      const result = await this.createInvoiceService.createAdditionalItems(
        req.body
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getInvoiceById = async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Id is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<CreateInvoiceController>:<Get invoice by id controller initiated>'
    );
    try {
      const result = await this.createInvoiceService.getInvoiceById(id);
      res.send({
        message: 'Store Job Card Fetch Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getInvoiceByStoreId = async (req: Request, res: Response) => {
    const storeId = req.params.storeId;

    if (!storeId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Store Id is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<CreateInvoiceController>:<Get invoices by store id controller initiated>'
    );
    try {
      const result = await this.createInvoiceService.getInvoicesByStoreId(
        storeId
      );
      res.send({
        message: 'Store Job Card Fetch Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  invoiceEmail = async (req: Request, res: Response) => {
    const invoiceId = req.query.invoiceId;

    if (!invoiceId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Invoice Id is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<CreateInvoiceController>:<Get invoice email controller initiated>'
    );
    try {
      const result = await this.createInvoiceService.invoiceEmail(
        invoiceId as string
      );
      res.send({
        message: 'Job Card Fetch Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllInvoicePaginated = async (req: Request, res: Response) => {
    const { pageNo, pageSize, startDate, endDate, searchText, state, city } = req.body;
    Logger.info(
      '<Controller>:<CreateInvoiceController>:<Get Paginated Invoice Initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<CreateInvoiceController>:<Get Paginated Invoice Initiated>'
      );
      const result =
        await this.createInvoiceService.getAllInvoicePaginated(
          pageNo,
          pageSize,
          startDate,
          endDate,
          searchText,
          state,
          city
        );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getInvoiceTotalPaymentAnalytics = async (req: Request, res: Response) => {
    const {
      startDate,
      endDate,
      state,
      city,
      searchText,
      oemUserId,
      oemId,
      employeeId
    } = req.body;
    try {
      Logger.info(
        '<Controller>:<CreateInvoiceController>:<get invoice payment analytic request controller initiated>'
      );
      const role = req?.role;
      const userName = req?.userId;
      const result = await this.createInvoiceService.getInvoiceTotalPaymentAnalytics(
        startDate,
        endDate,
        state,
        city,
        searchText,
        oemUserId,
        role,
        userName,
        oemId,
        employeeId
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getHighestInvoice = async (req: Request, res: Response) => {
    const query = req.query;
    try {
      Logger.info(
        '<Controller>:<CreateInvoiceController>:<get highest invoice request controller initiated>'
      );
      const result = await this.createInvoiceService.getHighestInvoice(query);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getTotalInvoiceRevenueByStoreId = async (req: Request, res: Response) => {
    const query = req.query;
    try {
      Logger.info(
        '<Controller>:<CreateInvoiceController>:<get total invoice revenues by storeid request controller initiated>'
      );
      const result = await this.createInvoiceService.getTotalInvoiceRevenueByStoreId(query);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getInvoiceRevenueByStoreId = async (req: Request, res: Response) => {
    const query = req.query;
    try {
      Logger.info(
        '<Controller>:<CreateInvoiceController>:<get invoice revenues by storeid request controller initiated>'
      );
      const result = await this.createInvoiceService.getInvoiceRevenueByStoreId(query);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getInvoiceRevenuePerDayByStoreId = async (req: Request, res: Response) => {
    const query = req.query;
    try {
      Logger.info(
        '<Controller>:<CreateInvoiceController>:<get invoice revenues per day by storeid request controller initiated>'
      );
      const result = await this.createInvoiceService.getInvoiceRevenuePerDayByStoreId(query);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  createInvoice = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<CreateInvoiceController>:<Create invoice request initiated>'
    );
    try {
      const result = await this.createInvoiceService.createInvoice(
        req.body
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getNewInvoicesByStoreId = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<CreateInvoiceController>:<Create invoice request initiated>'
    );
    try {
      const result = await this.createInvoiceService.getNewInvoicesByStoreId(
        req.body
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
}
