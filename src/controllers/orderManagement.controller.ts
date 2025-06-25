import { Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Request from '../types/request';
import { OrderManagementService } from '../services';
import {
  OrderRequest,
  OrderStatusRequest
} from '../interfaces/orderRequest.interface';

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

  getUserAllOrdersPaginated = async (req: any, res: Response) => {
    Logger.info(
      '<Controller>:<OrderManagementController>:<Request User Orders controller initiated>'
    );
    try {
      const phoneNumber = req.userId as string;
      const userRole = req.role as string;
      const result = await this.orderManagementService.getUserAllOrders(
        phoneNumber,
        userRole,
        req.body.pageNo,
        req.body.pageSize,
        req.body.status
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

  updateCartStatus = async (req: any, res: Response) => {
    Logger.info(
      '<Controller>:<OrderManagementController>:<Request Order controller initiated>'
    );
    try {
      const reqBody: OrderStatusRequest = {
        distributorId: req.body.distributorId,
        orderId: req.body.orderId,
        cartId: req.body?.cartId,
        productId: req.body?.productId,
        cancelReason: req.body?.cancelReason,
        courierCompanyName: req.body?.courierCompanyName,
        trackingNumber: req.body?.trackingNumber,
        trackingLink: req.body?.trackingLink,
        deliveryPartner: req.body?.deliveryPartner,
        deliveryType: req.body?.deliveryType,
        selectedVehicleType: req.body?.selectedVehicleType,
        status: req.body.status,
        employeeStatus: req.body.employeeStatus
      };
      const userName = req?.userId;
      const result = await this.orderManagementService.updateCartStatus(
        reqBody,
        userName
      );
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

  getAllDistributorsOrdersPaginated = async (req: Request, res: Response) => {
    const userName = req.userId;
    const role = req?.role;
    const { userType, status, pageNo, pageSize, oemId, employeeId, firstDate, lastDate,
      storeId, adminFilterOemId, state, city
    } = req.body;
    Logger.info(
      '<Controller>:<OrderManagementController>:<Search and Filter Distributors orders pagination request controller initiated>'
    );
    try {
      const result =
        await this.orderManagementService.getAllDistributorsOrdersPaginated(
          userName,
          role,
          userType,
          status,
          oemId,
          pageNo,
          pageSize,
          employeeId,
          firstDate,
          lastDate,
          storeId,
          adminFilterOemId,
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

  getDistributorOrdersCount = async (req: Request, res: Response) => {
    const userName = req.userId;
    const role = req?.role;
    const oemId = req?.query?.oemId;
    const status = req?.query?.status;
    const userType = req?.query?.userType;
    const verifiedStore = req?.query?.verifiedStore;
    const employeeId = req?.query?.employeeId;
    const firstDate = req?.query?.firstDate;
    const lastDate = req?.query?.lastDate;
    const storeId = req?.query?.storeId;
    const adminFilterOemId = req?.query?.adminFilterOemId;
    const state = req?.query?.state;
    const city = req?.query?.city;
    const oemUserId = req?.query?.oemUserId;

    Logger.info(
      '<Controller>:<OrderManagementController>:<Search and Filter Orders count request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<OrderManagementController>:<Search and Filter Orders count ination request controller initiated>'
      );
      const result =
        await this.orderManagementService.getDistributorOrdersCount(
          userName,
          role,
          oemId as string,
          userType as string,
          status as string,
          verifiedStore as string,
          employeeId as string,
          firstDate as string,
          lastDate as string,
          storeId as string,
          adminFilterOemId as string,
          state as string,
          city as string,
          oemUserId as string
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

  countAllDistributorTotalAmount = async (req: Request, res: Response) => {
    const userName = req.userId;
    const role = req?.role;
    const oemId = req?.query?.oemId;
    const status = req?.query?.status;
    const userType = req?.query?.userType;
    const verifiedStore = req?.query?.verifiedStore;
    const employeeId = req?.query?.employeeId;
    const firstDate = req?.query?.firstDate;
    const lastDate = req?.query?.lastDate;
    const storeId = req?.query?.storeId;
    const adminFilterOemId = req?.query?.adminFilterOemId;
    const state = req?.query?.state;
    const city = req?.query?.city;

    Logger.info(
      '<Controller>:<OrderManagementController>:<Search and Filter Orders count request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<OrderManagementController>:<Search and Filter Orders count ination request controller initiated>'
      );
      const result =
        await this.orderManagementService.countAllDistributorTotalAmount(
          userName,
          role,
          oemId as string,
          userType as string,
          status as string,
          verifiedStore as string,
          employeeId as string,
          firstDate as string,
          lastDate as string,
          storeId as string,
          adminFilterOemId as string,
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

  getDistributorOrderById = async (req: Request, res: Response) => {
    const id = req?.query?.id;

    Logger.info(
      '<Controller>:<OrderManagementController>:<Get Order Details By Id>'
    );
    try {
      Logger.info(
        '<Controller>:<OrderManagementController>:<Get Order Details By Id>'
      );
      const result = await this.orderManagementService.getDistributorOrderById(
        id as string
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

  updatePaymentMode = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<OrderManagementController>:<Update Payment Details Initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<OrderManagementController>:<Update Payment Details Initiated>'
      );
      const result = await this.orderManagementService.updatePaymentMode(
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

  updatePaymentStatus = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<OrderManagementController>:<Update Payment Status Initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<OrderManagementController>:<Update Payment Status Initiated>'
      );
      const result = await this.orderManagementService.updatePaymentStatus(
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

  createSparePostRequirement = async (req: Request, res: Response) => {
    try {
      Logger.info(
        '<Controller>:<OrderManagementController>:<create SparePost request controller initiated>'
      );
      const result =
        await this.orderManagementService.createSparePostRequirement(req.body);
      res.send({
        result,
        created: 'successful'
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateAudio = async (req: Request, res: Response) => {
    const { fileID } = req.body;
    Logger.info(
      '<Controller>:<OrderManagementController>:<Upload audio request initiated>'
    );
    try {
      const result = await this.orderManagementService.updateAudio(fileID, req);
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

  updateImage = async (req: Request, res: Response) => {
    const { fileID } = req.body;
    Logger.info(
      '<Controller>:<OrderManagementController>:<Upload image request initiated>'
    );
    try {
      const result = await this.orderManagementService.updateImage(fileID, req);
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

  updateSparePost = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<OrderManagementController>:<Update sparePost Status>');
    const sparePostId = req.params.sparePostId;
    try {
      const result = await this.orderManagementService.updateSparePost(
        req.body,
        sparePostId
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  deleteSparePost = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<OrderManagementController>:<Delete SparePost>');
    const sparePostId = req.params.sparePostId;
    try {
      const result = await this.orderManagementService.deleteSparePost(
        sparePostId
      );
      res.send({
        message: 'SparePostRequirement deleted successfully'
        // result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getSparePostRequirementDetails = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<OrderManagementController>:<Getting ID>');
    try {
      const sparePostId = req.query.sparePostId;
      const platform = req.query.platform;
      const pageNo = Number(req.query.pageNo);
      const pageSize = Number(req.query.pageSize || 10);
      const result =
        await this.orderManagementService.getSparePostRequirementDetails(
          pageNo,
          pageSize,
          sparePostId as string,
          platform as string
        );
      Logger.info(
        '<Controller>:<OrderManagementController>:<get successfully>'
      );
      res.send({
        message: 'Details obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getSparePostPaginated = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<OrderManagementController>:<Get All request controller initiated>'
    );
    try {
      const userName = req?.userId;
      const role = req?.role;
      const pageNo = Number(req.query.pageNo);
      const pageSize = Number(req.query.pageSize || 10);
      const storeId = req.query.storeId;
      const vehicleType = req.query.vehicleType;
      const oemId = req?.query?.oemId;
      const firstDate = req?.query?.firstDate;
      const lastDate = req?.query?.lastDate;
      const adminFilterOemId = req?.query?.adminFilterOemId;
      const platform = req?.query?.platform;
      
      const result = await this.orderManagementService.getSparePostPaginated(
        pageNo,
        pageSize,
        storeId as string,
        vehicleType as string,
        userName as string,
        role as string,
        oemId as string,
        firstDate as string,
        lastDate as string,
        adminFilterOemId as string,
        platform as string
      );
      res.send({
        message: 'SparePostRequirement obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
  
  getSparePostCount = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<OrderManagementController>:<Get All request controller initiated>'
    );
    try {
      const storeId = req.query.storeId;
      const vehicleType = req.query.vehicleType;
      const userName = req?.userId;
      const role = req?.role;
      const oemId = req?.query?.oemId;
      const firstDate = req?.query?.firstDate;
      const lastDate = req?.query?.lastDate;
      const adminFilterOemId = req?.query?.adminFilterOemId;
      const platform = req?.query?.platform;
      
      const result = await this.orderManagementService.getSparePostCount(
        storeId as string,
        vehicleType as string,
        userName as string,
        role as string,
        oemId as string,
        firstDate as string,
        lastDate as string,
        adminFilterOemId as string,
        platform as string
      );
      res.send({
        message: 'SparePostRequirement obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getSparePostRequirementDetailById = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<OrderManagementController>:<Getting ID>');
    try {
      const spareRequirementId = req.query.spareRequirementId;
      if (!spareRequirementId) {
        throw new Error('Id is required')
      }
      const result =
        await this.orderManagementService.getSparePostRequirementDetailById(
          spareRequirementId as string
        );
      Logger.info(
        '<Controller>:<OrderManagementController>:<get successfully>'
      );
      res.send({
        message: 'Marketing obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  createSparePostStatus = async (req: Request, res: Response) => {
    try {
      Logger.info(
        '<Controller>:<OrderManagementController>:<create SparePost request controller initiated>'
      );
      const userName = req?.userId;
      const role = req?.role;
      const result =
        await this.orderManagementService.createSparePostStatus(req.body, userName, role);
      res.send({
        result,
        created: 'successful'
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getSparePostStatusDetails = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<OrderManagementController>:<Getting ID>');
    try {
      const sparePostId = req.query.sparePostId;
      const userName = req?.userId;
      const role = req?.role;
      const oemId = req?.query?.oemId;
      const result =
        await this.orderManagementService.getSparePostStatusDetails(
          sparePostId as string,
          userName,
          role,
          oemId as string
        );
      res.send({
        message: 'Details obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
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
      case 'paymentMode':
        return [
          body('paymentType', 'Payment Type is required').exists().isString(),
          body('totalPayment', 'Total Payment is required')
            .exists()
            .isNumeric(),
          body('advancePayment', 'Advance Payment is required')
            .exists()
            .isNumeric(),
          body('balancePayment', 'Balance Payment is required')
            .exists()
            .isNumeric()
        ];
    }
  };
}
