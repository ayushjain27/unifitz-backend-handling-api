import { body } from 'express-validator';
import { Response } from 'express';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { AnalyticService } from '../services';
import Logger from '../config/winston';
import _ from 'lodash';
import Request from '../types/request';
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
}
