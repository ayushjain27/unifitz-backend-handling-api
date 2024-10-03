import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { DeleteAccountService } from './../services/deleteAccount.service';

@injectable()
export class DeleteAccountController {
  private deleteAccountService: DeleteAccountService;
  constructor(@inject(TYPES.DeleteAccountService) deleteAccountService: DeleteAccountService) {
    this.deleteAccountService = deleteAccountService;
  }
}
