import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { appendCodeToPhone } from '../utils/common';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { ICustomer } from '../models/Customer';
import Request from '../types/request';
import { CustomerService } from './../services/customer.service';
import {
  ApproveUserVerifyRequest,
  VerifyAadharUserRequest,
  VerifyCustomerRequest
} from '../interfaces';
import { permissions } from '../config/permissions';

@injectable()
export class CustomerController {
  private customerService: CustomerService;
  constructor(@inject(TYPES.CustomerService) customerService: CustomerService) {
    this.customerService = customerService;
  }
  create = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const customerPayload: ICustomer = req.body;
    customerPayload.phoneNumber = appendCodeToPhone(
      customerPayload?.phoneNumber
    );
    Logger.info(
      '<Controller>:<CustomerController>:<Customer creation controller initiated>'
    );
    try {
      const result = await this.customerService.create(customerPayload);
      res.json({
        message: 'Customer creation successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  update = async (req: Request, res: Response) => {
    const customerPayload: ICustomer = req.body;
    const customerId = req.params.customerId;
    customerPayload.phoneNumber = appendCodeToPhone(
      customerPayload?.phoneNumber
    );
    Logger.info(
      '<Controller>:<CustomerController>:<Customer update controller initiated>'
    );
    try {
      const result = await this.customerService.update(
        customerId,
        customerPayload
      );
      res.send({
        message: 'Customer update successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  uploadCustomerImage = async (req: Request, res: Response) => {
    const { customerId } = req.body;
    Logger.info(
      '<Controller>:<CustomerController>:<Upload Customer request initiated>'
    );
    try {
      const result = await this.customerService.updateCustomerImage(
        customerId,
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

  getCustomerByPhoneNo = async (req: Request, res: Response) => {
    let phoneNumber = req.body.phoneNumber;
    Logger.info(
      '<Controller>:<CustomerController>:<Get customer by phone number request controller initiated>'
    );
    try {
      let result: ICustomer;
      if (!phoneNumber) {
        throw new Error('phoneNumber required');
      } else {
        phoneNumber = appendCodeToPhone(phoneNumber);
        result = await this.customerService.getByPhoneNumber(
          phoneNumber as string
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

  getAll = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<CustomerController>:<Get all customers request controller initiated>'
    );
    try {
      const result = await this.customerService.getAll();
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getcustomerDetailsByCustomerId = async (req: Request, res: Response) => {
    const customerId = req.query.customerId as string;
    if (!customerId) {
      throw new Error('Customer not found');
    }
    Logger.info(
      '<Controller>:<CustomerController>:<Get Customer Details By Customer Id request controller initiated>'
    );
    try {
      const result =
        await this.customerService.getcustomerDetailsByCustomerId(customerId);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getPaginatedAll = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<CustomerController>:<Get all customers request controller initiated>'
    );
    const pageNo = Number(req.query.pageNo);
    const pageSize = Number(req.query.pageSize || 10);
    const searchQuery = req.query.searchQuery;
    const state = req.query.state;
    const city = req.query.city;
    try {
      const result = await this.customerService.getPaginatedAll(
        pageNo,
        pageSize,
        searchQuery as string,
        state as string,
        city as string
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllCount = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<CustomerController>:<Get all customers request controller initiated>'
    );
    const searchQuery = req.query.searchQuery;
    const state = req.query.state;
    const city = req.query.city;
    try {
      const result = await this.customerService.getAllCount(
        searchQuery as string,
        state as string,
        city as string
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllCustomerId = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<CustomerController>:<Get all customersId request controller initiated>'
    );
    try {
      const result = await this.customerService.getAllCustomerId();
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllCustomerReferralsByCustomerId = async (req: Request, res: Response) => {
    const referralCode = req.query.referralCode;
    if (!referralCode) {
      res.send({ message: 'Referral Id not found' });
    }
    Logger.info(
      '<Controller>:<CustomerController>:<Get all customersId request controller initiated>'
    );
    try {
      const result =
        await this.customerService.getAllCustomerReferralsByCustomerId(
          referralCode as string
        );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  initiateUserVerification = async (req: Request, res: Response) => {
    const payload = req.body as VerifyCustomerRequest;
    Logger.info('<Controller>:<CustomerController>:<Verify User Initatiate>');

    try {
      const result =
        await this.customerService.initiateUserVerification(payload);
      res.send({
        message: 'Customer Verification Initatiation Successful',
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

  approveUserVerification = async (req: Request, res: Response) => {
    const payload = req.body as ApproveUserVerifyRequest;
    Logger.info('<Controller>:<CustomerController>:<Verify User Initatiate>');

    try {
      const result =
        await this.customerService.approveUserVerification(payload);
      res.send({
        message: 'User Verification Approval Successful',
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
    const payload: VerifyAadharUserRequest = req.body;
    Logger.info('<Controller>:<CustomerController>:<Verify Aadhar OTP>');
    try {
      const result = await this.customerService.verifyAadhar(payload);
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

  inviteUsers = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const customerPayload: ICustomer = req.body;
    customerPayload.phoneNumber = appendCodeToPhone(
      customerPayload?.phoneNumber
    );
    Logger.info(
      '<Controller>:<CustomerController>:<Invite Users creation controller initiated>'
    );
    try {
      const result = await this.customerService.inviteUsers(customerPayload);
      res.json({
        message: 'Invite Users creation successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  countAllReferCustomer = async (req: Request, res: Response) => {
    const searchText = req?.query?.searchText;
    const firstDate = req?.query?.firstDate;
    const lastDate = req?.query?.lastDate;
    const state = req?.query?.state;
    const city = req?.query?.city;
    Logger.info(
      '<Controller>:<CustomerController>:<Count all referral customers Initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<CustomerController>:<Count all referral customers Initiated>'
      );
      const result = await this.customerService.countAllReferCustomer(
        searchText as string,
        firstDate as string,
        lastDate as string,
        state as string,
        city as string
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

  countAllReferCustomerPaginated = async (req: Request, res: Response) => {
    const { pageNo, pageSize, searchText, firstDate, lastDate, state, city } =
      req.body;
    Logger.info(
      '<Controller>:<CustomerController>:<Get Paginated Referral Customer Initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<CustomerController>:<Get Paginated Referral customer Initiated>'
      );
      const result = await this.customerService.countAllReferCustomerPaginated(
        pageNo,
        pageSize,
        searchText,
        firstDate,
        lastDate,
        state,
        city
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

  createRewards = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    Logger.info(
      '<Controller>:<CustomerController>:<Create Rewards controller initiated>'
    );
    try {
      const result = await this.customerService.createRewards(req.body);
      res.json({
        message: 'Rewards creation successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  uploadRewardImage = async (req: Request, res: Response) => {
    const { rewardId } = req.body;
    Logger.info(
      '<Controller>:<CustomerController>:<Upload Reward request initiated>'
    );
    try {
      const result = await this.customerService.uploadRewardImage(
        rewardId,
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

  countAllRewards = async (req: Request, res: Response) => {
    const { oemId } = req.query;
    Logger.info(
      '<Controller>:<CustomerController>:<Count SOS Notification Initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<CustomerController>:<Count All Rewards Initiated>'
      );
      const userName = req?.userId;
      const role = req?.role;
      const result = await this.customerService.countAllRewards(
        userName,
        role,
        oemId as string
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

  getAllRewardsPaginated = async (req: Request, res: Response) => {
    const { pageNo, pageSize, status, oemId, selectedPartner } = req.body;
    Logger.info(
      '<Controller>:<CustomerController>:<Get Paginated Rewards Initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<CustomerController>:<Get Paginated Rewards Initiated>'
      );
      const userName = req?.userId;
      const role = req?.role;
      const result = await this.customerService.getAllRewardsPaginated(
        pageNo,
        pageSize,
        status,
        userName,
        role,
        oemId,
        selectedPartner
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

  updateRewardStatus = async (req: Request, res: Response) => {
    const { status, rewardId } = req.body;
    Logger.info(
      '<Controller>:<CustomerController>:<Updata Reward status Initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<CustomerController>:<Update Reward Status Initiated>'
      );
      const result = await this.customerService.updateRewardStatus(
        status,
        rewardId
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

  getInviteUserPerCustomerId = async (req: Request, res: Response) => {
    const { customerId } = req.query;
    if (!customerId) {
      res.send({
        message: 'Customer Id not found'
      });
    }
    Logger.info(
      '<Controller>:<CustomerController>:<Get Invite users per customerId Initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<CustomerController>:<Get Invite Users per customerId Initiated>'
      );
      const result = await this.customerService.getInviteUserPerCustomerId(
        customerId as string
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

  getRewardsList = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<CustomerController>:<Get all active rewards list Initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<CustomerController>:<Get all ative rewards list Initiated>'
      );
      const result = await this.customerService.getRewardsList();
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
      oemUserName
    }: {
      coordinates: number[];
      oemUserName: string;
    } = req.body;
    Logger.info(
      '<Controller>:<CustomerController>:<Search and Filter Stores request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<CustomerController>:<Search and Filter Stores request controller initiated>'
      );
      const result = await this.customerService.getNearestDealer({
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

  sendCouponRedeemOtp = async (req: Request, res: Response) => {
    const { phoneNumber } = req.body;
    Logger.info(
      '<Controller>:<CustomerController>:<Send Otp to redeem request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<CustomerController>:<Send Otp to redeem request controller initiated>'
      );
      const result = await this.customerService.sendCouponRedeemOtp(
        phoneNumber as string
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

  verifyCouponRedeemOtp = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<CustomerController>:<verify Otp to redeem request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<CustomerController>:<verify Otp to redeem request controller initiated>'
      );
      const result = await this.customerService.verifyCouponRedeemOtp(
        req.body
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

  getRedeemCouponsDetailsByCustomerId = async (req: Request, res: Response) => {
    const { customerId } = req.query;
    Logger.info(
      '<Controller>:<CustomerController>:<Get redeem coupons details by customerId controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<CustomerController>:<get Redeem Coupons details by customer id controller initiated>'
      );
      const result = await this.customerService.getRedeemCouponsDetailsByCustomerId(
        customerId as string
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

  countAllRedeemCoupons = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<CustomerController>:<Get all customers redeem coupons request controller initiated>'
    );
    const searchText = req.query.searchText;
    const state = req.query.state;
    const city = req.query.city;
    const firstDate = req.query.firstDate;
    const lastDate = req.query.lastDate;
    const selectedPartner = req.query.selectedPartner;
    const oemId = req.query.oemId;
    const userName = req?.query?.userName;
    const role = req?.query?.role;
    try {
      const result = await this.customerService.countAllRedeemCoupons(
        searchText as string,
        state as string,
        city as string,
        selectedPartner as string,
        firstDate as string,
        lastDate as string,
        oemId as string,
        userName as string,
        role as string
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };


  getAllRedeemCouponsPaginated = async (req: Request, res: Response) => {
    const { pageNo, pageSize, searchText, firstDate, lastDate, state, city, selectedPartner, oemId } =
      req.body;
    Logger.info(
      '<Controller>:<CustomerController>:<Get Paginated Redeem Coupons Initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<CustomerController>:<Get Paginated Redeem Coupons Initiated>'
      );
      const userName = req?.userId;
      const role = req?.role;
      const result = await this.customerService.getAllRedeemCouponsPaginated(
        pageNo,
        pageSize,
        searchText,
        firstDate,
        lastDate,
        state,
        city,
        selectedPartner,
        oemId,
        userName,
        role
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
      case 'initiateUserVerification':
        return [
          // body('storeId', 'Store Id does not exist').exists().isString(),
          body('documentNo', 'Document Number does not exist')
            .exists()
            .isString(),
          body('documentType', 'Document Type does not exist')
            .exists()
            .isString()
        ];

      case 'approveUserVerification':
        return [
          body('phoneNumber', 'Phone Number does not exist')
            .exists()
            .isString(),
          body('verificationDetails', 'Details does not exist')
            .exists()
            .isObject(),
          body('documentType', 'Document Type does not exist')
            .exists()
            .isString()
        ];

      case 'verifyAadhar':
        return [
          body('phoneNumber', 'Phone Number does not exist')
            .exists()
            .isString(),
          body('clientId', 'Cliend Id does not exist').exists().isString(),
          body('otp', 'OTP does not exist').exists().isString()
        ];
      case 'getcustomerDetailsByCustomerId':
        return [
          body('customerId', 'Customer Id not Found').exists().isString()
        ];
      case 'createRewards':
        return [
          // body('storeId', 'Store Id does not exist').exists().isString(),
          body('title', 'Title does not exist').exists().isString(),
          body('description', 'Description does not exist').exists().isString(),
          body('quantity', 'Quantity does not exist').exists().isNumeric()
        ];
    }
  };
}
