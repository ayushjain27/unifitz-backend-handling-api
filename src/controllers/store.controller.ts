import { Response } from 'express';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { StoreService } from '../services';
import Logger from '../config/winston';
import Request from '../types/request';
import { TYPES } from '../config/inversify.types';
import User from '../models/User';

import {
  StoreDocUploadRequest,
  StoreRequest,
  StoreResponse,
  StoreReviewRequest
} from '../interfaces';

@injectable()
export class StoreController {
  private storeService: StoreService;
  constructor(@inject(TYPES.StoreService) storeService: StoreService) {
    this.storeService = storeService;
  }
  createStore = async (req: Request, res: Response) => {
    const storeRequest: StoreRequest = req.body;
    Logger.info(
      '<Controller>:<StoreController>:<Onboarding request controller initiated>'
    );
    try {
      if (req?.role === 'ADMIN') {
        const { phoneNumber } = storeRequest;
        await User.findOneAndUpdate(
          { phoneNumber, role: 'STORE_OWNER' },
          { phoneNumber, role: 'STORE_OWNER' },
          { upsert: true, new: true }
        );
      }
      const result = await this.storeService.create(storeRequest);
      res.send({
        message: 'Store Onboarding Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateStore = async (req: Request, res: Response) => {
    const storeRequest: StoreRequest = req.body;
    Logger.info(
      '<Controller>:<StoreController>:<Onboarding request controller initiated>'
    );
    try {
      const result = await this.storeService.update(storeRequest);
      res.send({
        message: 'Store Updation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
  getAllStores = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<StoreController>:<Get All stores request controller initiated>'
    );
    try {
      const result: StoreResponse[] = await this.storeService.getAll();
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
  searchStores = async (req: Request, res: Response) => {
    const { category, brand, storeName } = req.query;
    let { subCategory } = req.query;
    if (subCategory) {
      subCategory = (subCategory as string).split(',');
    } else {
      subCategory = [];
    }
    Logger.info(
      '<Controller>:<StoreController>:<Search and Filter Stores request controller initiated>'
    );
    try {
      const result: StoreResponse[] = await this.storeService.searchAndFilter(
        storeName as string,
        category as string,
        subCategory as string[],
        brand as string
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  searchStoresPaginated = async (req: Request, res: Response) => {
    const {
      category,
      brand,
      storeName,
      pageNo,
      pageSize,
      coordinates
    }: {
      category: string;
      brand: string;
      storeName: string;
      pageNo: number;
      pageSize: number;
      coordinates: number[];
    } = req.body;
    let { subCategory } = req.body;
    if (subCategory) {
      subCategory = (subCategory as string).split(',');
    } else {
      subCategory = [];
    }
    Logger.info(
      '<Controller>:<StoreController>:<Search and Filter Stores pagination request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<StoreController>:<Search and Filter Stores pagination request controller initiated>'
      );
      const result: StoreResponse[] =
        await this.storeService.searchAndFilterPaginated({
          storeName,
          category,
          subCategory,
          brand,
          pageNo,
          pageSize,
          coordinates
        });
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
  getStoreByStoreId = async (req: Request, res: Response) => {
    const storeId = req.query.storeId;
    Logger.info(
      '<Controller>:<StoreController>:<Get stores by storeID request controller initiated>'
    );
    try {
      let result: StoreResponse[];
      if (!storeId) {
        throw new Error('storeId required');
      } else {
        result = await this.storeService.getById(storeId as string);
      }
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
  getStoresByOwner = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    Logger.info(
      '<Controller>:<StoreController>:<Get stores by owner request controller initiated>'
    );
    try {
      const result = await this.storeService.getByOwner(userId);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
  uploadFile = async (req: Request, res: Response) => {
    const storeDocUploadRequest: StoreDocUploadRequest = req.body;
    Logger.info('---------------------');
    Logger.info('req body is', req.body, req.file);
    Logger.info('---------------------');
    Logger.info(
      '<Controller>:<StoreController>:<Upload file request controller initiated>'
    );
    try {
      const result = await this.storeService.uploadFile(
        storeDocUploadRequest,
        req
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
  getOverallStoreRatings = async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    Logger.info('<Controller>:<StoreController>:<Get stores ratings>');
    try {
      const result = await this.storeService.getOverallRatings(storeId);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
  addStoreReview = async (req: Request, res: Response) => {
    const storeReview: StoreReviewRequest = req.body;
    Logger.info('<Controller>:<StoreController>:<Create store ratings>');
    try {
      const result = await this.storeService.addReview(storeReview);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
  getStoreReviews = async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    Logger.info('<Controller>:<StoreController>:<Get stores reviews>');
    try {
      const result = await this.storeService.getReviews(storeId);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateStoreStatus = async (req: Request, res: Response) => {
    const payload = req.body;
    Logger.info('<Controller>:<StoreController>:<Update Store Status>');

    try {
      const result = await this.storeService.updateStoreStatus(payload);
      Logger.info(
        '<Controller>:<StoreController>: <Store: Sending notification of updated status>'
      );
      await this.storeService.sendNotificationToStore(result);
      res.send({
        message: 'Store Updation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
}
