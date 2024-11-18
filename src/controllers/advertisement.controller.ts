// import { AdBannerUploadRequest } from '../interfaces/advertisementRequest.interface';
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

  uploadBannerImage = async (req: Request, res: Response) => {
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    const { bannerId } = req.body;
    Logger.info(
      '<Controller>:<AdvertisementController>:<Upload Banner Image request initiated>'
    );
    try {
      const result = await this.adService.uploadBannerImage(bannerId, req);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  uploadBanner = async (req: Request, res: Response) => {
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    Logger.info(
      '<Controller>:<AdvertisementController>:<Upload Banner request initiated>'
    );
    try {
      const result = await this.adService.uploadBanner(req.body);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllBanner = async (req: Request, res: Response) => {
    // const lat = req.query.lat;
    // const long = req.query.long;
    const {
      coordinates,
      userType,
      bannerPlace,
      category,
      oemId,
      userName,
      role
    }: {
      coordinates: number[];
      userType: string;
      bannerPlace: string;
      category: string;
      oemId?: string;
      userName?: string;
      role?: string;
    } = req.body;
    let { subCategory } = req.body;
    if (subCategory) {
      subCategory = (subCategory as string).split(',');
    } else {
      subCategory = [];
    }
    Logger.info(
      '<Controller>:<AdvertisementController>:<Get All Banner request initiated>'
    );
    try {
      const result = await this.adService.getAllBanner({
        coordinates,
        userType,
        bannerPlace,
        category,
        subCategory,
        userName,
        role,
        oemId
      });
      if (result.length !== 0) {
        res.send({
          result
        });
      } else {
        const result = await this.adService.getAllBannerList({
          coordinates,
          userType,
          bannerPlace
        });
        res.send({
          result
        });
      }
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllPaginatedBanner = async (req: Request, res: Response) => {
    try {
      const userName = req?.query?.userId;
      const role = req?.query?.role;
      const oemId = req?.query?.oemId;
      const pageNo = Number(req.query.pageNo);
      const pageSize = Number(req.query.pageSize || 10);
      const searchQuery = req.query.searchQuery;

      const result = await this.adService.getAllPaginatedBanner(
        pageNo,
        pageSize,
        searchQuery as string,
        userName as string,
        role as string,
        oemId as string
      );
      Logger.info('<Controller>:<AdvertisementController>:<get successfully>');
      res.send({
        message: 'banner obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getBannerById = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<AdvertisementController>:<Getting banner ID>');
    try {
      const bannerId = req.query.bannerId;
      const result = await this.adService.getBannerById(bannerId as string);
      Logger.info('<Controller>:<AdvertisementController>:<get successfully>');
      res.send({
        message: 'banner obtained successfully',
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

  updateBannerDetails = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<AdvertisementController>:<Update Banner Status>'
    );
    // Validate the request body
    const bannerId = req.params.bannerId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    try {
      const result = await this.adService.updateBannerDetails(
        req.body,
        bannerId
      );
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

  bannerAnalytic = async (req: Request, res: Response) => {
    const { bannerType, bannerPlace } = req.body;
    try {
      Logger.info(
        '<Controller>:<AnalyticController>:<get analytic request initiated>'
      );
      const result = await this.adService.bannerAnalytic(
        bannerType,
        bannerPlace
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
