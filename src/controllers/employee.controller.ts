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

  uploadEmployeeImage = async (req: Request, res: Response) => {
    const { employeeId } = req.body;
    Logger.info(
      '<Controller>:<EmployeeController>:<Upload Employee request initiated>'
    );
    try {
      const result = await this.employeeService.updateEmployeeImage(
        employeeId,
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

  getEmployeesByStoreId = async (req: Request, res: Response) => {
    const storeId = req.query.storeId;

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
      const result = await this.employeeService.getEmployeesByStoreId(
        storeId as string
      );
      res.send({
        message: 'Employee Fetch Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  update = async (req: Request, res: Response) => {
    const employeePayload: IEmployee = req.body;
    const employeeId = req.params.employeeId;
    Logger.info(
      '<Controller>:<EmployeeController>:<Employee update controller initiated>'
    );
    try {
      const result = await this.employeeService.update(
        employeeId,
        employeePayload
      );
      res.send({
        message: 'Employee update successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getEmployeesByEmployeeId = async (req: Request, res: Response) => {
    const storeId = req.query.storeId;
    const employeeId = req.params.employeeId;

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
      const result = await this.employeeService.getEmployeesByEmployeeId(
        storeId as string,
        employeeId as string
      );
      res.send({
        message: 'Employee Fetch Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getEmployeeDetailByPhoneNumber = async (req: any, res: Response) => {
    Logger.info(
      '<Controller>:<EmployeeController>:<Request Get Employee Detail controller initiated>'
    );
    try {
      const phoneNumber = req.query.phoneNumber;
      const result = await this.employeeService.getEmployeeDetailByPhoneNumber(
        phoneNumber
      );
      res.send({
        message: 'Employee Request Successful',
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
      case 'createEmployee':
        return [
          body('name', 'Name does not exist').exists().isString(),

          body('role', 'Role does not exist').exists(),

          body('storeId', 'Store Id does not exist').exists().isString(),
          body('phoneNumber', 'Phone Number does not exist').exists().isString()
        ];
    }
  };
}
