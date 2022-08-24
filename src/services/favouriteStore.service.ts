import { Types } from 'mongoose';
import { injectable } from 'inversify';
import _ from 'lodash';
import Logger from '../config/winston';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';
import FavouriteStore, { IFavouriteStore } from '../models/FavouriteStore';
import Store, { IStore } from './../models/Store';
import Customer, { ICustomer } from './../models/Customer';
import { AddToFavouriteRequest } from '../interfaces/addToFavouriteRequest.interface';

@injectable()
export class FavouriteStoreService {
  async addToFavourite(favStore: AddToFavouriteRequest) {
    Logger.info(
      '<Service>:<FavouriteStoreService>: <Adding to favourite intiiated>'
    );
    const { customerId, storeId } = favStore;

    // Check if store exists
    const store: IStore = await Store.findOne({ storeId }).lean();

    if (_.isEmpty(store)) {
      throw new Error('Store not found');
    }

    // Check if Customer exists
    const customer: ICustomer = await Customer.findOne({
      _id: new Types.ObjectId(customerId)
    }).lean();
    if (_.isEmpty(customer)) {
      throw new Error('Customer not found');
    }

    const newFavStore = {
      customerId: new Types.ObjectId(customerId),
      storeId,
      isFavourite: true
    };

    // Add the request to favourite collections
    const newFavItem: IFavouriteStore = await FavouriteStore.create(
      newFavStore
    );
    return newFavItem;
  }
}
