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
  UserPaymentRequest,
  VerifyAadharUserRequest,
  VerifyCustomerRequest
} from '../interfaces';
import { permissions } from '../config/permissions';
import { RazorPayService } from './../services/razorpay.service';

@injectable()
export class RazorPayController {
  private razorPayService: RazorPayService;
  constructor(@inject(TYPES.RazorPayService) razorPayService: RazorPayService) {
    this.razorPayService = razorPayService;
  }

  createRazorPaySubscription = async (
    req: Request,
    res: Response
  ): Promise<any> => {
    const { plan_id, customer_email, customer_id, purpose } = req.body;
    if (!plan_id) {
      return res.status(400).json({ error: "Plan ID is required" });
    }
    if (!customer_email) {
      return res.status(400).json({ error: "Email is required" });
    }

    Logger.info(
      '<Controller>:<RazorPayController>:<Get razorpay subscription request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<RazorPayController>:<Get razorpay subscription request controller initiated>'
      );
      const result =
        await this.razorPayService.createRazorPaySubscription(
          plan_id as string,
          customer_email as string,
          customer_id as string,
          purpose as string
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

  createPayment = async (
    req: Request,
    res: Response
  ): Promise<any> => {
    const paymentRequest: UserPaymentRequest = req.body;
    Logger.info(
      '<Controller>:<RazorPayController>:<Get razorpay subscription request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<RazorPayController>:<Get razorpay subscription request controller initiated>'
      );
      const result =
        await this.razorPayService.createPayment(
            paymentRequest
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

  updatePaymentStatus = async (
    req: Request,
    res: Response
  ): Promise<any> => {
    const paymentRequest = req.body;
    Logger.info(
      '<Controller>:<RazorPayController>:<Get razorpay subscription request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<RazorPayController>:<Get razorpay subscription request controller initiated>'
      );
      const result =
        await this.razorPayService.updatePaymentStatus(
            paymentRequest
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

  getPaymentDetails = async (
    req: Request,
    res: Response
  ): Promise<any> => {
    const paymentRequest = req.query;
    Logger.info(
      '<Controller>:<RazorPayController>:<Get razorpay subscription request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<RazorPayController>:<Get razorpay subscription request controller initiated>'
      );
      const result =
        await this.razorPayService.getPaymentDetails(
            paymentRequest
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
      case 'createPayment':
        return [
          // body('storeId', 'Store Id does not exist').exists().isString(),
          body('purpose', 'Purpose is required')
            .exists()
            .isString()
        ];
      case 'updatePaymentStatus':
        return [
          // body('storeId', 'Store Id does not exist').exists().isString(),
          body('purpose', 'Purpose is required')
            .exists()
            .isString()
        ];
    }
  };
}
