import { Response } from 'express';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { body, validationResult } from 'express-validator';

import { StoreLeadService } from '../services';
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
export class StoreLeadController {
  private storeLeadService: StoreLeadService;
  constructor(
    @inject(TYPES.StoreLeadService) storeLeadService: StoreLeadService
  ) {
    this.storeLeadService = storeLeadService;
  }
  createStore = async (req: Request, res: Response) => {
    const storeRequest = req.body;
    const { oemId } = storeRequest.store;
    Logger.info(
      '<Controller>:<StoreLeadController>:<Onboarding request controller initiated>'
    );
    try {
      const role = req?.role;
      const result = await this.storeLeadService.create(
        storeRequest,
        oemId,
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

  updateStore = async (req: Request, res: Response) => {
    const storeRequest: StoreRequest = req.body;
    Logger.info(
      '<Controller>:<StoreLeadController>:<Onboarding request controller initiated>'
    );
    try {
      const userName = req?.userId;
      const role = req?.role;
      const result = await this.storeLeadService.update(
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
    const { storeId } = req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Upload Vehicle request initiated>'
    );
    try {
      const result = await this.storeLeadService.updateStoreImages(
        storeId,
        req
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

  getAllStores = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<StoreLeadController>:<Get All stores request controller initiated>'
    );
    try {
      const userName = req.userId;
      const role = req?.role;
      const { userType, status, verifiedStore, oemId } = req.body;
      Logger.debug(
        `${JSON.stringify(req.headers)}, ${JSON.stringify(req.body)}requests`
      );
      Logger.debug(`${userName}, ${role}, role`);
      const result: StoreResponse[] = await this.storeLeadService.getAll(
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
      '<Controller>:<StoreLeadController>:<Search and Filter Stores request controller initiated>'
    );
    try {
      const result: StoreResponse[] =
        await this.storeLeadService.searchAndFilter(
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
      '<Controller>:<StoreLeadController>:<Search and Filter Stores pagination request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<StoreLeadController>:<Search and Filter Stores pagination request controller initiated>'
      );
      const result: StoreResponse[] =
        await this.storeLeadService.searchAndFilterPaginated({
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

    Logger.info(
      '<Controller>:<StoreLeadController>:<Get stores by storeID request controller initiated>'
    );
    try {
      let result: StoreResponse[];
      if (!storeId) {
        throw new Error('storeId required');
      } else {
        result = await this.storeLeadService.getById({ storeId, lat, long } as {
          storeId: string;
          lat: string;
          long: string;
        });
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
      '<Controller>:<StoreLeadController>:<Delete store by storeID request controller initiated>'
    );
    try {
      let result: StoreResponse[];
      if (!storeId) {
        throw new Error('storeId required');
      } else {
        result = await this.storeLeadService.deleteStore(storeId as string);
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
      '<Controller>:<StoreLeadController>:<Get stores by owner request controller initiated>'
    );
    try {
      const result = await this.storeLeadService.getByOwner(userId);
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
    Logger.info('<Controller>:<StoreLeadController>:<Get stores ratings>');
    try {
      const result = await this.storeLeadService.getOverallRatings(storeId);
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
    Logger.info('<Controller>:<StoreLeadController>:<Create store ratings>');
    try {
      const result = await this.storeLeadService.addReview(storeReview);
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
    Logger.info('<Controller>:<StoreLeadController>:<Get stores reviews>');
    try {
      const result = await this.storeLeadService.getReviews(
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
    Logger.info('<Controller>:<StoreLeadController>:<Update Store Status>');

    try {
      const result = await this.storeLeadService.updateStoreStatus(
        payload,
        userName,
        role
      );
      Logger.info(
        '<Controller>:<StoreLeadController>: <Store: Sending notification of updated status>'
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
    Logger.info(
      '<Controller>:<StoreLeadController>:<Verify Business Initatiate>'
    );

    try {
      const result = await this.storeLeadService.initiateBusinessVerification(
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
    Logger.info(
      '<Controller>:<StoreLeadController>:<Verify Business Initatiate>'
    );

    try {
      const result = await this.storeLeadService.approveBusinessVerification(
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
    Logger.info('<Controller>:<StoreLeadController>:<Verify Aadhar OTP>');
    try {
      const result = await this.storeLeadService.verifyAadhar(
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
      '<Controller>:<StoreLeadController>:<Get all stores reviews request controller initiated>'
    );
    const userId = req?.userId;
    const role = req?.role;
    const oemId = req?.query?.oemId;
    try {
      const result = await this.storeLeadService.getAllReviews(
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
    Logger.info(
      '<Controller>:<StoreLeadController>:<Update Store Review Status>'
    );

    try {
      const result = await this.storeLeadService.updateStoreReviewStatus(
        payload,
        reviewId
      );
      Logger.info(
        '<Controller>:<StoreLeadController>: <Store: Sending notification of updated status>'
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
      '<Controller>:<StoreLeadController>:<Onboarding request controller initiated>'
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
      const result = await this.storeLeadService.createStoreFastestOnboarding(
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
    const { state, city, oemId, filterOemUser, userType } = req.body;
    Logger.info(
      '<Controller>:<StoreLeadController>:<Store request controller initiated>'
    );
    try {
      const userName = req?.userId;
      const role = req?.role;
      const result = await this.storeLeadService.getStoresByCity(
        state,
        city,
        userName,
        role,
        oemId,
        filterOemUser,
        userType
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
      employeeId,
      searchQuery
    } = req.body;
    Logger.info(
      '<Controller>:<StoreLeadController>:<Search and Filter Stores pagination request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<StoreLeadController>:<Search and Filter Stores pagination request controller initiated>'
      );
      const result: StoreResponse[] =
        await this.storeLeadService.getAllStorePaginaed(
          userName,
          role,
          userType,
          status,
          verifiedStore,
          oemId,
          pageNo,
          pageSize,
          employeeId,
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
    const employeeId = req?.query?.employeeId;

    Logger.info(
      '<Controller>:<StoreLeadController>:<Search and Filter Stores pagination request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<StoreLeadController>:<Search and Filter Stores pagination request controller initiated>'
      );
      const result: StoreResponse[] =
        await this.storeLeadService.getTotalStoresCount(
          userName,
          role,
          oemId as string,
          userType as string,
          status as string,
          verifiedStore as string,
          employeeId as string
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
      '<Controller>:<StoreLeadController>:<Search and Filter Stores pagination request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<StoreLeadController>:<Search and Filter Stores pagination request controller initiated>'
      );
      const result: StoreResponse[] =
        await this.storeLeadService.getNearestStore({
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
      '<Controller>:<StoreLeadController>:<Filter nearest store request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<StoreLeadController>:<Filter nearest store request controller initiated>'
      );
      const result = await this.storeLeadService.getNearestDealer({
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
      '<Controller>:<StoreLeadController>:<request controller initiated>'
    );
    try {
      const result = await this.storeLeadService.createHistory(storeRequest);
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
      '<Controller>:<StoreLeadController>:<StoreHistory request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<StoreLeadController>:<StoreHistory request controller initiated>'
      );
      const result = await this.storeLeadService.getHistory({ storeId });
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
  //     '<Controller>:<StoreLeadController>:<Get stores by userId request controller initiated>'
  //   );

  //   // Handle case where userId is not provided
  //   if (!userId) {
  //     return res
  //       .status(HttpStatusCodes.BAD_REQUEST)
  //       .json({ message: 'User ID is required' });
  //   }

  //   try {
  //     const result = await this.storeLeadService.getStoreByUserId(userId);

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
