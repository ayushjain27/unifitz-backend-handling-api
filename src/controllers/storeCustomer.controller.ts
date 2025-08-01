import { Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Request from '../types/request';
import { EmployeeService } from './../services/employee.service';
import { IEmployee } from '../models/Employee';
import { appendCodeToPhone } from '../utils/common';
import { StoreCustomerService } from './../services/storeCustomer.service';

@injectable()
export class StoreCustomerController {
  private storeCustomerService: StoreCustomerService;
  constructor(
    @inject(TYPES.StoreCustomerService)
    storeCustomerService: StoreCustomerService
  ) {
    this.storeCustomerService = storeCustomerService;
  }

  createStoreCustomer = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const storeCustomerRequest = req.body;
    Logger.info(
      '<Controller>:<StoreCustomerController>:<Create store Customer controller initiated>'
    );
    try {
      const result = await this.storeCustomerService.create(
        storeCustomerRequest
      );
      res.send({
        message: 'Store Customer Creation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getStoreCustomersByStoreId = async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    if (!storeId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Store Id is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<StoreCustomerController>:<Get store customer by store id controller initiated>'
    );
    try {
      const result = await this.storeCustomerService.getStoreCustomerByStoreId(
        storeId
      );
      res.send({
        message: 'Store Customer Fetch Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getStoreCustomerByPhoneNumber = async (req: Request, res: Response) => {
    const phoneNumber = req.query.phoneNumber;
    const storeId = req.query.storeId;

    if (!phoneNumber) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({
        errors: { message: 'Customer with same phone number is not present' }
      });
      return;
    }
    Logger.info(
      '<Controller>:<StoreCustomerController>:<Get store customer by phone number controller initiated>'
    );
    try {
      const result =
        await this.storeCustomerService.getStoreCustomerByPhoneNumber(
          phoneNumber as string,
          storeId as string
        );
      res.send({
        message: 'Store Customer Fetch Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  createStoreCustomerVehicle = async (req: Request, res: Response) => {
    const { customerId } = req.body;
    Logger.info(
      '<Controller>:<StoreCustomerController>:<Upload Store Customer request initiated>'
    );
    const storeCustomerVehicleRequest = req.body;
    try {
      const result = await this.storeCustomerService.createStoreCustomerVehicle(
        customerId,
        storeCustomerVehicleRequest
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  uploadStoreCustomerVehicleImages = async (req: Request, res: Response) => {
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    Logger.info(
      '<Controller>:<StoreCustomerController>:<Upload Store Customer Vehicle request initiated>'
    );
    try {
      const result =
        await this.storeCustomerService.uploadStoreCustomerVehicleImages(req);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  validate = (method: string) => {
    switch (method) {
      case 'createStoreCustomer':
        return [
          body('name', 'Name does not exist').exists().isString(),

          body('phoneNumber', 'Phone Number does not exist').exists(),

          body('email', 'Email does not exist').exists().isString(),

          body('storeId', 'StoreId does not exist').exists().isString()
        ];
    }
  };
}
