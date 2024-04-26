import { Response } from 'express';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { AnalyticService } from '../services';
import Logger from '../config/winston';
import _ from 'lodash';
import Request from '../types/request';
import { body, validationResult, query } from 'express-validator';
// import { TYPES } from '../config/inversify.types';
import { TYPES } from '../config/inversify.types';

@injectable()
export class AnalyticController {
  private analyticService: AnalyticService;
  constructor(@inject(TYPES.AnalyticService) analyticService: AnalyticService) {
    this.analyticService = analyticService;
  }
  getTotalCustomers = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<AnalyticController>:<Get All customers request controller initiated>'
    );
    try {
      const result = await this.analyticService.getTotalCustomers();
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getVerifiedStores = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<AnalyticController>:<Get All verified stores controller initiated>'
    );
    const userName = req?.userId;
    const role = req?.role;
    try {
      const result = await this.analyticService.getVerifiedStores(
        userName,
        role
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getTotalUsers = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<AnalyticController>:<Get All users request controller initiated>'
    );
    const userName = req?.userId;
    const role = req?.role;
    try {
      const result = await this.analyticService.getTotalUsers(userName, role);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAnalyticsMapsData = async (req: Request, res: Response) => {
    const {
      startDate,
      endDate,
      category,
      subCategory,
      state,
      city
    }: {
      startDate: string;
      endDate: string;
      category: string;
      subCategory: string;
      state: string;
      city: string;
    } = req.body;
    const role = req?.role;
    const userName = req?.userId;
    Logger.info(
      '<Controller>:<StoreController>:<Search and Filter Stores pagination request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<StoreController>:<Search and Filter Stores pagination request controller initiated>'
      );
      const result = await this.analyticService.searchAndFilterStoreData({
        startDate,
        endDate,
        category,
        subCategory,
        state,
        city,
        role,
        userName
      });
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

  getPlusFeatureData = async (req: Request, res: Response) => {
    const {
      startDate,
      endDate,
      category,
      subCategory,
      state,
      city
    }: {
      startDate: string;
      endDate: string;
      category: string;
      subCategory: string;
      state: string;
      city: string;
    } = req.body;
    const role = req?.role;
    const userName = req?.userId;
    Logger.info(
      '<Controller>:<StoreController>:<Search and Filter Stores pagination request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<StoreController>:<Search and Filter Stores pagination request controller initiated>'
      );
      const result = await this.analyticService.getPlusFeatureData({
        startDate,
        endDate,
        category,
        subCategory,
        state,
        city,
        role,
        userName
      });
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

  createEventAnalytic = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const requestData = req.body;
    Logger.info(
      '<Controller>:<StoreController>:<Create  analytic controller initiated>'
    );
    try {
      const result = await this.analyticService.createEventAnalytic(
        requestData
      );
      res.send({
        message: 'OK !!!!',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getEventAnalytic = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const { firstDate, lastDate, state, city, storeId } = req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getEventAnalytic(
        role,
        userName,
        firstDate,
        lastDate,
        state,
        city,
        storeId
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

  getActiveUser = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const { firstDate, lastDate, state, city, storeId } = req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getActiveUser(
        role,
        userName,
        firstDate,
        lastDate,
        state,
        city,
        storeId
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

  getUsersByState = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const { firstDate, lastDate, state, city, storeId } = req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getUsersByState(
        role,
        userName,
        state,
        city,
        firstDate,
        lastDate,
        storeId
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

  getTrafficAnalaytic = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const { firstDate, lastDate, state, city, storeId } = req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getTrafficAnalaytic(
        role,
        userName,
        firstDate,
        lastDate,
        state,
        city,
        storeId
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

  createPlusFeatures = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const requestData = req.body;
    Logger.info(
      '<Controller>:<AnalyticController>:<Create  analytic controller initiated>'
    );
    try {
      const result = await this.analyticService.createPlusFeatures(requestData);
      res.send({
        message: 'OK !!!!'
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getPlusFeatureAnalytic = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const { firstDate, lastDate, state, city, moduleInformation } = req.body;
    try {
      Logger.info(
        '<Controller>:<AnalyticController>:<get analytic request initiated>'
      );
      const result = await this.analyticService.getPlusFeatureAnalytic(
        role,
        userName,
        firstDate,
        lastDate,
        state,
        city,
        moduleInformation
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
}
