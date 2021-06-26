import { Response } from 'express';
import { validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { ICustomer } from '../models/Customer';
import Request from '../types/request';
import { CustomerService } from './../services/customer.service';

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
}
