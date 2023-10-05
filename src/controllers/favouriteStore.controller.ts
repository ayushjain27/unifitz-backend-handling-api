import { Response } from 'express';
import Request from '../types/request';
import { body, validationResult, query } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { FavouriteStoreService } from './../services/favouriteStore.service';
import { AddToFavouriteRequest } from './../interfaces/addToFavouriteRequest.interface';
import { AllFavStoreRequest } from '../interfaces/allFavStoreRequest.interface';
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

  removeFromFavourite = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    const favId = req.query.id as string;
    // const addToFavouriteRequest: AddToFavouriteRequest = {
    //   customerId,
    //   storeId
    // };
    Logger.info(
      '<Controller>:<FavouriteStoreController>:<Remove from favourite request initiated>'
    );
    try {
      const result = await this.favouriteStoreService.removeFromFavourite(
        favId
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  checkFavStore = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    const favStoreRequest: AddToFavouriteRequest = req.body;
    // const addToFavouriteRequest: AddToFavouriteRequest = {
    //   customerId,
    //   storeId
    // };
    Logger.info(
      '<Controller>:<FavouriteStoreController>:<Check if favourite store request initiated>'
    );
    try {
      const result = await this.favouriteStoreService.checkFavStore(
        favStoreRequest
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllFavStore = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    const allFavStoreReq: AllFavStoreRequest = req.body;
    // const addToFavouriteRequest: AddToFavouriteRequest = {
    //   customerId,
    //   storeId
    // };
    Logger.info(
      '<Controller>:<FavouriteStoreController>:<Get all favourite store paginated request initiated>'
    );
    try {
      const result = await this.favouriteStoreService.getAllFavStore(
        allFavStoreReq
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

      case 'removeFromFavourite':
        return [query('id', 'Fav Id does not exist').exists().isString()];
      case 'getAllFavStore':
        return [
          body('customerId', 'Customer Id does not exist').exists().isString(),
          body('pageSize', 'Page Size does not exist').exists().isNumeric(),
          body('pageNo', 'Page Number does not exist').exists().isNumeric()
        ];
    }
  };
}
