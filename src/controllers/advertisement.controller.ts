import { AdBannerUploadRequest } from './../interfaces/adBannerRequest.interface';
import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Request from '../types/request';
import { AdvertisementService } from './../services/advertisement.service';

@injectable()
export class AdvertisementController {
  private adService: AdvertisementService;
  constructor(
    @inject(TYPES.AdvertisementService) adService: AdvertisementService
  ) {
    this.adService = adService;
  }

  uploadBanner = async (req: Request, res: Response) => {
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    const uploadBannerReq: AdBannerUploadRequest = req.body;
    Logger.info(
      '<Controller>:<AdvertisementController>:<Upload Banner request initiated>'
    );
    try {
      const result = await this.adService.uploadBanner(uploadBannerReq, req);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllBanner = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<AdvertisementController>:<Get All Banner request initiated>'
    );
    try {
      const result = await this.adService.getAllBanner();
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllBannerForCustomer = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<AdvertisementController>:<Get All Banner for Customer request initiated>'
    );
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    try {
      const result = await this.adService.getAllBannerForCustomer();
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateBannerStatus = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<AdvertisementController>:<Update Banner Status>'
    );
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    try {
      const result = await this.adService.updateBannerStatus(req.body);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  deleteBanner = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<AdvertisementController>:<Delete Banner>');
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    try {
      const result = await this.adService.deleteBanner(req.body);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  validate = (method: string) => {
    switch (method) {
      case 'uploadBanner':
        return [
          body('title', 'Title does not exist').exists().isString(),

          body('description', 'Description does not existzz')
            .exists()
            .isString()
        ];
      case 'updateBannerStatus':
        return [
          body('bannerId', 'Banner Id does not exist').exists().isString(),
          body('status', 'Status does not exist').exists().isString()
        ];
      case 'deleteBanner':
        return [
          body('bannerId', 'Banner Id does not exist').exists().isString(),
          body('slugUrl', 'Image key does not exist').exists().isString()
        ];
    }
  };
}
