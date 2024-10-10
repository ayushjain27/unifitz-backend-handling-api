import { Response } from 'express';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { body, validationResult } from 'express-validator';

import { StoreService } from '../services';
import Logger from '../config/winston';
import Request from '../types/request';
import { TYPES } from '../config/inversify.types';
import User from '../models/User';

import {
  ApproveBusinessVerifyRequest,
  StoreRequest,
  StoreResponse,
  StoreReviewRequest,
  VerifyAadharRequest,
  VerifyBusinessRequest
} from '../interfaces';
import { AdminRole } from '../models/Admin';

@injectable()
export class StoreController {
  private storeService: StoreService;
  constructor(@inject(TYPES.StoreService) storeService: StoreService) {
    this.storeService = storeService;
  }
  createStore = async (req: Request, res: Response) => {
    const storeRequest: StoreRequest = req.body;
    const { oemId } = req.body;
    Logger.info(
      '<Controller>:<StoreController>:<Onboarding request controller initiated>'
    );
    try {
      if (
        req?.role === AdminRole.ADMIN ||
        req?.role === AdminRole.OEM ||
        req?.role === AdminRole.EMPLOYEE
      ) {
        const { phoneNumber } = storeRequest;
        await User.findOneAndUpdate(
          { phoneNumber, role: 'STORE_OWNER' },
          { phoneNumber, role: 'STORE_OWNER' },
          { upsert: true, new: true }
        );
      }
      const userName = req?.userId;
      const role = req?.role;
      const result = await this.storeService.create(
        storeRequest,
        userName,
        role,
        oemId
      );
      res.send({
        message: 'Store Onboarding Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  updateStore = async (req: Request, res: Response) => {
    const storeRequest: StoreRequest = req.body;
    Logger.info(
      '<Controller>:<StoreController>:<Onboarding request controller initiated>'
    );
    try {
      const userName = req?.userId;
      const role = req?.role;
      const result = await this.storeService.update(
        storeRequest,
        userName,
        role
      );
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
  uploadStoreImages = async (req: Request, res: Response) => {
    // Validate the request body
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res
    //     .status(HttpStatusCodes.BAD_REQUEST)
    //     .json({ errors: errors.array() });
    // }
    const { storeId } = req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Upload Vehicle request initiated>'
    );
    try {
      const result = await this.storeService.updateStoreImages(storeId, req);
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

  getAllStores = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<StoreController>:<Get All stores request controller initiated>'
    );
    try {
      const userName = req.userId;
      const role = req?.role;
      const { userType, status, verifiedStore, oemId } = req.body;
      Logger.debug(
        `${JSON.stringify(req.headers)}, ${JSON.stringify(req.body)}requests`
      );
      Logger.debug(`${userName}, ${role}, role`);
      const result: StoreResponse[] = await this.storeService.getAll(
        userName,
        role,
        userType,
        status,
        verifiedStore,
        oemId
      );
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
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  searchStoresPaginated = async (req: Request, res: Response) => {
    const {
      category,
      brand,
      storeName,
      pageNo,
      pageSize,
      coordinates,
      oemUserName
    }: {
      category: string;
      brand: string;
      storeName: string;
      pageNo: number;
      pageSize: number;
      coordinates: number[];
      oemUserName: string;
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
          coordinates,
          oemUserName
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
  getStoreByStoreId = async (req: Request, res: Response) => {
    const storeId = req.query.storeId;
    const lat = req.query.lat;
    const long = req.query.long;
    const userName = req?.userId;
    const role = req?.role;

    Logger.info(
      '<Controller>:<StoreController>:<Get stores by storeID request controller initiated>'
    );
    try {
      let result: StoreResponse[];
      if (!storeId) {
        throw new Error('storeId required');
      } else {
        result = await this.storeService.getById(
          { storeId, lat, long } as {
            storeId: string;
            lat: string;
            long: string;
          },
          userName,
          role
        );
      }
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

  deleteStore = async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    const userName = req?.userId;
    const role = req?.role;
    Logger.info(
      '<Controller>:<StoreController>:<Delete store by storeID request controller initiated>'
    );
    try {
      let result: StoreResponse[];
      if (!storeId) {
        throw new Error('storeId required');
      } else {
        result = await this.storeService.deleteStore(
          storeId as string,
          userName,
          role
        );
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
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
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
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
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
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };
  getStoreReviews = async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    const pageSize = Number(req.query.pageSize) || 15;
    const pageNo = Number(req.query.pageNo) || 0;
    Logger.info('<Controller>:<StoreController>:<Get stores reviews>');
    try {
      const result = await this.storeService.getReviews(
        storeId,
        pageNo,
        pageSize
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

  updateStoreStatus = async (req: Request, res: Response) => {
    const payload = req.body;
    const userName = req?.userId;
    const role = req?.role;
    Logger.info('<Controller>:<StoreController>:<Update Store Status>');

    try {
      const result = await this.storeService.updateStoreStatus(
        payload,
        userName,
        role
      );
      Logger.info(
        '<Controller>:<StoreController>: <Store: Sending notification of updated status>'
      );
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

  initiateBusinessVerification = async (req: Request, res: Response) => {
    const payload = req.body as VerifyBusinessRequest;
    const phoneNumber = req?.userId;
    const role = req?.role;
    Logger.info('<Controller>:<StoreController>:<Verify Business Initatiate>');

    try {
      const result = await this.storeService.initiateBusinessVerification(
        payload,
        phoneNumber,
        role
      );
      res.send({
        message: 'Store Verification Initatiation Successful',
        result
      });
      // }
    } catch (err) {
      if (err.status && err.data) {
        res
          .status(err.status)
          .json({ success: err.data?.success, message: err.data?.message });
      } else {
        Logger.error(err.message);
        res
          .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: err.message });
      }
    }
  };

  approveBusinessVerification = async (req: Request, res: Response) => {
    const payload = req.body as ApproveBusinessVerifyRequest;
    const phoneNumber = req?.userId;
    const role = req?.role;
    Logger.info('<Controller>:<StoreController>:<Verify Business Initatiate>');

    try {
      const result = await this.storeService.approveBusinessVerification(
        payload,
        phoneNumber,
        role
      );
      res.send({
        message: 'Store Verification Approval Successful',
        result
      });
      // }
    } catch (err) {
      if (err.status && err.data) {
        res
          .status(err.status)
          .json({ success: err.data?.success, message: err.data?.message });
      } else {
        Logger.error(err.message);
        res
          .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: err.message });
      }
    }
  };

  verifyAadhar = async (req: Request, res: Response) => {
    const payload: VerifyAadharRequest = req.body;
    const phoneNumber = req?.userId;
    const role = req?.role;
    Logger.info('<Controller>:<StoreController>:<Verify Aadhar OTP>');
    try {
      const result = await this.storeService.verifyAadhar(
        payload,
        phoneNumber,
        role
      );
      res.send({
        message: 'Aadhar Verification Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getAllReviews = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<StoreController>:<Get all stores reviews request controller initiated>'
    );
    const userId = req?.userId;
    const role = req?.role;
    const oemId = req?.query?.oemId;
    try {
      const result = await this.storeService.getAllReviews(
        userId,
        role,
        oemId as string
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateStoreReview = async (req: Request, res: Response) => {
    const payload = req.body;
    const reviewId = req.params.reviewId;
    if (!reviewId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Review Id is not present' } });
      return;
    }
    Logger.info('<Controller>:<StoreController>:<Update Store Review Status>');

    try {
      const result = await this.storeService.updateStoreReviewStatus(
        payload,
        reviewId
      );
      Logger.info(
        '<Controller>:<StoreController>: <Store: Sending notification of updated status>'
      );
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

  createStoreFastestOnboarding = async (req: Request, res: Response) => {
    const storeRequest: StoreRequest = req.body;
    Logger.info(
      '<Controller>:<StoreController>:<Onboarding request controller initiated>'
    );
    try {
      if (req?.role === AdminRole.ADMIN || req?.role === AdminRole.OEM) {
        const { phoneNumber } = storeRequest;
        await User.findOneAndUpdate(
          { phoneNumber, role: 'STORE_OWNER' },
          { phoneNumber, role: 'STORE_OWNER' },
          { upsert: true, new: true }
        );
      }
      const userName = req?.userId;
      const role = req?.role;
      const result = await this.storeService.createStoreFastestOnboarding(
        storeRequest,
        userName,
        role
      );
      res.send({
        message: 'Store Onboarding Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getStoresByCity = async (req: Request, res: Response) => {
    const { state, city, oemId, filterOemUser } = req.body;
    Logger.info(
      '<Controller>:<StoreController>:<Store request controller initiated>'
    );
    try {
      const userName = req?.userId;
      const role = req?.role;
      const result = await this.storeService.getStoresByCity(
        state,
        city,
        userName,
        role,
        oemId,
        filterOemUser
      );
      res.send({
        message: 'Store get Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getAllStorePaginaed = async (req: Request, res: Response) => {
    const userName = req.userId;
    const role = req?.role;
    const {
      userType,
      status,
      verifiedStore,
      pageNo,
      pageSize,
      oemId,
      searchQuery
    } = req.body;
    Logger.info(
      '<Controller>:<StoreController>:<Search and Filter Stores pagination request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<StoreController>:<Search and Filter Stores pagination request controller initiated>'
      );
      const result: StoreResponse[] =
        await this.storeService.getAllStorePaginaed(
          userName,
          role,
          userType,
          status,
          verifiedStore,
          oemId,
          pageNo,
          pageSize,
          searchQuery
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

  getTotalStoresCount = async (req: Request, res: Response) => {
    const userName = req.userId;
    const role = req?.role;
    const oemId = req?.query?.oemId;
    const status = req?.query?.status;
    const userType = req?.query?.userType;
    const verifiedStore = req?.query?.verifiedStore;

    Logger.info(
      '<Controller>:<StoreController>:<Search and Filter Stores pagination request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<StoreController>:<Search and Filter Stores pagination request controller initiated>'
      );
      const result: StoreResponse[] =
        await this.storeService.getTotalStoresCount(
          userName,
          role,
          oemId as string,
          userType as string,
          status as string,
          verifiedStore as string
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

  getNearestStore = async (req: Request, res: Response) => {
    const {
      category,
      brand,
      storeName,
      pageNo,
      pageSize,
      coordinates,
      oemUserName
    }: {
      category: string;
      brand: string;
      storeName: string;
      pageNo: number;
      pageSize: number;
      coordinates: number[];
      oemUserName: string;
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
      const result: StoreResponse[] = await this.storeService.getNearestStore({
        storeName,
        category,
        subCategory,
        brand,
        pageNo,
        pageSize,
        coordinates,
        oemUserName
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

  getNearestDealer = async (req: Request, res: Response) => {
    const {
      coordinates,
      oemUserName,
      stores,
      selectAllStores
    }: {
      coordinates: number[];
      oemUserName: string;
      stores: any;
      selectAllStores: any;
    } = req.body;
    Logger.info(
      '<Controller>:<StoreController>:<Filter nearest store request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<StoreController>:<Filter nearest store request controller initiated>'
      );
      const result = await this.storeService.getNearestDealer({
        coordinates,
        oemUserName,
        stores,
        selectAllStores
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

  createHistory = async (req: Request, res: Response) => {
    const storeRequest = req.body;
    Logger.info(
      '<Controller>:<StoreController>:<request controller initiated>'
    );
    try {
      const result = await this.storeService.createHistory(storeRequest);
      res.send({
        message: 'History is created'
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getHistory = async (req: Request, res: Response) => {
    const { storeId }: { storeId: any } = req.body;
    Logger.info(
      '<Controller>:<StoreController>:<StoreHistory request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<StoreController>:<StoreHistory request controller initiated>'
      );
      const result = await this.storeService.getHistory({ storeId });
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

  // getStoreByUserId = async (req: Request, res: Response) => {
  //   const userId = req.query.userId;

  //   Logger.info(
  //     '<Controller>:<StoreController>:<Get stores by userId request controller initiated>'
  //   );

  //   // Handle case where userId is not provided
  //   if (!userId) {
  //     return res
  //       .status(HttpStatusCodes.BAD_REQUEST)
  //       .json({ message: 'User ID is required' });
  //   }

  //   try {
  //     const result = await this.storeService.getStoreByUserId(userId);

  //     // Send the result in the response after it's retrieved
  //     res.send({
  //       result
  //     });
  //   } catch (err) {
  //     Logger.error(err.message);

  //     // Return error response
  //     res
  //       .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
  //       .json({ message: err.message });
  //   }
  // };

  validate = (method: string) => {
    switch (method) {
      case 'initiateBusinessVerification':
        return [
          // body('storeId', 'Store Id does not exist').exists().isString(),
          body('documentNo', 'Document Number does not exist')
            .exists()
            .isString(),
          body('documentType', 'Document Type does not exist')
            .exists()
            .isString()
        ];

      case 'approveBusinessVerification':
        return [
          body('storeId', 'Store Id does not exist').exists().isString(),
          body('verificationDetails', 'Details does not exist')
            .exists()
            .isObject(),
          body('documentType', 'Document Type does not exist')
            .exists()
            .isString()
        ];

      case 'verifyAadhar':
        return [
          body('storeId', 'Store Id does not exist').exists().isString(),
          body('clientId', 'Cliend Id does not exist').exists().isString(),
          body('otp', 'OTP does not exist').exists().isString()
        ];
    }
  };
}
