import { Response } from 'express';
import Request from '../types/request';
import { body, validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { FavouriteStoreService } from './../services/favouriteStore.service';
import { AddToFavouriteRequest } from './../interfaces/addToFavouriteRequest.interface';

@injectable()
export class FavouriteStoreController {
  private favouriteStoreService: FavouriteStoreService;
  constructor(
    @inject(TYPES.FavouriteStoreService)
    favouriteStoreService: FavouriteStoreService
  ) {
    this.favouriteStoreService = favouriteStoreService;
  }

  addToFavourite = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    const addToFavouriteRequest: AddToFavouriteRequest = req.body;
    // const addToFavouriteRequest: AddToFavouriteRequest = {
    //   customerId,
    //   storeId
    // };
    Logger.info(
      '<Controller>:<FavouriteStoreController>:<Add to favourite request initiated>'
    );
    try {
      const result = await this.favouriteStoreService.addToFavourite(
        addToFavouriteRequest
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  validate = (method: string) => {
    switch (method) {
      case 'addToFavourite':
        return [
          body('customerId', 'Customer Id does not exist').exists().isString(),

          body('storeId', 'Description does not existzz').exists().isString()
        ];
    }
  };
}
