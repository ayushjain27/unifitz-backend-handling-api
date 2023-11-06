import { Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Request from '../types/request';
import { EmployeeService } from './../services/employee.service';

@injectable()
export class EmployeeController {
  private employeeService: EmployeeService;
  constructor(@inject(TYPES.EmployeeService) employeeService: EmployeeService) {
    this.employeeService = employeeService;
  }

  createEmployee = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const employeeRequest = req.body;
    Logger.info(
      '<Controller>:<EmployeeController>:<Create employee controller initiated>'
    );
    try {
      const result = await this.employeeService.create(employeeRequest);
      res.send({
        message: 'Employee Creation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getEmployeesByStoreId = async (req: Request, res: Response) => {
    const storeId = req.params.storeId;

    if (!storeId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Store Id is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<EmployeeController>:<Get employees by store id controller initiated>'
    );
    try {
      const result = await this.employeeService.getEmployeesByStoreId(storeId);
      res.send({
        message: 'Employee Fetch Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  validate = (method: string) => {
    switch (method) {
      case 'createEmployee':
        return [
          body('name', 'Name does not exist').exists().isString(),

          body('role', 'Role does not exist').exists(),

          body('storeId', 'storeId does not exist').exists().isString()
        ];
    }
  };
}
