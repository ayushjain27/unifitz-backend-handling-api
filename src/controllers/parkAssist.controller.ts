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
  ParkAssistChatRequest,
  ParkAssistUserRequest,
  UserPaymentRequest,
  VerifyAadharUserRequest,
  VerifyCustomerRequest
} from '../interfaces';
import { permissions } from '../config/permissions';
import { RazorPayService } from './../services/razorpay.service';
import { ParkAssistService } from './../services';

@injectable()
export class ParkAssistController {
  private parkAssistService: ParkAssistService;
  constructor(
    @inject(TYPES.ParkAssistService) parkAssistService: ParkAssistService
  ) {
    this.parkAssistService = parkAssistService;
  }

  createUser = async (req: Request, res: Response): Promise<any> => {
    const parkAssistUserRequest: ParkAssistUserRequest = req.body;
    Logger.info(
      '<Controller>:<ParkAssistController>:<Get park assist user creation request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<ParkAssistController>:<Get park assist user creation request controller initialised>'
      );
      const result = await this.parkAssistService.createUser(
        parkAssistUserRequest
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

  createUserChat = async (req: Request, res: Response): Promise<any> => {
    const parkAssistUserChatRequest: ParkAssistChatRequest = req.body;
    Logger.info(
      '<Controller>:<ParkAssistController>:<Get park assist user chat creation request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<ParkAssistController>:<Get park assist user chat creation request controller initialised>'
      );
      const result = await this.parkAssistService.createUserChat(
        parkAssistUserChatRequest
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

  getUserChatDetails = async (req: Request, res: Response): Promise<any> => {
    const dataRequest: any = req.query;
    if (!dataRequest.senderId) {
      return res.json({ error: 'Sender Id is required' });
    }
    if (!dataRequest.receiverId) {
      return res.json({ error: 'Receiver Id is required' });
    }
    if (!dataRequest.vehicleNumber) {
      return res.json({ error: 'Vehicle Number is required' });
    }
    Logger.info(
      '<Controller>:<ParkAssistController>:<Get park assist user chat messagee request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<ParkAssistController>:<Get park assist user chat message request controller initialised>'
      );
      const result =
        await this.parkAssistService.getUserChatDetails(dataRequest);
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

  getUserDetails = async (req: Request, res: Response): Promise<any> => {
    const dataRequest: any = req.query;
    if (!dataRequest.senderId) {
      return res.json({ error: 'Sender Id is required' });
    }
    Logger.info(
      '<Controller>:<ParkAssistController>:<Get park assist user chat details request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<ParkAssistController>:<Get park assist user chat details request controller initialised>'
      );
      const result = await this.parkAssistService.getUserDetails(dataRequest);
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

  deleteAllChats = async (req: Request, res: Response): Promise<any> => {
    const dataRequest: any = req.query;
    if (!dataRequest.senderId) {
      return res.json({ error: 'Sender Id is required' });
    }
    if (!dataRequest.receiverId) {
      return res.json({ error: 'Receiver Id is required' });
    }
    Logger.info(
      '<Controller>:<ParkAssistController>:<Delete park assist user chat details request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<ParkAssistController>:<Delete park assist user chat details request controller initialised>'
      );
      const result = await this.parkAssistService.deleteAllChats(dataRequest);
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

  sendNotificationToUser = async (
    req: Request,
    res: Response
  ): Promise<any> => {
    const dataRequest: any = req.query;
    Logger.info(
      '<Controller>:<ParkAssistController>:<Send notification to emergency contacts request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<ParkAssistController>:<DSend notification to emergency contacts request controller initialised>'
      );
      const result =
        await this.parkAssistService.sendNotificationToUser(dataRequest);
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

  countAllSOSNotifications = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<ParkAssistController>:<Count SOS Notification Initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<ParkAssistController>:<Count SOS Notification Initiated>'
      );
      const result = await this.parkAssistService.countAllSOSNotifications();
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

  getAllSOSNotifificationPaginated = async (req: Request, res: Response) => {
    const { pageNo, pageSize } = req.body;
    Logger.info(
      '<Controller>:<ParkAssistController>:<Get Paginated SOS Notification Initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<ParkAssistController>:<Get Paginated SOS Notification Initiated>'
      );
      const result =
        await this.parkAssistService.getAllSOSNotifificationPaginated(
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

  getSOSNotifificationDetail = async (req: Request, res: Response) => {
    const { id } = req.query;
    Logger.info(
      '<Controller>:<ParkAssistController>:<Get SOS Notification Detail Initiated>'
    );
    try {
      Logger.info(
       '<Controller>:<ParkAssistController>:<Get SOS Notification Detail Initiated>'
      );
      const result =
        await this.parkAssistService.getSOSNotifificationDetail(
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

  validate = (method: string) => {
    switch (method) {
      case 'createUser':
        return [
          // body('storeId', 'Store Id does not exist').exists().isString(),
          body('senderId', 'Sender Id is required').exists().isString(),
          body('receiverId', 'Receiver Id is required').exists().isString(),
          body('vehicleNumber', 'Vehicle Number is required')
            .exists()
            .isString(),
          body('platform', 'Platform is required').exists().isString()
        ];
      case 'createUserChat':
        return [
          // body('storeId', 'Store Id does not exist').exists().isString(),
          body('senderId', 'Sender Id is required').exists().isString(),
          body('receiverId', 'Receiver Id is required').exists().isString(),
          body('message', 'Message is required').exists().isString(),
          body('platform', 'Platform is required').exists().isString(),
          body('vehicleNumber', 'Vehicle Number is required')
            .exists()
            .isString()
        ];
    }
  };
}
