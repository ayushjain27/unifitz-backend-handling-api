/* eslint-disable prefer-const */
/* eslint-disable no-console */
import { ICatalogMap, StoreProfileStatus } from './../models/Store';
import { AdminRole } from './../models/Admin';

import { injectable } from 'inversify';
import { Types } from 'mongoose';
import _, { isEmpty } from 'lodash';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import {
  ApproveBusinessVerifyRequest,
  OverallStoreRatingResponse,
  StoreRequest,
  StoreResponse,
  StoreReviewRequest,
  VerifyAadharRequest,
  VerifyBusinessRequest
} from '../interfaces';
import Store, { IDocuments, IStore } from '../models/Store';
import StoreHistory from '../models/StoreHistory';
import StoreReview, { IStoreReview } from '../models/Store-Review';
import User, { IUser } from '../models/User';
import DeviceFcm, { IDeviceFcm } from '../models/DeviceFcm';
import Request from '../types/request';
import { S3Service } from './s3.service';
import { NotificationService } from './notification.service';
import { DocType } from '../enum/docType.enum';
import { SurepassService } from './surepass.service';
import Customer, { ICustomer } from './../models/Customer';
import { StaticIds } from './../models/StaticId';
import slugify from 'slugify';
import { SPEmployeeService } from './spEmployee.service';
import { SQSService } from './sqs.service';
import { SQSEvent } from '../enum/sqsEvent.enum';

