import { ICatalogMap, StoreProfileStatus } from './../models/Store';
import { AdminRole } from './../models/Admin';

import { injectable } from 'inversify';
import { Types } from 'mongoose';
import _ from 'lodash';
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
import { sendNotification } from '../utils/common';

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
    if (role === AdminRole.OEM) {
      storePayload.oemUserName = userName;
    }
    // const newStore = new Store(storePayload);
    const newStore = await Store.create(storePayload);
    await sendNotification('Store Created', 'Your store has created. It is under review', phoneNumber, "STORE_OWNER", '');
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
      returnDocument: 'after',
      projection: { 'verificationDetails.verifyObj': 0 }
    });
    await sendNotification('Store Updated', 'Your store has updated. It is under review', storePayload?.contactInfo?.phoneNumber?.primary, "STORE_OWNER", '');
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
    console.log(userName, role,"dfwl;k")
    const query: any = {};
    query.storeId = statusRequest.storeId;
    let store: IStore;
      store = await Store.findOne(
        { storeId: statusRequest?.storeId },
        { verificationDetails: 0 }
      );
    let phoneNumber = store?.basicInfo?.userPhoneNumber || store?.contactInfo?.phoneNumber?.primary
    console.log(phoneNumber,"dfwl;k")
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
    await sendNotification(`${statusRequest.profileStatus === 'ONBOARDED' ? 'Store Onboarded' : 'Store Rejected'}`, `${statusRequest.profileStatus === 'ONBOARDED' ? 'Congratulations 😊' : 'Sorry 😞'} Your store has been ${statusRequest.profileStatus === 'ONBOARDED' ? 'onboarded' : `rejected due to this reason: ${statusRequest.rejectionReason}`}`, phoneNumber, "STORE_OWNER", '')
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
    verifiedStore?: string
  ) {
    Logger.info('<Service>:<StoreService>:<Get all stores service initiated>');
    let query: any = {};
    let stores: any;
    const userRoleType = userType === 'OEM' ? true : false;

    query = {
      isVerified: Boolean(verifiedStore),
      profileStatus: status,
      oemUserName: { $exists: userRoleType }
    };
    if (!userType) {
      delete query['oemUserName'];
    }
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }
    if (!verifiedStore) {
      delete query['isVerified'];
    }
    if (!status) {
      delete query['profileStatus'];
    }
    if (_.isEmpty(userType) && _.isEmpty(status) && _.isEmpty(verifiedStore)) {
      stores = await Store.find(query, {
        'verificationDetails.verifyObj': 0
      }).lean();
    }
    if (
      !_.isEmpty(userType) ||
      !_.isEmpty(status) ||
      !_.isEmpty(verifiedStore)
    ) {
      stores = await Store.find(query, {
        'verificationDetails.verifyObj': 0
      }).lean();
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
    }).lean();
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
      })?.lean();
    }
    console.log(customer,"dfw;lmk");
    let store: IStore;
      store = await Store.findOne(
        { storeId: storeReview?.storeId },
        { verificationDetails: 0 }
      );
    let phoneNumber = store?.basicInfo?.userPhoneNumber || store?.contactInfo?.phoneNumber?.primary
    if (!storeReview?.userId) {
      throw new Error('Customer not found');
    }
    const newStoreReview = new StoreReview(storeReview);
    newStoreReview.userPhoneNumber = customer?.phoneNumber || '';
    await newStoreReview.save();
    await sendNotification('Store Review', 'Hey 👋 you got a feedback', phoneNumber, "STORE_OWNER", 'RATING_REVIEW');
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
    const displayFields: any = {};

    try {
      // get the store data
      const storeDetails = await Store.findOne(
        {
          storeId: payload.storeId
        },
        { verificationDetails: 0 }
      ).lean();
      Logger.debug(`${phoneNumber} ${role} user resulttttttttt`)
      if (role !== 'ADMIN' && role !== 'OEM') {
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
      ).lean();

      if (role !== 'ADMIN' && role !== 'OEM') {

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
      }
      const updatedStore = await this.updateStoreDetails(
        payload.verificationDetails,
        payload.documentType,
        payload.gstAdhaarNumber,
        storeDetails
      );

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
          verificationDetails: { documentType, verifyObj: verifyResult, gstAdhaarNumber }
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
    const gstAdhaarNumber = payload?.gstAdhaarNumber ? payload?.gstAdhaarNumber : '';

    try {
      // get the store data
      const storeDetails = await Store.findOne({
        storeId: payload.storeId
      }).lean();

      if (_.isEmpty(storeDetails)) {
        throw new Error('Store does not exist');
      }

      if (role !== 'ADMIN' && role !== 'OEM') {
        const userDetails = await User.findOne(
          { phoneNumber, role },
          { verificationDetails: 0 }
        ).lean();

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
        storeDetails
      );

      return updatedStore;
    } catch (err) {
      throw new Error(err);
    }
  }

  async getAllReviews(userName: string, role: string): Promise<IStoreReview[]> {
    Logger.info('<Service>:<StoreService>:<Get all stores reviews>');
    let reviewResponse: any = []
    if (role === 'ADMIN') {
      reviewResponse = await StoreReview.find({});
    }
    else {
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
              $and: [
                { $eq: ['$storeInfo.oemUserName', userName] }
              ]
            }
          }
        },
      ])
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
    
    if(!store){
    const lastCreatedStoreId = await StaticIds.find({}).limit(1).exec();
    
    const newStoreId = String(parseInt(lastCreatedStoreId[0].storeId) + 1);

    await StaticIds.findOneAndUpdate(
      {}, 
      { storeId: newStoreId }
    );

    //   ? new Date().getFullYear() * 100
    //   : +lastCreatedStoreId[0].storeId + 1;
    Logger.info(
      '<Route>:<StoreService>: <Store onboarding: creating new store>'
    );

    storePayload.storeId = newStoreId;
    storePayload.profileStatus = StoreProfileStatus.DRAFT;
    }
    if(_.isEmpty(storePayload?.contactInfo) && _.isEmpty(store?.contactInfo)){
      storePayload.missingItem = 'Contact Info'
    }else if(_.isEmpty(storePayload?.storeTiming) && _.isEmpty(store?.storeTiming)){
      storePayload.missingItem = 'Store Timing'
    }else{ 
      storePayload.missingItem = ''
    }
    if (role === AdminRole.OEM) {
      storePayload.oemUserName = userName;
    }
    

    // const newStore = new Store(storePayload);
    if(store){
      const res = await Store.findOneAndUpdate(
      { storeId: storeId },
      { $set: storePayload  },
      { returnDocument: 'after' }
      );
      await sendNotification('Store Updated', 'Your store has updated. It is under review', phoneNumber, role, '');
     Logger.info(
      '<Service>:<StoreService>: <Store onboarding: updated store successfully>'
    );
    return res;
    }
    const newStore = await Store.create(storePayload);
    await sendNotification('Store Created', 'Your store has created. It is under review', phoneNumber, role, '');
    Logger.info(
      '<Service>:<StoreService>: <Store onboarding: created new store successfully>'
    );
    return newStore;
  }

  async getStoresByCity(
    state: string,
    city: string,
    userName?: string,
    role?: string
  ): Promise<any> {
    Logger.info(
      '<Route>:<StoreService>: <StoreService : store get initiated>'
    );
    let query: any = {};

    query = {
      'contactInfo.state': state,
      'contactInfo.city': city,
      profileStatus: 'ONBOARDED',
      oemUserName: userName
    };
    if (!state) {
      delete query['contactInfo.state'];
    }
    if (!city) {
      delete query['contactInfo.city'];
    }
    if (role !== AdminRole.OEM) {
      delete query['oemUserName'];
    }
    Logger.debug(`${JSON.stringify(query)} queryyyyyyy`);
    const newStore = await Store.aggregate([
      {
        $match: query
      }
    ]);
    Logger.info(
      '<Service>:<StoreService>: <Store onboarding: get store successfully>'
    );
    return newStore;
  }

}
