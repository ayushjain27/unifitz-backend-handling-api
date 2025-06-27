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

  createStudioInfo = async (req: any, res: Response) => {
    Logger.info(
      '<Controller>:<DeleteAccountController>:<Request Delete Account controller initiated>'
    );
    try {
      const request  = req.body;
      const result = await this.deleteAccountService.createStudioIndo(request);
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
}
