import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import { EventService } from '../services/event.service';
import { body, validationResult, query } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import Logger from '../config/winston';
import { Response } from 'express';
import Request from '../types/request';
import { DeliveryPartnerService } from '../services';

@injectable()
export class DeliveryPartnerController {
  private deliveryPartnerService: DeliveryPartnerService;
  constructor(
    @inject(TYPES.DeliveryPartnerService) deliveryPartnerService: DeliveryPartnerService
  ) {
    this.deliveryPartnerService = deliveryPartnerService;
  }

  createDeliverPartner = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const deliveryPartnerRequest = req.body;
    Logger.info(
      '<Controller>:<DeliveryPartnerController>:<Create delivery partners controller initiated>'
    );
    try {
      const result = await this.deliveryPartnerService.create(deliveryPartnerRequest);
      res.send({
        message: 'Delivery Partners Creation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  uploadDeliveryPartnerImage = async (req: Request, res: Response) => {
    const { deliveryPartnerId } = req.body;
    Logger.info(
      '<Controller>:<DeliveryPartnerController>:<Upload Delivery partner image request initiated>'
    );
    try {
      const result = await this.deliveryPartnerService.uploadDeliveryPartnerImage(
        deliveryPartnerId,
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

  getDeliveryPartnersPaginated = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<DeliveryPartnerController>:<Get all delivery partners request controller initiated>'
    );
    try {
      const role = req?.role;
      const userName = req?.userId;
      const result = await this.deliveryPartnerService.getDeliveryPartnersPaginated(
        req.body.pageNo,
        req.body.pageSize,
        req.body,
        role,
        userName,
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  countAllDeliveryPartners = async (req: Request, res: Response) => {
    const query = req.query;
    const role = req?.role;
    const userName = req?.userId;
    Logger.info(
      '<Controller>:<DeliveryPartnerController>:<Count all delivery partner request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<DeliveryPartnerController>:<Count all delivery partners request controller initiated>'
      );
      const result: any = await this.deliveryPartnerService.countAllDeliveryPartners(
        query,
        role,
        userName
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

  getAllDeliveryPartnersByUserName = async (req: Request, res: Response) => {
    const oemId = req.query?.oemId;
    const role = req?.role;
    const userName = req?.userId;
    Logger.info(
      '<Controller>:<DeliveryPartnerController>:<Get all delivery partner by username request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<DeliveryPartnerController>:<Count all delivery partners by username request controller initiated>'
      );
      const result: any = await this.deliveryPartnerService.getAllDeliveryPartnersByUserName(
        oemId as string,
        role,
        userName
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
}
