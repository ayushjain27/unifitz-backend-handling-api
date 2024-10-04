import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { DeleteAccountService } from './../services/deleteAccount.service';
import { AccountDeleteRequest } from '../interfaces/accountDeleteRequest.interface';

@injectable()
export class DeleteAccountController {
  private deleteAccountService: DeleteAccountService;
  constructor(
    @inject(TYPES.DeleteAccountService)
    deleteAccountService: DeleteAccountService
  ) {
    this.deleteAccountService = deleteAccountService;
  }

  createDeleteRequestAccount = async (req: any, res: Response) => {
    Logger.info(
      '<Controller>:<DeleteAccountController>:<Request Delete Account controller initiated>'
    );
    try {
      const phoneNumber = req.userId as string;
      const userRole = req.role as string;
      const reqBody: AccountDeleteRequest = {
        feedback: req.body.feedback as string[],
        comments: req.body?.comments as string,
        phoneNumber,
        userRole
      };
      const result = await this.deleteAccountService.create(reqBody);
      res.send({
        message: 'Deletion Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getDeleteRequest = async (req: any, res: Response) => {
    Logger.info(
      '<Controller>:<DeleteAccountController>:<Request Delete Account controller initiated>'
    );
    try {
      const phoneNumber = req.userId as string;
      const userRole = req.role as string;
      const result = await this.deleteAccountService.getDeleteRequest(
        phoneNumber,
        userRole
      );
      res.send({
        message: 'Deletion Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getRestoreRequest = async (req: any, res: Response) => {
    Logger.info(
      '<Controller>:<DeleteAccountController>:<Request Restore Account controller initiated>'
    );
    try {
      const phoneNumber = req.userId as string;
      const userRole = req.role as string;
      const result = await this.deleteAccountService.getRestoreRequest(
        phoneNumber,
        userRole
      );
      res.send({
        message: 'Restore Delete Request Successful',
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
      case 'createRequest':
        return [body('feedback', 'Feedback does not exist').exists().isArray()];
    }
  };
}
