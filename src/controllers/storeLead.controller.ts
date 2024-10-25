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
      const userName = req?.userId;
      const result = await this.storeLeadService.create(
        storeRequest,
        oemId,
        role,
        userName
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
    const searchQuery = req?.query?.searchQuery;

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
          employeeId as string,
          searchQuery as string
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
