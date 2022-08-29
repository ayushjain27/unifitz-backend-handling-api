import { AllFavStoreRequest } from './../interfaces/allFavStoreRequest.interface';
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

    const currentFavStore: IFavouriteStore = await FavouriteStore.findOne({
      storeId: favStore.storeId,
      customerId: new Types.ObjectId(favStore.customerId)
    }).lean();

    if (!_.isEmpty(currentFavStore)) {
      const res = await FavouriteStore.findOneAndUpdate(
        { _id: currentFavStore._id },
        {
          $set: { isFavourite: true }
        },
        { returnDocument: 'after' }
      );
      return res;
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

  async removeFromFavourite(favId: string) {
    Logger.info(
      '<Service>:<FavouriteStoreService>: <Removing items favourite intiiated>'
    );

    const res = await FavouriteStore.findOneAndUpdate(
      { _id: new Types.ObjectId(favId) },
      {
        $set: { isFavourite: false }
      },
      { returnDocument: 'after' }
    );
    return res;
  }

  async checkFavStore(favStore: AddToFavouriteRequest) {
    const favStoreDb = await FavouriteStore.findOne({
      storeId: favStore.storeId,
      customerId: new Types.ObjectId(favStore.customerId)
    }).lean();
    if (_.isEmpty(favStoreDb)) {
      return false;
    } else {
      return favStoreDb.isFavourite;
    }
  }

  async getAllFavStore(allFavReq: AllFavStoreRequest) {
    const { pageSize, pageNo, customerId } = allFavReq;
    const allFavStore: IFavouriteStore[] = await FavouriteStore.aggregate([
      {
        $match: { customerId: new Types.ObjectId(customerId) }
      },
      {
        $lookup: {
          from: 'stores',
          localField: 'storeId',
          foreignField: 'storeId',
          as: 'storeInfo'
        }
      },
      { $unwind: { path: '$storeInfo' } }
    ])
      .limit(pageSize)
      .skip(pageNo * pageSize);
    // const allFavStore: IFavouriteStore = await FavouriteStore.find({
    //   customerId: new Types.ObjectId(customerId)
    // })
    //   .limit(pageSize)
    //   .skip(pageNo * pageSize)
    //   .lean();
    return allFavStore;
  }
}
