import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import { EventService } from '../services/event.service';
import { body, validationResult, query } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import Logger from '../config/winston';
import { Response } from 'express';
import Request from '../types/request';
import { SPEmployeeService } from '../services';

@injectable()
export class SPEmployeeController {
  private spEmployeeService: SPEmployeeService;
  constructor(@inject(TYPES.SPEmployeeService) spEmployeeService: SPEmployeeService) {
    this.spEmployeeService = spEmployeeService;
  }

  createEmployee = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const employeeRequest = req.body;
    Logger.info(
      '<Controller>:<SPEmployeeController>:<Create employee controller initiated>'
    );
    try {
      const result = await this.spEmployeeService.create(employeeRequest);
      res.send({
        message: 'Employee Creation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

}
