import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Request from '../types/request';
import { JobCardService } from './../services/jobCard.service';
import { start } from 'repl';

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

  createLineItems = async (req: Request, res: Response) => {
    const { jobCardId, lineItems } = req.body;
    Logger.info(
      '<Controller>:<JobCardController>:<Upload Store Customer request initiated>'
    );
    try {
      const result = await this.jobCardService.createStoreLineItems(
        jobCardId,
        lineItems
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getJobCardsByStoreId = async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    const searchValue = req.query.searchValue;

    if (!storeId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Store Id is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<JobCardController>:<Get store job Card by store id controller initiated>'
    );
    try {
      const result = await this.jobCardService.getStoreJobCardsByStoreId(
        storeId,
        searchValue as string
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

  getJobCardById = async (req: Request, res: Response) => {
    const jobCardId = req.query.id;

    if (!jobCardId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Job Card with same id is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<JobCardController>:<Get job card by id controller initiated>'
    );
    try {
      const result = await this.jobCardService.getJobCardById(
        jobCardId as string
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

  updateJobCard = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const jobCardId = req.params.jobCardId;
    if (!jobCardId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'job Card Id is not present' } });
      return;
    }
    const jobCardRequest = req.body;
    Logger.info(
      '<Controller>:<JobCardController>:<Update job card controller initiated>'
    );

    try {
      const result = await this.jobCardService.updateJobCard(
        jobCardRequest,
        jobCardId
      );
      res.send({
        message: 'Job Card Update Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  jobCardEmail = async (req: Request, res: Response) => {
    const jobCardId = req.query.jobCardId;

    if (!jobCardId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Job Card with same id is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<JobCardController>:<Get job card email controller initiated>'
    );
    try {
      const result = await this.jobCardService.jobCardEmail(
        jobCardId as string
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

  filterJobCards = async (req: Request, res: Response) => {
    const phoneNumber = req.query.phoneNumber;
    const vehicleNumber = req.query.vehicleNumber;
    const year = req.query.year;

    if (!phoneNumber) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Phone Number is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<JobCardController>:<Get store job Card by phone number controller initiated>'
    );
    try {
      const result = await this.jobCardService.filterJobCards(
        phoneNumber as string,
        vehicleNumber as string,
        year as string
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

  countAllJobCard = async (req: Request, res: Response) => {
    const query = req.query;
    const role = req?.role;
    const userName = req?.userId;
    Logger.info('<Controller>:<JobCardController>:<Count Job Card Initiated>');
    try {
      Logger.info(
        '<Controller>:<JobCardController>:<Count Job Card Initiated>'
      );
      const result = await this.jobCardService.countAllJobCard(
        query,
        role,
        userName
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

  getAllJobCardPaginated = async (req: Request, res: Response) => {
    const { pageNo, pageSize, startDate, endDate, searchText, state, city, oemId, employeeId } =
      req.body;
      const role = req?.role;
    const userName = req?.userId;
    Logger.info(
      '<Controller>:<JobCardController>:<Get Paginated Job Card Initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<JobCardController>:<Get Paginated Job Card Initiated>'
      );
      const result = await this.jobCardService.getAllJobCardPaginated(
        pageNo,
        pageSize,
        startDate,
        endDate,
        searchText,
        state,
        city,
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

  getJobCardTotalPaymentAnalytics = async (req: Request, res: Response) => {
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
    const role = req?.role;
    const userName = req?.userId;
    try {
      Logger.info(
        '<Controller>:<JobCardController>:<get jobcard payment analytic request controller initiated>'
      );
      const result = await this.jobCardService.getJobCardTotalPaymentAnalytics(
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

  overallPayment = async (req: Request, res: Response) => {
    const query = req.query;
    const role = req?.role;
    const userName = req?.userId;
    try {
      Logger.info(
        '<Controller>:<JobCardController>:<get jobcard overall payment analytic request controller initiated>'
      );
      const result = await this.jobCardService.overallPayment(
        query,
        role,
        userName
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

  getOverallUniqueStores = async (req: Request, res: Response) => {
    const query = req.query;
    const role = req?.role;
    const userName = req?.userId;
    try {
      Logger.info(
        '<Controller>:<JobCardController>:<get jobcard overall unique stores request controller initiated>'
      );
      const result = await this.jobCardService.getOverallUniqueStores(
        query,
        role,
        userName
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

  getUniqueStores = async (req: Request, res: Response) => {
    const query = req.query;
    const role = req?.role;
    const userName = req?.userId;
    try {
      Logger.info(
        '<Controller>:<JobCardController>:<get jobcard unique stores request controller initiated>'
      );
      const result = await this.jobCardService.getUniqueStores(
        query,
        role,
        userName
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

  getHighestJobCards = async (req: Request, res: Response) => {
    const query = req.query;
    try {
      Logger.info(
        '<Controller>:<JobCardController>:<get highest jobcard request controller initiated>'
      );
      const result = await this.jobCardService.getHighestJobCards(query);
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

  validate = (method: string) => {
    switch (method) {
      case 'createJobCard':
        return [body('storeId', 'Store Id does not exist').exists().isString()];
    }
  };
}