@injectable()
export class StoreService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private notificationService = container.get<NotificationService>(
    TYPES.NotificationService
  );
  private surepassService = container.get<SurepassService>(
    TYPES.SurepassService
  );
  private spEmployeeService = container.get<SPEmployeeService>(
    TYPES.SPEmployeeService
  );
  private sqsService = container.get<SQSService>(TYPES.SQSService);

  async create(
    storeRequest: StoreRequest,
    userName?: string,
    role?: string,
    oemId?: string,
    storeStatus?: string
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

    const lastCreatedStoreId = await StaticIds.find({}).limit(1).exec();

    const newStoreId = String(parseInt(lastCreatedStoreId[0].storeId) + 1);

    await StaticIds.findOneAndUpdate({}, { storeId: newStoreId });

    //   ? new Date().getFullYear() * 100
    //   : +lastCreatedStoreId[0].storeId + 1;
    Logger.info(
      '<Route>:<StoreService>: <Store onboarding: creating new store>'
    );

    storePayload.storeId = newStoreId;
    storePayload.profileStatus = storeStatus;
    const businessName = storeRequest.storePayload.basicInfo.businessName;
    const baseSlug = slugify(businessName, { lower: true, strict: true });
    console.log(baseSlug, 'dsklk');

    const slug = `${baseSlug}-${newStoreId}`;
    storePayload.slug = slug;

    if (role === AdminRole.OEM) {
      storePayload.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      storePayload.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete storePayload['oemUserName'];
    }
    // const newStore = new Store(storePayload);
    let newStore;
    try {
      newStore = await Store.create(storePayload);
    } catch (err) {
      throw new Error(err);
    }
    // await sendNotification(
    //   'Store Created',
    //   'Your store has created. It is under review',
    //   phoneNumber,
    //   'STORE_OWNER',
    //   ''
    // );
    const data = {
      title: 'Store Created',
      body: `Your store is created. It is under review`,
      phoneNumber: phoneNumber,
      role: 'STORE_OWNER',
      type: 'NEW_STORE'
    };
    const sqsMessage = await this.sqsService.createMessage(
      SQSEvent.NOTIFICATION,
      data
    );

    const notificationData = {
      title: 'Store Created',
      body: `Your store is created. It is under review`,
      phoneNumber: phoneNumber,
      type: 'NEW_STORE',
      role: 'STORE_OWNER',
      storeId: newStoreId
    };

    let notification =
      await this.notificationService.createNotification(notificationData);
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
    // storePayload.profileStatus = StoreProfileStatus.DRAFT;
    const query: any = {};
    query.storeId = storePayload.storeId;
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }
    if (storePayload.profileStatus === StoreProfileStatus.ONBOARDED) {
      storePayload.profileStatus = StoreProfileStatus.PENDING;
    }
    const updatedStore = await Store.findOneAndUpdate(query, storePayload, {
      returnDocument: 'after',
      projection: { 'verificationDetails.verifyObj': 0 }
    });
    // await sendNotification(
    //   'Store Updated',
    //   'Your store has updated. It is under review',
    //   storePayload?.contactInfo?.phoneNumber?.primary,
    //   'STORE_OWNER',
    //   ''
    // );
    const data = {
      title: 'Store Updated',
      body: `Your store is updated. It is under review`,
      phoneNumber: storePayload?.contactInfo?.phoneNumber?.primary,
      role: 'STORE_OWNER',
      type: 'UPDATED_STORE'
    };
    const sqsMessage = await this.sqsService.createMessage(
      SQSEvent.NOTIFICATION,
      data
    );

    const notificationData = {
      title: 'Store Updated',
      body: `Your store is updated. It is under review`,
      phoneNumber: storePayload?.contactInfo?.phoneNumber?.primary,
      type: 'NEW_STORE',
      role: 'STORE_OWNER',
      storeId: storePayload?.storeId
    };

    let notification =
      await this.notificationService.createNotification(notificationData);

    Logger.info('<Service>:<StoreService>: <Store: update store successfully>');
    return updatedStore;
  }

  async updateStoreImages(storeId: string, req: Request | any): Promise<any> {
    Logger.info('<Service>:<StoreService>:<Upload Vehicles initiated>');
    const store = await Store.findOne({ storeId }, { verificationDetails: 0 });
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
      {
        returnDocument: 'after',
        projection: { 'verificationDetails.verifyObj': 0 }
      }
    );
    return res;
  }

  async updateStoreStatus(
    statusRequest: any,
    userName?: string,
    role?: string
  ): Promise<IStore> {
    Logger.info('<Service>:<StoreService>:<Update store status>');
    console.log(userName, role, 'dfwl;k');
    const query: any = {};
    query.storeId = statusRequest.storeId;
    let store: IStore;
    store = await Store.findOne(
      { storeId: statusRequest?.storeId },
      { verificationDetails: 0 }
    );
    const phoneNumber =
      store?.basicInfo?.userPhoneNumber ||
      store?.contactInfo?.phoneNumber?.primary;
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
    const updatedStore = await Store.findOne(
      {
        storeId: statusRequest.storeId
      },
      { 'verificationDetails.verifyObj': 0 }
    );
    // await sendNotification(
    //   `${
    //     statusRequest.profileStatus === 'ONBOARDED'
    //       ? 'Store Onboarded'
    //       : 'Store Rejected'
    //   }`,
    //   `${
    //     statusRequest.profileStatus === 'ONBOARDED'
    //       ? 'Congratulations 😊'
    //       : 'Sorry 😞'
    //   } Your store has been ${
    //     statusRequest.profileStatus === 'ONBOARDED'
    //       ? 'onboarded'
    //       : `rejected due to this reason: ${statusRequest.rejectionReason}`
    //   }`,
    //   phoneNumber,
    //   'STORE_OWNER',
    //   ''
    // );
    const data = {
      title: `${
        statusRequest.profileStatus === 'ONBOARDED'
          ? 'Store Onboarded'
          : 'Store Rejected'
      }`,
      body: `${
        statusRequest.profileStatus === 'ONBOARDED'
          ? 'Congratulations 😊'
          : 'Sorry 😞'
      } Your store has been ${
        statusRequest.profileStatus === 'ONBOARDED'
          ? 'onboarded'
          : `rejected due to this reason: ${statusRequest.rejectionReason}`
      }`,
      phoneNumber: phoneNumber,
      role: 'STORE_OWNER',
      type: 'STORE_STATUS'
    };
    const sqsMessage = await this.sqsService.createMessage(
      SQSEvent.NOTIFICATION,
      data
    );
    const notificationData = {
      title: `${
        statusRequest.profileStatus === 'ONBOARDED'
          ? 'Store Onboarded'
          : 'Store Rejected'
      }`,
      body: `${
        statusRequest.profileStatus === 'ONBOARDED'
          ? 'Congratulations 😊'
          : 'Sorry 😞'
      } your store has been ${
        statusRequest.profileStatus === 'ONBOARDED'
          ? 'onboarded'
          : `rejected due to this reason: ${statusRequest.rejectionReason}`
      }`,
      phoneNumber: phoneNumber,
      type: 'STORE_STATUS',
      role: 'STORE_OWNER',
      storeId: statusRequest.storeId
    };

    let notification =
      await this.notificationService.createNotification(notificationData);
    return updatedStore;
  }

  async sendNotificationToStore(store: IStore) {
    Logger.info(
      '<Service>:<StoreService>:<Sending notification to store owner>'
    );
    // const ownerDetails: IUser = await User.findOne({
    //   _id: store.userId
    // });
    // if (ownerDetails) {
    //   const deviceFcmDetails: IDeviceFcm = await DeviceFcm.findOne({
    //     deviceId: ownerDetails.deviceId
    //   });
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
    req: { storeId: string; lat: string; long: string },
    userName?: string,
    role?: string
  ): Promise<StoreResponse[]> {
    Logger.info(
      '<Service>:<StoreService>:<Get stores by Id service initiated>'
    );
    const query: any = {};
    query.storeId = req.storeId;
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }
    let storeResponse: any;
    if (_.isEmpty(req.lat) && _.isEmpty(req.long)) {
      storeResponse = await Store.find(query, {
        'verificationDetails.verifyObj': 0
      });
    } else {
      storeResponse = Store.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [Number(req.long), Number(req.lat)] as [
                number,
                number
              ]
            },
            // key: 'contactInfo.geoLocation',
            spherical: true,
            query: query,
            distanceField: 'contactInfo.distance',
            distanceMultiplier: 0.001
          }
        }
      ]);
    }
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
  async getAll(
    userName?: string,
    role?: string,
    userType?: string,
    status?: string,
    verifiedStore?: string,
    oemId?: string
  ) {
    Logger.info('<Service>:<StoreService>:<Get all stores service initiated>');
    let query: any = {};
    let stores: any;
    const userRoleType = userType === 'OEM' ? true : false;

    query = {
      isVerified: Boolean(verifiedStore),
      profileStatus: status
    };
    if (role === AdminRole.ADMIN) {
      query.oemUserName = { $exists: userRoleType };
    }
    if (!userType) {
      delete query['oemUserName'];
    }

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }

    // query = {
    //   isVerified: Boolean(verifiedStore),
    //   profileStatus: status,
    //   oemUserName: userName
    // };
    // if (!userType) {
    //   delete query['oemUserName'];
    // }
    if (!verifiedStore) {
      delete query['isVerified'];
    }
    if (!status) {
      delete query['profileStatus'];
    }
    if (_.isEmpty(userType) && _.isEmpty(status) && _.isEmpty(verifiedStore)) {
      stores = await Store.find(query, {
        'verificationDetails.verifyObj': 0
      });
    }
    if (
      !_.isEmpty(userType) ||
      !_.isEmpty(status) ||
      !_.isEmpty(verifiedStore)
    ) {
      stores = await Store.aggregate([{ $match: query }]);
    }

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
    let stores: any = await Store.find(query, {
      'verificationDetails.verifyObj': 0
    });
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
    oemUserName: string;
    detailingType: string;
    serviceType: string;
  }): Promise<StoreResponse[]> {
    Logger.info(
      '<Service>:<StoreService>:<Search and Filter stores service initiated 111111>'
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
      oemUserName: searchReqBody.oemUserName,
      profileStatus: 'ONBOARDED',
      'basicInfo.detailingType': searchReqBody.detailingType,
      'basicInfo.serviceType': searchReqBody.serviceType
    };
    if (!searchReqBody.detailingType) {
      delete query['basicInfo.detailingType'];
    }
    if (!searchReqBody.serviceType) {
      delete query['basicInfo.serviceType'];
    }
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
    if (!searchReqBody.oemUserName) {
      delete query.oemUserName;
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
      },
      {
        $project: { 'verificationDetails.verifyObj': 0 }
      }
    ]);
    Logger.info(
      '<Service>:<StoreService>:<Search and Filter stores service 2222222222>'
    );
    if (stores && Array.isArray(stores)) {
      stores = await Promise.all(
        stores.map(async (store) => {
          const updatedStore = { ...store };
          Logger.info(
            '<Service>:<StoreService>:<Search and Filter stores service 3333333333333>'
          );
          updatedStore.overAllRating = await this.getOverallRatings(
            updatedStore.storeId
          );
          return updatedStore;
        })
      );
    }
    Logger.info(
      '<Service>:<StoreService>:<Search and Filter stores service 4444444444444>'
    );
    return stores;
  }

  async getByOwner(userId: string): Promise<StoreResponse[]> {
    Logger.info(
      '<Service>:<StoreService>:<Get stores by owner service initiated>'
    );
    const objId = new Types.ObjectId(userId);
    const stores = await Store.find(
      { userId: objId },
      { 'verificationDetails.verifyObj': 0 }
    );
    return stores;
  }

  async addReview(
    storeReview: StoreReviewRequest
  ): Promise<StoreReviewRequest> {
    Logger.info('<Service>:<StoreService>:<Add Store Ratings initiate>');
    let customer: ICustomer;
    if (storeReview?.userId) {
      customer = await Customer.findOne({
        _id: new Types.ObjectId(storeReview?.userId)
      });
    }
    console.log(customer, 'dfw;lmk');
    let store: IStore;
    store = await Store.findOne(
      { storeId: storeReview?.storeId },
      { verificationDetails: 0 }
    );
    const phoneNumber =
      store?.basicInfo?.userPhoneNumber ||
      store?.contactInfo?.phoneNumber?.primary;
    if (!storeReview?.userId) {
      throw new Error('Customer not found');
    }
    const newStoreReview = new StoreReview(storeReview);
    newStoreReview.userPhoneNumber = customer?.phoneNumber || '';
    await newStoreReview.save();
    // await sendNotification(
    //   'Store Review',
    //   'Store Review',
    //   phoneNumber,
    //   'STORE_OWNER',
    //   'RATING_REVIEW'
    // );
    const data = {
      title: 'Store Review',
      body: `Congratulations! You got na new review`,
      phoneNumber: phoneNumber,
      role: 'STORE_OWNER',
      type: 'RATING_REVIEW'
    };
    const sqsMessage = await this.sqsService.createMessage(
      SQSEvent.NOTIFICATION,
      data
    );
    const notificationData = {
      title: 'Store Review',
      body: `Congratulations! You got na new review`,
      phoneNumber: phoneNumber,
      type: 'RATING_REVIEW',
      role: 'STORE_OWNER',
      storeId: store?.storeId
    };

    let notification =
      await this.notificationService.createNotification(notificationData);

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
        averageRating: '-',
        totalRatings: 0,
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
      .sort({ createdAt: -1 })
      .skip(pageNo * pageSize)
      .limit(pageSize);
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
    const displayFields: any = {};

    try {
      // get the store data
      const storeDetails = await Store.findOne(
        {
          storeId: payload.storeId
        },
        { verificationDetails: 0 }
      );
      Logger.debug(`${phoneNumber} ${role} user resulttttttttt`);
      if (role !== 'ADMIN' && role !== 'OEM') {
        const userDetails = await User.findOne({ phoneNumber, role });
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
      }
      // integrate surephass api based on doc type
      switch (payload.documentType) {
        case DocType.GST:
          verifyResult = await this.surepassService.getGstDetails(
            payload.documentNo
          );
          displayFields.businessName = verifyResult?.business_name;
          displayFields.address = verifyResult?.address;
          break;
        case DocType.UDHYAM:
          verifyResult = await this.surepassService.getUdhyamDetails(
            payload.documentNo
          );
          const mainDetails = verifyResult?.main_details;
          displayFields.businessName = mainDetails?.name_of_enterprise;
          const add = `${mainDetails?.name_of_building} ${mainDetails?.flat} ${mainDetails?.block} ${mainDetails?.road} ${mainDetails?.village} ${mainDetails?.city} ${mainDetails?.dic_name} ${mainDetails?.state} ${mainDetails?.pin}`;
          displayFields.address = add;
          break;
        case DocType.AADHAR:
          verifyResult = await this.surepassService.sendOtpForAadharVerify(
            payload.documentNo
          );
          break;
        default:
          throw new Error('Invalid Document Type');
      }

      return { verifyResult, displayFields };
    } catch (err) {
      if (err.response) {
        return Promise.reject(err.response);
      }
      throw new Error(err);
    }
  }

  async approveBusinessVerification(
    payload: ApproveBusinessVerifyRequest,
    phoneNumber: string,
    role?: string
  ) {
    Logger.info('<Service>:<StoreService>:<Approve Verifying user business>');
    // validate the store from user phone number and user id

    try {
      const storeDetails = await Store.findOne(
        {
          storeId: payload.storeId
        },
        { verificationDetails: 0 }
      );

      if (role !== 'ADMIN' && role !== 'OEM') {
        const userDetails = await User.findOne({ phoneNumber, role });
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
      }
      const updatedStore = await this.updateStoreDetails(
        payload.verificationDetails,
        payload.documentType,
        payload.gstAdhaarNumber,
        storeDetails as IStore
      );

      const data = {
        title: 'Store Verified',
        body: `Your store is verified with ${payload.documentType}`,
        phoneNumber: phoneNumber,
        role: role,
        type: 'STORE_CREATED'
      };
      const sqsMessage = await this.sqsService.createMessage(
        SQSEvent.NOTIFICATION,
        data
      );
      const notificationData = {
        title: 'Store Verified',
        body: `Your store is verified with ${payload.documentType}`,
        phoneNumber: phoneNumber,
        type: 'STORE_CREATED',
        role: 'STORE_OWNER',
        storeId: storeDetails?.storeId
      };

      let notification =
        await this.notificationService.createNotification(notificationData);

      return updatedStore;
    } catch (err) {
      if (err.response) {
        return Promise.reject(err.response);
      }
      throw new Error(err);
    }
  }

  private async updateStoreDetails(
    verifyResult: any,
    documentType: string,
    gstAdhaarNumber: string,
    storeDetails: IStore
  ) {
    let isVerified = false;

    if (!_.isEmpty(verifyResult)) {
      // Business is verified
      isVerified = true;
    }
    // update the store
    const updatedStore = await Store.findOneAndUpdate(
      { _id: storeDetails._id },
      {
        $set: {
          isVerified,
          verificationDetails: {
            documentType,
            verifyName: verifyResult?.business_name || verifyResult?.full_name,
            verifyAddress:
              documentType === 'GST'
                ? String(verifyResult?.address)
                : String(
                    `${verifyResult?.address?.house} ${verifyResult?.address?.landmark} ${verifyResult?.address?.street} ${verifyResult?.address?.vtc} ${verifyResult?.address?.state} - ${verifyResult?.zip}`
                  ),
            verifyObj: verifyResult,
            gstAdhaarNumber
          }
        }
      },
      {
        returnDocument: 'after',
        projection: { 'verificationDetails.verifyObj': 0 }
      }
    );

    return updatedStore;
  }

  async verifyAadhar(
    payload: VerifyAadharRequest,
    phoneNumber: string,
    role?: string
  ) {
    Logger.info('<Service>:<StoreService>:<Initiate Verifying user business>');
    // validate the store from user phone number and user id
    let verifyResult: any = {};
    const gstAdhaarNumber = payload?.gstAdhaarNumber
      ? payload?.gstAdhaarNumber
      : '';

    try {
      // get the store data
      const storeDetails = await Store.findOne({
        storeId: payload.storeId
      });

      if (_.isEmpty(storeDetails)) {
        throw new Error('Store does not exist');
      }

      if (role !== 'ADMIN' && role !== 'OEM') {
        const userDetails = await User.findOne(
          { phoneNumber, role },
          { verificationDetails: 0 }
        );

        if (_.isEmpty(userDetails)) {
          throw new Error('User does not exist');
        }
      }

      const verifyResult = await this.surepassService.verifyOtpForAadharVerify(
        payload.clientId,
        payload.otp
      );

      const updatedStore = await this.updateStoreDetails(
        verifyResult,
        DocType.AADHAR,
        gstAdhaarNumber,
        storeDetails as IStore
      );

      const data = {
        title: 'Store Verified',
        body: `Your store is verified with Aadhar`,
        phoneNumber: phoneNumber,
        role: role,
        type: 'STORE_CREATED'
      };
      const sqsMessage = await this.sqsService.createMessage(
        SQSEvent.NOTIFICATION,
        data
      );
      const notificationData = {
        title: 'Store Verified',
        body: `Your store is verified with Aadhar`,
        phoneNumber: phoneNumber,
        type: 'STORE_CREATED',
        role: 'STORE_OWNER',
        storeId: storeDetails?.storeId
      };

      let notification =
        await this.notificationService.createNotification(notificationData);

      return updatedStore;
    } catch (err) {
      throw new Error(err);
    }
  }

  async getAllReviews(
    userName: string,
    role: string,
    oemId: string
  ): Promise<IStoreReview[]> {
    Logger.info('<Service>:<StoreService>:<Get all stores reviews>');
    let reviewResponse: any = [];
    console.log(userName, role, oemId);

    if (role === 'ADMIN' || oemId === 'SERVICEPLUG') {
      reviewResponse = await StoreReview.find({});
    } else {
      reviewResponse = await StoreReview.aggregate([
        {
          $lookup: {
            from: 'stores',
            localField: 'storeId',
            foreignField: 'storeId',
            as: 'storeInfo'
          }
        },
        { $unwind: { path: '$storeInfo' } },
        {
          $match: {
            $expr: {
              $and: [{ $eq: ['$storeInfo.oemUserName', userName] }]
            }
          }
        }
      ]);
    }
    return reviewResponse;
  }

  async updateStoreReviewStatus(
    statusRequest: any,
    reviewId: string
  ): Promise<StoreReviewRequest> {
    Logger.info('<Service>:<StoreService>:<Update store review status>');
    let review: StoreReviewRequest;
    if (reviewId) {
      review = await StoreReview.findOne({
        _id: new Types.ObjectId(reviewId)
      });
    }
    if (!review) {
      Logger.error(
        '<Service>:<updatedStoreReview>:<Review not found with that review Id>'
      );
    }
    Logger.info(
      '<Service>:<StoreService>: <Store: store review status updated successfully>'
    );

    let updatedReview: StoreReviewRequest = statusRequest;
    updatedReview = await StoreReview.findOneAndUpdate(
      { _id: new Types.ObjectId(reviewId) },
      updatedReview,
      { returnDocument: 'after' }
    );
    return updatedReview;
  }

  async createStoreFastestOnboarding(
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

    const { storeId } = storePayload;
    let store: IStore;
    if (storeId) {
      store = await Store.findOne({ storeId }, { verificationDetails: 0 });
    }

    storePayload.userId = ownerDetails._id;

    if (!store) {
      const lastCreatedStoreId = await StaticIds.find({}).limit(1).exec();

      const newStoreId = String(parseInt(lastCreatedStoreId[0].storeId) + 1);

      await StaticIds.findOneAndUpdate({}, { storeId: newStoreId });

      //   ? new Date().getFullYear() * 100
      //   : +lastCreatedStoreId[0].storeId + 1;
      Logger.info(
        '<Route>:<StoreService>: <Store onboarding: creating new store>'
      );

      storePayload.storeId = newStoreId;
      storePayload.profileStatus = StoreProfileStatus.DRAFT;
    }
    if (_.isEmpty(storePayload?.contactInfo) && _.isEmpty(store?.contactInfo)) {
      storePayload.missingItem = 'Contact Info';
    } else if (
      _.isEmpty(storePayload?.storeTiming) &&
      _.isEmpty(store?.storeTiming)
    ) {
      storePayload.missingItem = 'Store Timing';
    } else {
      storePayload.missingItem = '';
    }
    if (role === AdminRole.OEM) {
      storePayload.oemUserName = userName;
    }

    // const newStore = new Store(storePayload);
    if (store) {
      const res = await Store.findOneAndUpdate(
        { storeId: storeId },
        { $set: storePayload },
        { returnDocument: 'after' }
      );
      // await sendNotification(
      //   'Store Updated',
      //   'Your store has updated. It is under review',
      //   phoneNumber,
      //   role,
      //   ''
      // );
      const data = {
        title: 'Store Updated',
        body: `Your store has updated. It is under review`,
        phoneNumber: phoneNumber,
        role: role,
        type: 'STORE_UPDATED'
      };
      const sqsMessage = await this.sqsService.createMessage(
        SQSEvent.NOTIFICATION,
        data
      );
      const notificationData = {
        title: 'Store Updated',
        body: `Your store is updated. It is under review`,
        phoneNumber: phoneNumber,
        type: 'STORE_UPDATED',
        role: 'STORE_OWNER',
        storeId: store?.storeId
      };

      let notification =
        await this.notificationService.createNotification(notificationData);
      Logger.info(
        '<Service>:<StoreService>: <Store onboarding: updated store successfully>'
      );
      return res;
    }
    const newStore = await Store.create(storePayload);
    // await sendNotification(
    //   'Store Created',
    //   'Your store has created. It is under review',
    //   phoneNumber,
    //   role,
    //   ''
    // );
    const data = {
      title: 'Store Created',
      body: `Your store is created. It is under review`,
      phoneNumber: phoneNumber,
      role: role,
      type: 'STORE_CREATED'
    };
    const sqsMessage = await this.sqsService.createMessage(
      SQSEvent.NOTIFICATION,
      data
    );
    const notificationData = {
      title: 'Store Created',
      body: `Your store is created. It is under review`,
      phoneNumber: phoneNumber,
      type: 'STORE_CREATED',
      role: 'STORE_OWNER',
      storeId: store?.storeId
    };

    let notification =
      await this.notificationService.createNotification(notificationData);

    Logger.info(
      '<Service>:<StoreService>: <Store onboarding: created new store successfully>'
    );
    return newStore;
  }

  async getStoresByCity(
    state: string,
    city: string,
    userName?: string,
    role?: string,
    oemId?: string,
    filterOemUser?: string,
    userType?: string,
    category?: string
  ): Promise<any> {
    Logger.info('<Route>:<StoreService>: <StoreService : store get initiated>');
    let query: any = {};

    query = {
      'contactInfo.state': state,
      'contactInfo.city': city,
      profileStatus: 'ONBOARDED',
      oemUserName: filterOemUser,
      'basicInfo.category.name': { $in: [category] }
    };
    if (!category) {
      delete query['basicInfo.category.name'];
    }
    if (!filterOemUser) {
      delete query['oemUserName'];
    }
    if (!state) {
      delete query['contactInfo.state'];
    }
    if (!city) {
      delete query['contactInfo.city'];
    }
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }
    const userRoleType = userType === 'OEM' ? true : false;

    if (userType && !filterOemUser) {
      query.oemUserName = { $exists: userRoleType };
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    Logger.debug(`${JSON.stringify(query)} queryyyyyyy`);
    const newStore = await Store.aggregate([
      {
        $match: query
      }
    ]);
    return newStore;
  }

  async getAllStorePaginaed(
    userName?: string,
    role?: string,
    userType?: string,
    status?: string,
    verifiedStore?: string,
    oemId?: string,
    pageNo?: number,
    pageSize?: number,
    employeeId?: string,
    searchQuery?: string
  ): Promise<StoreResponse[]> {
    Logger.info(
      '<Service>:<StoreService>:<Search and Filter stores service initiated 111111>'
    );
    let query: any = {};
    const userRoleType = userType === 'OEM' ? true : false;

    query = {
      isVerified: Boolean(verifiedStore),
      profileStatus: status === 'PARTNERDRAFT' ? 'DRAFT' : status
    };
    if (searchQuery) {
      query.$or = [
        { storeId: new RegExp(searchQuery, 'i') },
        { 'contactInfo.phoneNumber.primary': new RegExp(searchQuery, 'i') }
      ];
    }
    if (role === AdminRole.ADMIN) {
      query.oemUserName = { $exists: userRoleType };
    }
    if (!userType) {
      delete query['oemUserName'];
    }
    if (status === 'PARTNERDRAFT') {
      query.oemUserName = { $exists: true };
    }
    if (status === 'DRAFT') {
      query.oemUserName = { $exists: userRoleType };
    }

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    if (!verifiedStore) {
      delete query['isVerified'];
    }
    if (!status) {
      delete query['profileStatus'];
    }
    if (role === 'EMPLOYEE') {
      const userName = oemId;
      const employeeDetails =
        await this.spEmployeeService.getEmployeeByEmployeeId(
          employeeId,
          userName
        );
      console.log(employeeDetails, 'dfwklm');
      if (employeeDetails) {
        query['contactInfo.state'] = {
          $in: employeeDetails.state.map((stateObj) => stateObj.name)
        };
        if (!isEmpty(employeeDetails?.city)) {
          query['contactInfo.city'] = {
            $in: employeeDetails.city.map((cityObj) => cityObj.name)
          };
        }
      }
    }

    console.log(query, 'FEWFm');

    let stores: any = await Store.aggregate([
      {
        $match: query
      },
      {
        $skip: pageNo * pageSize
      },
      {
        $limit: pageSize
      },
      {
        $project: { 'verificationDetails.verifyObj': 0 }
      }
    ]);
    return stores;
  }

  async getTotalStoresCount(
    userName?: string,
    role?: string,
    oemId?: string,
    userType?: string,
    status?: string,
    verifiedStore?: string,
    employeeId?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<StoreService>:<Search and Filter stores service initiated 111111>'
    );
    let query: any = {};
    const userRoleType = userType === 'OEM' ? true : false;
    let onboarded: any = 0;
    let rejected: any = 0;
    let draft: any = 0;
    let pending: any = 0;
    let partnerdraft: any = 0;

    query = {
      isVerified: Boolean(verifiedStore)
      // profileStatus: status === 'PARTNERDRAFT' ? 'DRAFT' : status
    };
    if (role === AdminRole.ADMIN) {
      query.oemUserName = { $exists: userRoleType };
    }
    if (!userType) {
      delete query['oemUserName'];
    }
    // if (status === 'PARTNERDRAFT') {
    //   query.oemUserName = { $exists: true };
    // }
    if (status === 'DRAFT') {
      query.oemUserName = { $exists: userRoleType };
    }
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    if (!verifiedStore) {
      delete query['isVerified'];
    }
    const overallStatus = {
      profileStatus: status
    };
    if (!status) {
      delete query['profileStatus'];
      delete overallStatus['profileStatus'];
    }

    if (role === 'EMPLOYEE') {
      const userName = oemId;
      const employeeDetails =
        await this.spEmployeeService.getEmployeeByEmployeeId(
          employeeId,
          userName
        );
      console.log(employeeDetails, 'dfwklm');
      if (employeeDetails) {
        query['contactInfo.state'] = {
          $in: employeeDetails.state.map((stateObj) => stateObj.name)
        };
        if (!isEmpty(employeeDetails?.city)) {
          query['contactInfo.city'] = {
            $in: employeeDetails.city.map((cityObj) => cityObj.name)
          };
        }
      }
    }

    const total = await Store.countDocuments({ ...overallStatus, ...query });
    if (status === 'ONBOARDED' || !status) {
      onboarded = await Store.countDocuments({
        profileStatus: 'ONBOARDED',
        ...query
      });
    }
    if (status === 'REJECTED' || !status) {
      rejected = await Store.countDocuments({
        profileStatus: 'REJECTED',
        ...query
      });
    }
    if (status === 'DRAFT' || !status) {
      draft = await Store.countDocuments({
        profileStatus: 'DRAFT',
        ...query
      });
    }
    if (status === 'PENDING' || !status) {
      pending = await Store.countDocuments({
        profileStatus: 'PENDING',
        ...query
      });
    }
    if (status === 'PARTNERDRAFT' || !status) {
      query.oemUserName = { $exists: true };
      if (role === AdminRole.OEM) {
        query.oemUserName = userName;
      }

      if (role === AdminRole.EMPLOYEE) {
        query.oemUserName = oemId;
      }

      if (oemId === 'SERVICEPLUG') {
        delete query['oemUserName'];
      }

      partnerdraft = await Store.countDocuments({
        profileStatus: 'DRAFT',
        ...query
      });
    }

    let totalCounts = {
      total,
      onboarded,
      rejected,
      draft,
      pending,
      partnerdraft
    };

    return totalCounts;
  }

  async getNearestStore(searchReqBody: {
    storeName: string;
    brand: string;
    subCategory: string[];
    category: string;
    pageNo: number;
    pageSize: number;
    coordinates: number[];
    oemUserName: string;
  }): Promise<StoreResponse[]> {
    Logger.info(
      '<Service>:<StoreService>:<Search and Filter stores service initiated 111111>'
    );
    const query = {
      'basicInfo.businessName': new RegExp(searchReqBody.storeName, 'i'),
      'basicInfo.brand.name': searchReqBody.brand,
      'basicInfo.category.name': searchReqBody.category,
      'basicInfo.subCategory.name': { $in: searchReqBody.subCategory },
      oemUserName: searchReqBody.oemUserName,
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
    if (!searchReqBody.oemUserName) {
      delete query.oemUserName;
    }
    Logger.debug(query);

    let stores: any = await Store.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: searchReqBody.coordinates as [number, number]
          },
          spherical: true,
          query: query,
          distanceField: 'contactInfo.distance',
          distanceMultiplier: 0.001
        }
      },
      {
        $match: {
          'contactInfo.distance': { $lte: 10 }
        }
      },
      { $limit: 15 },
      {
        $project: { 'verificationDetails.verifyObj': 0 }
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

  async getNearestDealer(searchReqBody: {
    coordinates: number[];
    oemUserName: string;
    stores: any;
    selectAllStores: any;
  }): Promise<StoreResponse[]> {
    Logger.info(
      '<Service>:<StoreService>:<Search and Filter stores service initiated 111111> '
    );
    const query: any = {
      profileStatus: 'ONBOARDED',
      oemUserName: searchReqBody?.oemUserName
    };

    const storeList: any =
      searchReqBody?.stores?.map((val: any) => val?.storeId) || [];
    if (!_.isEmpty(searchReqBody?.stores)) {
      query.storeId = { $in: storeList };
    }

    if (_.isEmpty(searchReqBody?.stores)) {
      delete query['storeId'];
    }
    Logger.debug(query);

    let stores: any = await Store.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: searchReqBody.coordinates as [number, number]
          },
          spherical: true,
          query: query,
          distanceField: 'contactInfo.distance',
          distanceMultiplier: 0.001
        }
      },
      {
        $lookup: {
          from: 'admin_users',
          localField: 'oemUserName',
          foreignField: 'userName',
          as: 'partnerDetail'
        }
      },
      { $unwind: { path: '$partnerDetail' } },
      {
        $set: {
          partnerEmail: '$partnerDetail.contactInfo.email',
          dealerName: '$partnerDetail.businessName'
        }
      },
      {
        $project: { verificationDetails: 0, partnerDetail: 0 }
      },
      { $limit: 5 }
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

  async getStoreByUserId(userId: Types.ObjectId): Promise<IStore> {
    Logger.info('<Service>:<StoreService>:<Get store by storeId>');
    const storeResponse: IStore = await Store.findOne({ userId });
    return storeResponse;
  }

  async createHistory(storeRequest: any) {
    Logger.info('<Service>:<StoreService>: <Adding history intiiated>');

    const historyInfo = storeRequest;

    const historyDetails = await StoreHistory.create(historyInfo);

    Logger.info('<Service>:<StoreService>:<history created successfully>');
    return historyDetails;
  }

  async getHistory(searchReqBody: { storeId: any }): Promise<StoreResponse[]> {
    Logger.info('<Service>:<StoreService>:<StoreHistory service initiated> ');
    const query: any = {
      storeId: searchReqBody?.storeId
    };

    let stores: any = await StoreHistory.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } }
    ]);
    return stores;
  }
}
