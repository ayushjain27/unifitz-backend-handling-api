import { Response } from 'express';
import { validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { AdminService } from '../services/admin.service';
import Request from '../types/request';

@injectable()
export class AdminController {
  private adminService: AdminService;
  constructor(@inject(TYPES.AdminService) adminService: AdminService) {
    this.adminService = adminService;
  }
  create = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }

    const { userName, password } = req.body;

    Logger.info(
      '<Controller>:<AdminController>:<Admin creation controller initiated>'
    );
    try {
      const result = await this.adminService.create(userName, password);

      res.json({
        message: 'Admin Creation Successful',
        userName: result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  login = async (req: Request, res: Response) => {
    const { userName, password } = req.body;
    Logger.info(
      '<Controller>:<AdminController>:<Onboarding request controller initiated>'
    );
    try {
      const result = await this.adminService.login(userName, password);
      Logger.info('<Controller>:<AdminController>:<Token created succesfully>');
      res.send({
        message: 'Admin Login Successful',
        token: result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
}
