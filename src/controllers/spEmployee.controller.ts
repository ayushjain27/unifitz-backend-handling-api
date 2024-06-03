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

}
