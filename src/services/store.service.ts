import { ICatalogMap, StoreProfileStatus } from './../models/Store';
import { AdminRole } from './../models/Admin';

import { injectable } from 'inversify';
import { Types } from 'mongoose';
import _ from 'lodash';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import {
  OverallStoreRatingResponse,
  StoreRequest,
  StoreResponse,
  StoreReviewRequest,
  VerifyBusinessRequest
} from '../interfaces';
import Store, { IDocuments, IStore } from '../models/Store';
import StoreReview from '../models/Store-Review';
import User, { IUser } from '../models/User';
import DeviceFcm, { IDeviceFcm } from '../models/DeviceFcm';
import Request from '../types/request';
import { S3Service } from './s3.service';
import { NotificationService } from './notification.service';
import { DocType } from '../enum/docType.enum';
import { SurepassService } from './surepass.service';

@injectable()
export class StoreService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private notificationService = container.get<NotificationService>(
    TYPES.NotificationService
  );
  private surepassService = container.get<SurepassService>(
    TYPES.SurepassService
  );

  async create(
    storeRequest: StoreRequest,
    userName?: string,
    role?: string
  ): Promise<IStore> {
    const { storePayload, phoneNumber } = storeRequest;
    Logger.info('<Service>:<StoreService>:<Onboarding service initiated>');
    let ownerDetails: IUser = await User.findOne({
      phoneNumber,
      role
    });

    if (_.isEmpty(ownerDetails)) {
      ownerDetails = await User.findOne({
        phoneNumber
      });
    }
    if (_.isEmpty(ownerDetails)) {
      throw new Error('User not found');
    }

    storePayload.userId = ownerDetails._id;

    const lastCreatedStoreId = await Store.find({})
      .sort({ createdAt: 'desc' })
      .select('storeId')
      .limit(1)
      .exec();

    const storeId: number = !lastCreatedStoreId[0]
      ? new Date().getFullYear() * 100
      : +lastCreatedStoreId[0].storeId + 1;
    Logger.info(
      '<Route>:<StoreService>: <Store onboarding: creating new store>'
    );
    storePayload.storeId = '' + storeId;
    storePayload.profileStatus = StoreProfileStatus.DRAFT;
    if (role === AdminRole.OEM) {
      storePayload.oemUserName = userName;
    }
    // const newStore = new Store(storePayload);
    const newStore = await Store.create(storePayload);
    Logger.info(
      '<Service>:<StoreService>: <Store onboarding: created new store successfully>'
    );
    return newStore;
  }
  async update(
    storeRequest: StoreRequest,
    userName?: string,
    role?: string
  ): Promise<IStore> {
    Logger.info('<Service>:<StoreService>:<Update store service initiated>');
    const { storePayload } = storeRequest;

    Logger.info('<Service>:<StoreService>: <Store: updating new store>');
    storePayload.profileStatus = StoreProfileStatus.DRAFT;
    const query: any = {};
    query.storeId = storePayload.storeId;
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }
    const updatedStore = await Store.findOneAndUpdate(query, storePayload, {
      returnDocument: 'after'
    });
    Logger.info('<Service>:<StoreService>: <Store: update store successfully>');
    return updatedStore;
  }

  async updateStoreImages(storeId: string, req: Request | any): Promise<any> {
    Logger.info('<Service>:<StoreService>:<Upload Vehicles initiated>');
    const store = await Store.findOne({ storeId });
    if (_.isEmpty(store)) {
      throw new Error('Store does not exist');
    }

    const files: Array<any> = req.files;
    const documents: Partial<IDocuments> | any = store.documents || {
      profile: {},
      storeImageList: {}
    };
    if (!files) {
      throw new Error('Files not found');
    }
    for (const file of files) {
      const fileName: 'first' | 'second' | 'third' | 'profile' =
        file.originalname?.split('.')[0];
      const { key, url } = await this.s3Client.uploadFile(
        storeId,
        fileName,
        file.buffer
      );
      if (fileName === 'profile') {
        documents.profile = { key, docURL: url };
      } else {
        documents.storeImageList[fileName] = { key, docURL: url };
      }
    }
    const res = await Store.findOneAndUpdate(
      { storeId: storeId },
      { $set: { documents } },
      { returnDocument: 'after' }
    );
    return res;
  }

  async updateStoreStatus(
    statusRequest: any,
    userName?: string,
    role?: string
  ): Promise<IStore> {
    Logger.info('<Service>:<StoreService>:<Update store status>');
    const query: any = {};
    query.storeId = statusRequest.storeId;
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }
    await Store.findOneAndUpdate(query, {
      $set: {
        profileStatus: statusRequest.profileStatus,
        rejectionReason: statusRequest.rejectionReason
      }
    });
    Logger.info(
      '<Service>:<StoreService>: <Store: store status updated successfully>'
    );
    const updatedStore = await Store.findOne({
      storeId: statusRequest.storeId
    });
    return updatedStore;
  }

  async sendNotificationToStore(store: IStore) {
    Logger.info(
      '<Service>:<StoreService>:<Sending notification to store owner>'
    );
    // const ownerDetails: IUser = await User.findOne({
    //   _id: store.userId
    // }).lean();
    // if (ownerDetails) {
    //   const deviceFcmDetails: IDeviceFcm = await DeviceFcm.findOne({
    //     deviceId: ownerDetails.deviceId
    //   }).lean();
    // }
    const deviceFcmRecord = await User.aggregate([
      { $match: { _id: store.userId } },
      {
        $lookup: {
          from: 'device_fcms',
          let: { deviceId: '$deviceId', role: 'STORE_OWNER' },
          // localField: 'deviceId',
          // foreignField: 'deviceId',
          pipeline: [
            {
              $match: {
                role: 'STORE_OWNER',
                $expr: { $eq: ['$deviceId', '$$deviceId'] }
              }
            }
          ],
          as: 'deviceFcm'
        }
      },
      {
        $unwind: '$deviceFcm'
      }
    ]);
    Logger.info(JSON.stringify(deviceFcmRecord));
    if (Array.isArray(deviceFcmRecord) && deviceFcmRecord.length > 0) {
      const selectedUserRecord = deviceFcmRecord[0];
      const fcmToken: string = selectedUserRecord.deviceFcm.fcmToken;
      const title =
        store.profileStatus === 'ONBOARDED'
          ? 'Congratulations! You are Onboarded successfully.'
          : 'Sorry, you have been Rejected';
      const body =
        store.profileStatus === 'ONBOARDED'
          ? 'Party hard. Use Service plug to checkout more features'
          : store.rejectionReason;
      const notificationParams = {
        fcmToken,
        payload: {
          notification: {
            title,
            body
          }
        }
      };
      return await this.notificationService.sendNotification(
        notificationParams
      );
    }
    return null;
  }

  async getById(
    storeId: string,
    userName?: string,
    role?: string
  ): Promise<StoreResponse[]> {
    Logger.info(
      '<Service>:<StoreService>:<Get stores by Id service initiated>'
    );
    const query: any = {};
    query.storeId = storeId;
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }
    const storeResponse: StoreResponse[] = await Store.find(query);
    return storeResponse;
  }

  async deleteStore(
    storeId: string,
    userName?: string,
    role?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<StoreService>:<Delete stores by Id service initiated>'
    );
    const query: any = {};
    query.storeId = storeId;
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }
    const res = await Store.findOneAndDelete(query);
    return res;
  }
  async getAll(userName?: string, role?: string) {
    Logger.info('<Service>:<StoreService>:<Get all stores service initiated>');
    const query: any = {};
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }
    const stores: StoreResponse[] = await Store.find(query).lean();

    //STARTS --- Update Script for all the stores
    // const bulkWrite = [];
    // for (const store of stores) {
    //   const coords = store?.contactInfo?.geoLocation?.coordinates;
    //   if (
    //     !_.isEmpty(coords) &&
    //     !_.isNaN(Number(coords[0])) &&
    //     !_.isNaN(Number(coords[1]))
    //   ) {
    //     const updatedCoords = [Number(coords[1]), Number(coords[0])];
    //     bulkWrite.push({
    //       updateOne: {
    //         filter: { _id: store._id },
    //         update: {
    //           $set: {
    //             'contactInfo.geoLocation.coordinates': updatedCoords
    //             // 'contactInfo.geoLocation.coords': coords
    //           }
    //           // $unset: { 'contactInfo.geoLocation.coords': 1 }
    //         }
    //       }
    //     });
    //   }
    // }
    // if (bulkWrite.length > 0) {
    //   await Store.bulkWrite(bulkWrite);
    // }
    //ENDS --- Update Script for all the stores

    // STARTS -- Update script for all the stores category, sub category and brand to array

    // const bulkWrite = [];
    // for (const store of stores) {
    //   if (typeof store?.basicInfo?.category === 'object') {
    //     store.basicInfo.category = Array(
    //       store.basicInfo.category
    //     ) as unknown as ICatalogMap[];
    //   }

    //   if (typeof store?.basicInfo?.subCategory === 'object') {
    //     store.basicInfo.subCategory = Array(
    //       store.basicInfo.subCategory
    //     ) as unknown as ICatalogMap[];
    //   }

    //   if (typeof store?.basicInfo?.brand === 'object') {
    //     store.basicInfo.brand = Array(
    //       store.basicInfo.brand
    //     ) as unknown as ICatalogMap[];
    //   }
    //   bulkWrite.push({
    //     updateOne: {
    //       filter: { _id: store._id },
    //       update: store
    //     }
    //   });
    // }
    // if (bulkWrite.length > 0) {
    //   await Store.bulkWrite(bulkWrite);
    // }

    // //ENDS --- Update Script for all the stores

    return stores;
  }

  async searchAndFilter(
    storeName: string,
    category: string,
    subCategory: string[],
    brand: string
  ): Promise<StoreResponse[]> {
    Logger.info(
      '<Service>:<StoreService>:<Search and Filter stores service initiated>'
    );
    const query = {
      'basicInfo.businessName': new RegExp(storeName, 'i'),
      'basicInfo.brand.name': brand,
      'basicInfo.category.name': category,
      'basicInfo.subCategory.name': { $in: subCategory },
      profileStatus: 'ONBOARDED'
    };
    if (!brand) {
      delete query['basicInfo.brand.name'];
    }
    if (!category) {
      delete query['basicInfo.category.name'];
    }
    if (!subCategory || subCategory.length === 0) {
      delete query['basicInfo.subCategory.name'];
    }
    if (!storeName) {
      delete query['basicInfo.businessName'];
    }
    Logger.debug(query);
    let stores: any = await Store.find(query).lean();
    if (stores && Array.isArray(stores)) {
      stores = await Promise.all(
        stores.map(async (store) => {
          const updatedStore = { ...store };
          updatedStore.overAllRating = await this.getOverallRatings(
            updatedStore.storeId
          );
          return updatedStore;
        })
      );
    }
    return stores;
  }

  async searchAndFilterPaginated(searchReqBody: {
    storeName: string;
    brand: string;
    subCategory: string[];
    category: string;
    pageNo: number;
    pageSize: number;
    coordinates: number[];
  }): Promise<StoreResponse[]> {
    Logger.info(
      '<Service>:<StoreService>:<Search and Filter stores service initiated>'
    );
    const query = {
      // 'contactInfo.geoLocation': {
      //   $near: {
      //     $geometry: { type: 'Point', coordinates: searchReqBody.coordinates }
      //   }
      // },
      'basicInfo.businessName': new RegExp(searchReqBody.storeName, 'i'),
      'basicInfo.brand.name': searchReqBody.brand,
      'basicInfo.category.name': searchReqBody.category,
      'basicInfo.subCategory.name': { $in: searchReqBody.subCategory },
      profileStatus: 'ONBOARDED'
    };
    if (!searchReqBody.brand) {
      delete query['basicInfo.brand.name'];
    }
    if (!searchReqBody.category) {
      delete query['basicInfo.category.name'];
    }
    if (!searchReqBody.subCategory || searchReqBody.subCategory.length === 0) {
      delete query['basicInfo.subCategory.name'];
    }
    if (!searchReqBody.storeName) {
      delete query['basicInfo.businessName'];
    }
    Logger.debug(query);

    let stores: any = await Store.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: searchReqBody.coordinates as [number, number]
          },
          // key: 'contactInfo.geoLocation',
          spherical: true,
          query: query,
          distanceField: 'contactInfo.distance',
          distanceMultiplier: 0.001
        }
      },
      {
        $skip: searchReqBody.pageNo * searchReqBody.pageSize
      },
      {
        $limit: searchReqBody.pageSize
      }
    ]);

    if (stores && Array.isArray(stores)) {
      stores = await Promise.all(
        stores.map(async (store) => {
          const updatedStore = { ...store };
          updatedStore.overAllRating = await this.getOverallRatings(
            updatedStore.storeId
          );
          return updatedStore;
        })
      );
    }
    return stores;
  }

  async getByOwner(userId: string): Promise<StoreResponse[]> {
    Logger.info(
      '<Service>:<StoreService>:<Get stores by owner service initiated>'
    );
    const objId = new Types.ObjectId(userId);
    const stores = await Store.find({ userId: objId });
    return stores;
  }

  async addReview(
    storeReview: StoreReviewRequest
  ): Promise<StoreReviewRequest> {
    Logger.info('<Service>:<StoreService>:<Add Store Ratings initiate>');
    const newStoreReview = new StoreReview(storeReview);
    await newStoreReview.save();
    Logger.info('<Service>:<StoreService>:<Store Ratings added successfully>');
    return newStoreReview;
  }

  async getOverallRatings(
    storeId: string
  ): Promise<OverallStoreRatingResponse> {
    Logger.info('<Service>:<StoreService>:<Get Overall Ratings initiate>');
    const storeReviews = await StoreReview.find({ storeId });
    if (storeReviews.length === 0) {
      return {
        allRatings: {
          5: 100
        },
        averageRating: 5,
        totalRatings: 1,
        totalReviews: 1
      };
    }
    let ratingsCount = 0;
    let totalRatings = 0;
    let totalReviews = 0;
    const allRatings: { [key: number]: number } = {};

    storeReviews.forEach(({ rating, review }) => {
      if (rating) totalRatings++;
      if (review) totalReviews++;
      ratingsCount = ratingsCount + rating;
      if (!allRatings[rating]) {
        allRatings[rating] = 1;
      } else {
        allRatings[rating]++;
      }
    });

    for (const key in allRatings) {
      allRatings[key] = Math.trunc(
        (allRatings[key] * 100) / storeReviews.length
      );
    }

    const averageRating = Number(
      ratingsCount / storeReviews.length
    ).toPrecision(2);
    Logger.info(
      '<Service>:<StoreService>:<Get Overall Ratings performed successfully>'
    );
    return {
      allRatings,
      averageRating,
      totalRatings,
      totalReviews
    };
  }
  /* eslint-disable */
  async getReviews(
    storeId: string,
    pageNo?: number,
    pageSize?: number
  ): Promise<any[]> {
    Logger.info('<Service>:<StoreService>:<Get Store Ratings initiate>');
    const storeReviews = await StoreReview.find({ storeId })
      .skip(pageNo * pageSize)
      .limit(pageSize)
      .lean();
    Logger.info(
      '<Service>:<StoreService>:<Get Ratings performed successfully>'
    );
    if (storeReviews.length === 0 && !pageNo) {
      return [
        {
          user: {
            name: 'Service Plug',
            profilePhoto: ''
          },
          storeId,
          rating: 5,
          review:
            'Thank you for onboarding with us. May you have a wonderful experience.'
        }
      ];
    } else {
      return storeReviews;
    }
  }

  async initiateBusinessVerification(
    payload: VerifyBusinessRequest,
    phoneNumber: string,
    role?: string
  ) {
    Logger.info('<Service>:<StoreService>:<Initiate Verifying user business>');
    // validate the store from user phone number and user id
    let verifyResult: any = {};

    try {
      // get the store data
      const storeDetails = await Store.findOne({
        storeId: payload.storeId
      }).lean();
      const userDetails = await User.findOne({ phoneNumber, role }).lean();
      if (_.isEmpty(storeDetails)) {
        throw new Error('Store does not exist');
      }

      if (_.isEmpty(userDetails)) {
        throw new Error('User does not exist');
      }

      // Check if role is store owner and user id matches with store user id
      if (
        role === 'STORE_OWNER' &&
        String(storeDetails?.userId) !== String(userDetails._id)
      ) {
        throw new Error('Invalid and unauthenticated request');
      }

      // integrate surephass api based on doc type
      switch (payload.documentType) {
        case DocType.GST:
          verifyResult = await this.surepassService.getGstDetails(
            payload.documentNo
          );
          break;
        case DocType.UDHYAM:
          verifyResult = await this.surepassService.getUdhyamDetails(
            payload.documentNo
          );
          break;
        case DocType.AADHAR:
          break;
      }
      return verifyResult;
    } catch (err) {
      throw new Error(err);
    }
  }
}
