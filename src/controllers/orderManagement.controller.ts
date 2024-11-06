import { Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Request from '../types/request';
import { OrderManagementService } from '../services';
import { OrderRequest } from '../interfaces/orderRequest.interface';

@injectable()
export class OrderManagementController {
  private orderManagementService: OrderManagementService;
  constructor(
    @inject(TYPES.OrderManagementService)
    orderManagementService: OrderManagementService
  ) {
    this.orderManagementService = orderManagementService;
  }

  createOrder = async (req: any, res: Response) => {
    Logger.info(
      '<Controller>:<OrderManagementController>:<Request Order controller initiated>'
    );
    try {
      const phoneNumber = req.userId as string;
      const userRole = req.role as string;
      const reqBody: OrderRequest = {
        items: req.body.items,
        shippingAddress: req.body?.shippingAddress as string,
        totalAmount: req.body?.totalAmount as number,
        phoneNumber,
        userRole
      };
      const result = await this.orderManagementService.create(reqBody);
      res.send({
        message: 'Create Order Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getOrderById = async (req: any, res: Response) => {
    Logger.info(
      '<Controller>:<OrderManagementController>:<Request Order By Id controller initiated>'
    );
    try {
      const orderId = req.params.orderId;
      const result = await this.orderManagementService.getOrderById(orderId);
      res.send({
        message: 'Get Order Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getUserAllOrders = async (req: any, res: Response) => {
    Logger.info(
      '<Controller>:<OrderManagementController>:<Request User Orders controller initiated>'
    );
    try {
      const phoneNumber = req.userId as string;
      const userRole = req.role as string;
      const result = await this.orderManagementService.getUserAllOrders(
        phoneNumber,
        userRole
      );
      res.send({
        message: 'Get All Orders Request Successful',
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
      case 'createOrder':
        return [
          body('shippingAddress', 'Shipping Address does not exist')
            .exists()
            .isString(),

          body('items', 'Cart Items does not exist').exists().isArray(),
          body('totalAmount', 'Total Amount does not exist')
            .exists()
            .isNumeric()
        ];
    }
  };
}
