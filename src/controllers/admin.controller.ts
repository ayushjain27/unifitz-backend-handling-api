import { Response } from 'express';
import { body, validationResult } from 'express-validator';
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
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }

    // const { userName, password } = req.body;

    Logger.info(
      '<Controller>:<AdminController>:<Admin creation controller initiated>'
    );
    try {
      const result = await this.adminService.create(req.body);

      res.json({
        message: 'Admin Creation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  uploadProfileImage = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    Logger.info(
      '<Controller>:<AdminController>:<Admin uploading profile picture of the admin user>'
    );
    try {
      const { userId } = req.body;

      const result = await this.adminService.uploadAdminImage(userId, req);
      res.send({
        result
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
        ...result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getUser = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<AdminController>:<Getting user by user name>');
    try {
      const userName = req.userId;
      const result = await this.adminService.getAdminUserByUserName(userName);
      Logger.info('<Controller>:<AdminController>:<User got successfully>');
      res.send({
        message: 'User obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updatePassword = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>: <AdminController>: Updating password for the user'
    );

    try {
      const userName = req?.userId;
      const password = req?.body?.password;
      const result = await this.adminService.updatePassword(userName, password);
      Logger.info(
        '<Controller>:<AdminController>:<Password updated successfully>'
      );
      res.send({
        message: 'Password updated successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  validate = (method: string) => {
    switch (method) {
      case 'createUser':
        return [
          body('ownerName', 'Owner Name does not exist').exists().isString(),

          body('businessName', 'Business Name does not exist')
            .exists()
            .isString()
        ];

      case 'uploadProfile':
        return [body('userId', 'User name does not exist').exists().isString()];
    }
  };
}
