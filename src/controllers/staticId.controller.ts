import { Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Request from '../types/request';
import { EmployeeService } from '../services/employee.service';
import { IEmployee } from '../models/Employee';
import { appendCodeToPhone } from '../utils/common';
import { StaticIdService } from '../services/staticId.service';

@injectable()
export class StaticIdController {
  private staticIdService: StaticIdService;
  constructor(@inject(TYPES.StaticIdService) staticIdService: StaticIdService) {
    this.staticIdService = staticIdService;
  }

  createStaticId = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const staticIdRequest = req.body;
    Logger.info(
      '<Controller>:<StaticIdController>:<Create static Id controller initiated>'
    );
    try {
      const result = await this.staticIdService.create(staticIdRequest);
      res.send({
        message: 'Static Id Creation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

//   uploadEmployeeImage = async (req: Request, res: Response) => {
//     const { employeeId } = req.body;
//     Logger.info(
//       '<Controller>:<EmployeeController>:<Upload Employee request initiated>'
//     );
//     try {
//       const result = await this.employeeService.updateEmployeeImage(
//         employeeId,
//         req
//       );
//       res.send({
//         result
//       });
//     } catch (err) {
//       Logger.error(err.message);
//       res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
//     }
//   };

//   getEmployeesByStoreId = async (req: Request, res: Response) => {
//     const storeId = req.params.storeId;

//     if (!storeId) {
//       res
//         .status(HttpStatusCodes.BAD_REQUEST)
//         .json({ errors: { message: 'Store Id is not present' } });
//       return;
//     }
//     Logger.info(
//       '<Controller>:<EmployeeController>:<Get employees by store id controller initiated>'
//     );
//     try {
//       const result = await this.employeeService.getEmployeesByStoreId(storeId);
//       res.send({
//         message: 'Employee Fetch Successful',
//         result
//       });
//     } catch (err) {
//       Logger.error(err.message);
//       res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
//     }
//   };

//   update = async (req: Request, res: Response) => {
//     const employeePayload: IEmployee = req.body;
//     const employeeId = req.params.employeeId;
//     Logger.info(
//       '<Controller>:<EmployeeController>:<Employee update controller initiated>'
//     );
//     try {
//       const result = await this.employeeService.update(
//         employeeId,
//         employeePayload
//       );
//       res.send({
//         message: 'Employee update successful',
//         result
//       });
//     } catch (err) {
//       Logger.error(err.message);
//       res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
//     }
//   };

//   getEmployeesByEmployeeId = async (req: Request, res: Response) => {
//     const storeId = req.query.storeId;
//     const employeeId = req.params.employeeId

//     if (!storeId) {
//       res
//         .status(HttpStatusCodes.BAD_REQUEST)
//         .json({ errors: { message: 'Store Id is not present' } });
//       return;
//     }

//     Logger.info(
//       '<Controller>:<EmployeeController>:<Get employees by store id controller initiated>'
//     );
//     try {
//       const result = await this.employeeService.getEmployeesByEmployeeId(storeId as string, employeeId as string);
//       res.send({
//         message: 'Employee Fetch Successful',
//         result
//       });
//     } catch (err) {
//       Logger.error(err.message);
//       res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
//     }
//   };
}
