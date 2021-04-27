import { Response } from 'express';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { StoreService } from '../services/store.service';
import Logger from '../config/winston';
import { IStore } from '../models/Store';
import Request from '../types/request';
import { TYPES } from '../config/inversify.types';

@injectable()
export class StoreController{
  private storeService: StoreService
  constructor(@inject(TYPES.StoreService) storeService: StoreService){
    this.storeService = storeService;
  }
  createStore = async (req: Request, res: Response) => {
    const storeDetails: IStore = req.body;
    Logger.info('<Controller>:<StoreController>:<Onboarding request controller initiated>');
    try{
    const result = await this.storeService.create(storeDetails);
    res.send({
      message: 'Store Onboarding Successful',
      result
    });
  } catch (err) {
    Logger.error(err.message);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send('Server Error');
  }
  };
}


