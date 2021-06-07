import { Response } from 'express';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { StoreService } from '../services';
import Logger from '../config/winston';
import Request from '../types/request';
import { TYPES } from '../config/inversify.types';
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
    const storeId = req.query.storeId;
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
}
