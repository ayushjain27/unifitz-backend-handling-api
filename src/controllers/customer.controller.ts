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
import { ApproveUserVerifyRequest, VerifyAadharUserRequest, VerifyCustomerRequest } from '../interfaces';

@injectable()
export class CustomerController {
  private customerService: CustomerService;
  constructor(@inject(TYPES.CustomerService) customerService: CustomerService) {
    this.customerService = customerService;
  }
  create = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
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

  initiateUserVerification = async (req: Request, res: Response) => {
    const payload = req.body as VerifyCustomerRequest;
    Logger.info('<Controller>:<CustomerController>:<Verify User Initatiate>');

    try {
      const result = await this.customerService.initiateUserVerification(
        payload
      );
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
      const result = await this.customerService.approveUserVerification(
        payload
      );
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
      const result = await this.customerService.verifyAadhar(
        payload
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
          body('phoneNumber', 'Phone Number does not exist').exists().isString(),
          body('verificationDetails', 'Details does not exist')
            .exists()
            .isObject(),
          body('documentType', 'Document Type does not exist')
            .exists()
            .isString()
        ];

      case 'verifyAadhar':
        return [
          body('phoneNumber', 'Phone Number does not exist').exists().isString(),
          body('clientId', 'Cliend Id does not exist').exists().isString(),
          body('otp', 'OTP does not exist').exists().isString()
        ];
    }
  };
}
