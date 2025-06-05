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
      '<Controller>:<SPEmployeeController>:<Upload Employee request initiated>'
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

  getAllEmployeesByUserName = async (req: Request, res: Response) => {
    const userName = req.query.userName;
    Logger.info(
      '<Controller>:<SPEmployeeController>:<Get All employees request controller initiated>'
    );
    try {
      const result = await this.deliveryPartnerService.getAllEmployeesByUserName(
        userName as string
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getEmployeeByEmployeeId = async (req: Request, res: Response) => {
    const employeeId = req.query.employeeId;
    const userName = req.query.userName;
    Logger.info(
      '<Controller>:<SPEmployeeController>:<Get employee by employeeID request controller initiated>'
    );
    try {
      const result = await this.deliveryPartnerService.getEmployeeByEmployeeId(
        employeeId as string,
        userName as string
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateEmployee = async (req: Request, res: Response) => {
    const employeeRequest = req.body;
    Logger.info(
      '<Controller>:<SPEmployeeController>:<Onboarding request controller initiated>'
    );
    try {
      const result = await this.deliveryPartnerService.update(employeeRequest);
      res.send({
        message: 'Employee Updation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  deleteEmployee = async (req: Request, res: Response) => {
    const employeeId = req.query.employeeId;
    const userName = req.query.userName;
    Logger.info(
      '<Controller>:<SPEmployeeController>:<Delete employeee by employeeID request controller initiated>'
    );
    try {
      const result = await this.deliveryPartnerService.deleteEmployee(
        employeeId as string,
        userName as string
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    const employeeId = req.query.employeeId;
    const oemId = req.query.userName;
    Logger.info(
      '<Controller>:<SPEmployeeController>:<Reset employee password by  request controller initiated>'
    );
    try {
      const result = await this.deliveryPartnerService.resetPassword(
        employeeId as string,
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

  updatePermission = async (req: Request, res: Response) => {
    const employeeRequest = req.body;
    Logger.info(
      '<Controller>:<SPEmployeeController>:<Onboarding request controller initiated>'
    );
    try {
      const result = await this.deliveryPartnerService.updatePermission(
        employeeRequest
      );
      res.send({
        message: 'Employee Updation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  updateUserPermission = async (req: Request, res: Response) => {
    const employeeRequest = req.body;
    Logger.info(
      '<Controller>:<SPEmployeeController>:<Onboarding request controller initiated>'
    );
    try {
      const result = await this.deliveryPartnerService.updateUserPermission(
        employeeRequest
      );
      res.send({
        message: 'Employee Updation Successful',
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
