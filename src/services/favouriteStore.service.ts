import { AllFavStoreRequest } from './../interfaces/allFavStoreRequest.interface';
import { Types } from 'mongoose';
import { injectable } from 'inversify';
import _ from 'lodash';
import Logger from '../config/winston';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';
import FavouriteStore, { IFavouriteStore } from '../models/FavouriteStore';
import Store, { IStore } from './../models/Store';
import { AddToFavouriteRequest } from '../interfaces/addToFavouriteRequest.interface';
import { StoreService } from './store.service';
import Customer, { ICustomer } from '../models/Customer';

@injectable()
export class FavouriteStoreService {
  private storeService = container.get<StoreService>(TYPES.StoreService);

  async addToFavourite(favStore: AddToFavouriteRequest) {
    Logger.info(
      '<Service>:<FavouriteStoreService>: <Adding to favourite intiiated>'
    );
    const { customerId, storeId } = favStore;

    // Check if store exists
    const store: IStore = await Store.findOne(
      { storeId },
      { verificationDetails: 0 }
    );

    if (_.isEmpty(store)) {
      throw new Error('Store not found');
    }

    // Check if Customer exists
    const customer: ICustomer = await Customer.findOne({
      customerId: customerId
    });
    if (_.isEmpty(customer)) {
      throw new Error('Customer not found');
    }

    const currentFavStore: IFavouriteStore = await FavouriteStore.findOne({
      storeId: storeId,
      customerId: customerId
    });

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
      customerId: customerId,
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

    const res = await FavouriteStore.deleteMany({
      _id: new Types.ObjectId(favId)
    });
    return res;
  }

  async checkFavStore(favStore: AddToFavouriteRequest) {
    const favStoreDb = await FavouriteStore.findOne({
      storeId: favStore.storeId,
      customerId: favStore.customerId
    });
    if (_.isEmpty(favStoreDb)) {
      return { isFavourite: false, favouriteId: null };
    } else {
      return {
        isFavourite: favStoreDb.isFavourite,
        favouriteId: favStoreDb?._id
      };
    }
  }

  async getAllFavStore(allFavReq: AllFavStoreRequest) {
    const { pageSize, pageNo, customerId } = allFavReq;
    let allFavStore: any = await FavouriteStore.aggregate([
      {
        $match: { customerId: customerId }
      },
      {
        $lookup: {
          from: 'stores',
          localField: 'storeId',
          foreignField: 'storeId',
          as: 'storeInfo'
        }
      },
      { $unwind: { path: '$storeInfo' } },
      { $project: { 'storeInfo.verificationDetails.verifyObj': 0 } },

      { $skip: Number(pageNo * pageSize) },
      { $limit: pageSize }
    ]);

    if (allFavStore && Array.isArray(allFavStore)) {
      allFavStore = await Promise.all(
        allFavStore.map(async (store) => {
          const updatedStore = { ...store };
          updatedStore.overAllRating =
            await this.storeService.getOverallRatings(updatedStore.storeId);
          return updatedStore;
        })
      );
    }

    // const allFavStore: IFavouriteStore = await FavouriteStore.find({
    //   customerId: new Types.ObjectId(customerId)
    // })
    //   .limit(pageSize)
    //   .skip(pageNo * pageSize)
    //   ;
    return allFavStore;
  }
}
