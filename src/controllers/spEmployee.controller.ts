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

  uploadEmployeeImage = async (req: Request, res: Response) => {
    const { employeeId } = req.body;
    console.log(req.body,"afdmslkflm")
    Logger.info(
      '<Controller>:<SPEmployeeController>:<Upload Employee request initiated>'
    );
    try {
      const result = await this.spEmployeeService.updateEmployeeImage(
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

  getAllEmployeesByUserName = async (req: Request, res: Response) => {
    const userName = req.query.userName
    Logger.info(
      '<Controller>:<SPEmployeeController>:<Get All employees request controller initiated>'
    );
    try {
      const result = await this.spEmployeeService.getAllEmployeesByUserName(userName as string);
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
      const result = await this.spEmployeeService.getEmployeeByEmployeeId(employeeId as string, userName as string);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateEmployee = async (req: Request, res: Response) => {
    const employeeRequest =  req.body;
    Logger.info(
      '<Controller>:<SPEmployeeController>:<Onboarding request controller initiated>'
    );
    try {
      const result = await this.spEmployeeService.update(
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

  deleteEmployee = async (req: Request, res: Response) => {
    const employeeId = req.query.employeeId;
    const userName = req.query.userName;
    Logger.info(
      '<Controller>:<SPEmployeeController>:<Delete employeee by employeeID request controller initiated>'
    );
    try {
      const result = await this.spEmployeeService.deleteEmployee(employeeId as string, userName as string);
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
      const result = await this.spEmployeeService.resetPassword(employeeId as string, oemId as string);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

}
