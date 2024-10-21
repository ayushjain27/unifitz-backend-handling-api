import { ICatalogMap, StoreLeadProfileStatus } from './../models/StoreLead';
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
// import Store, { IDocuments, IStore } from '../models/Store';
import StoreLead, { IDocuments, IStoreLead } from '../models/StoreLead';
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
import { sendNotification } from '../utils/common';
import slugify from 'slugify';
import { SPEmployeeService } from './spEmployee.service';

@injectable()
export class StoreLeadService {
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

  async create(
    storeRequest: StoreRequest,
    userName?: string,
    role?: string,
    oemId?: string
  ): Promise<IStoreLead> {
    const { storePayload, phoneNumber } = storeRequest;
    Logger.info('<Service>:<StoreLeadService>:<Onboarding service initiated>');
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
      '<Route>:<StoreLeadService>: <Store onboarding: creating new store>'
    );

    storePayload.storeId = newStoreId;
    storePayload.profileStatus = StoreLeadProfileStatus.CREATED;
    const businessName = storeRequest.storePayload.basicInfo.businessName;
    const baseSlug = slugify(businessName, { lower: true, strict: true });

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
      newStore = await StoreLead.create(storePayload);
    } catch (err) {
      throw new Error(err);
    }
    await sendNotification(
      'Store Created',
      'Your store has created. It is under review',
      phoneNumber,
      'STORE_OWNER',
      ''
    );
    Logger.info(
      '<Service>:<StoreLeadService>: <Store onboarding: created new store successfully>'
    );
    return newStore;
  }

  async update(
    storeRequest: StoreRequest,
    userName?: string,
    role?: string
  ): Promise<IStoreLead> {
    Logger.info(
      '<Service>:<StoreLeadService>:<Update store service initiated>'
    );
    const { storePayload } = storeRequest;

    Logger.info('<Service>:<StoreLeadService>: <Store: updating new store>');
    // storePayload.profileStatus = StoreLeadProfileStatus.DRAFT;
    const query: any = {};
    query.storeId = storePayload.storeId;
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }
    const updatedStore = await StoreLead.findOneAndUpdate(query, storePayload, {
      returnDocument: 'after',
      projection: { 'verificationDetails.verifyObj': 0 }
    });
    await sendNotification(
      'Store Updated',
      'Your store has updated. It is under review',
      storePayload?.contactInfo?.phoneNumber?.primary,
      'STORE_OWNER',
      ''
    );
    Logger.info(
      '<Service>:<StoreLeadService>: <Store: update store successfully>'
    );
    return updatedStore;
  }

  async updateStoreImages(storeId: string, req: Request | any): Promise<any> {
    Logger.info('<Service>:<StoreLeadService>:<Upload Vehicles initiated>');
    const store = await StoreLead.findOne(
      { storeId },
      { verificationDetails: 0 }
    );
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
    const res = await StoreLead.findOneAndUpdate(
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
  ): Promise<IStoreLead> {
    Logger.info('<Service>:<StoreLeadService>:<Update store status>');
    const query: any = {};
    query.storeId = statusRequest.storeId;
    let store: IStoreLead;
    store = await StoreLead.findOne(
      { storeId: statusRequest?.storeId },
      { verificationDetails: 0 }
    );
    const phoneNumber =
      store?.basicInfo?.userPhoneNumber ||
      store?.contactInfo?.phoneNumber?.primary;
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }
    await StoreLead.findOneAndUpdate(query, {
      $set: {
        profileStatus: statusRequest.profileStatus,
        rejectionReason: statusRequest.rejectionReason
      }
    });
    Logger.info(
      '<Service>:<StoreLeadService>: <Store: store status updated successfully>'
    );
    const updatedStore = await StoreLead.findOne(
      {
        storeId: statusRequest.storeId
      },
      { 'verificationDetails.verifyObj': 0 }
    );
    await sendNotification(
      `${
        statusRequest.profileStatus === 'ONBOARDED'
          ? 'Store Onboarded'
          : 'Store Rejected'
      }`,
      `${
        statusRequest.profileStatus === 'ONBOARDED'
          ? 'Congratulations 😊'
          : 'Sorry 😞'
      } Your store has been ${
        statusRequest.profileStatus === 'ONBOARDED'
          ? 'onboarded'
          : `rejected due to this reason: ${statusRequest.rejectionReason}`
      }`,
      phoneNumber,
      'STORE_OWNER',
      ''
    );
    return updatedStore;
  }

  async sendNotificationToStore(store: IStoreLead) {
    Logger.info(
      '<Service>:<StoreLeadService>:<Sending notification to store owner>'
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
      '<Service>:<StoreLeadService>:<Get stores by Id service initiated>'
    );
    const query: any = {};
    query.storeId = req.storeId;
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }
    let storeResponse: any;
    if (_.isEmpty(req.lat) && _.isEmpty(req.long)) {
      storeResponse = await StoreLead.find(query, {
        'verificationDetails.verifyObj': 0
      });
    } else {
      storeResponse = StoreLead.aggregate([
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
      '<Service>:<StoreLeadService>:<Delete stores by Id service initiated>'
    );
    const query: any = {};
    query.storeId = storeId;
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }
    const res = await StoreLead.findOneAndDelete(query);
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
    Logger.info(
      '<Service>:<StoreLeadService>:<Get all stores service initiated>'
    );
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
      stores = await StoreLead.find(query, {
        'verificationDetails.verifyObj': 0
      }).lean();
    }
    if (
      !_.isEmpty(userType) ||
      !_.isEmpty(status) ||
      !_.isEmpty(verifiedStore)
    ) {
      stores = await StoreLead.aggregate([{ $match: query }]);
    }

    return stores;
  }

  async searchAndFilter(
    storeName: string,
    category: string,
    subCategory: string[],
    brand: string
  ): Promise<StoreResponse[]> {
    Logger.info(
      '<Service>:<StoreLeadService>:<Search and Filter stores service initiated>'
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
    let stores: any = await StoreLead.find(query, {
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
    oemUserName: string;
  }): Promise<StoreResponse[]> {
    Logger.info(
      '<Service>:<StoreLeadService>:<Search and Filter stores service initiated 111111>'
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

    let stores: any = await StoreLead.aggregate([
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
      '<Service>:<StoreLeadService>:<Search and Filter stores service 2222222222>'
    );
    if (stores && Array.isArray(stores)) {
      stores = await Promise.all(
        stores.map(async (store) => {
          const updatedStore = { ...store };
          Logger.info(
            '<Service>:<StoreLeadService>:<Search and Filter stores service 3333333333333>'
          );
          updatedStore.overAllRating = await this.getOverallRatings(
            updatedStore.storeId
          );
          return updatedStore;
        })
      );
    }
    Logger.info(
      '<Service>:<StoreLeadService>:<Search and Filter stores service 4444444444444>'
    );
    return stores;
  }

  async getByOwner(userId: string): Promise<StoreResponse[]> {
    Logger.info(
      '<Service>:<StoreLeadService>:<Get stores by owner service initiated>'
    );
    const objId = new Types.ObjectId(userId);
    const stores = await StoreLead.find(
      { userId: objId },
      { 'verificationDetails.verifyObj': 0 }
    );
    return stores;
  }

  async addReview(
    storeReview: StoreReviewRequest
  ): Promise<StoreReviewRequest> {
    Logger.info('<Service>:<StoreLeadService>:<Add Store Ratings initiate>');
    let customer: ICustomer;
    if (storeReview?.userId) {
      customer = await Customer.findOne({
        _id: new Types.ObjectId(storeReview?.userId)
      })?.lean();
    }
    let store: IStoreLead;
    store = await StoreLead.findOne(
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
    await sendNotification(
      'Store Review',
      'Hey 👋 you got a feedback',
      phoneNumber,
      'STORE_OWNER',
      'RATING_REVIEW'
    );
    Logger.info(
      '<Service>:<StoreLeadService>:<Store Ratings added successfully>'
    );
    return newStoreReview;
  }

  async getOverallRatings(
    storeId: string
  ): Promise<OverallStoreRatingResponse> {
    Logger.info('<Service>:<StoreLeadService>:<Get Overall Ratings initiate>');
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
      '<Service>:<StoreLeadService>:<Get Overall Ratings performed successfully>'
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
    Logger.info('<Service>:<StoreLeadService>:<Get Store Ratings initiate>');
    const storeReviews = await StoreReview.find({ storeId })
      .skip(pageNo * pageSize)
      .limit(pageSize)
      .lean();
    Logger.info(
      '<Service>:<StoreLeadService>:<Get Ratings performed successfully>'
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
    Logger.info('<Service>:<StoreLeadService>:<Initiate Verifying user business>');
    // validate the store from user phone number and user id
    let verifyResult: any = {};
    const displayFields: any = {};

    try {
      // get the store data
      const storeDetails = await StoreLead.findOne(
        {
          storeId: payload.storeId
        },
        { verificationDetails: 0 }
      ).lean();
      Logger.debug(`${phoneNumber} ${role} user resulttttttttt`);
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
    Logger.info('<Service>:<StoreLeadService>:<Approve Verifying user business>');
    // validate the store from user phone number and user id

    try {
      const storeDetails = await StoreLead.findOne(
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
    storeDetails: IStoreLead
  ) {
    let isVerified = false;

    if (!_.isEmpty(verifyResult)) {
      // Business is verified
      isVerified = true;
    }
    // update the store
    const updatedStore = await StoreLead.findOneAndUpdate(
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
    Logger.info('<Service>:<StoreLeadService>:<Initiate Verifying user business>');
    // validate the store from user phone number and user id
    let verifyResult: any = {};
    const gstAdhaarNumber = payload?.gstAdhaarNumber
      ? payload?.gstAdhaarNumber
      : '';

    try {
      // get the store data
      const storeDetails = await StoreLead.findOne({
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

  async getAllReviews(
    userName: string,
    role: string,
    oemId: string
  ): Promise<IStoreReview[]> {
    Logger.info('<Service>:<StoreLeadService>:<Get all stores reviews>');
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
    Logger.info('<Service>:<StoreLeadService>:<Update store review status>');
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
      '<Service>:<StoreLeadService>: <Store: store review status updated successfully>'
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
  ): Promise<IStoreLead> {
    const { storePayload, phoneNumber } = storeRequest;
    Logger.info('<Service>:<StoreLeadService>:<Onboarding service initiated>');
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
    let store: IStoreLead;
    if (storeId) {
      store = await StoreLead.findOne({ storeId }, { verificationDetails: 0 });
    }

    storePayload.userId = ownerDetails._id;

    if (!store) {
      const lastCreatedStoreId = await StaticIds.find({}).limit(1).exec();

      const newStoreId = String(parseInt(lastCreatedStoreId[0].storeId) + 1);

      await StaticIds.findOneAndUpdate({}, { storeId: newStoreId });

      //   ? new Date().getFullYear() * 100
      //   : +lastCreatedStoreId[0].storeId + 1;
      Logger.info(
        '<Route>:<StoreLeadService>: <Store onboarding: creating new store>'
      );

      storePayload.storeId = newStoreId;
      storePayload.profileStatus = StoreLeadProfileStatus.CREATED;
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
      const res = await StoreLead.findOneAndUpdate(
        { storeId: storeId },
        { $set: storePayload },
        { returnDocument: 'after' }
      );
      await sendNotification(
        'Store Updated',
        'Your store has updated. It is under review',
        phoneNumber,
        role,
        ''
      );
      Logger.info(
        '<Service>:<StoreLeadService>: <Store onboarding: updated store successfully>'
      );
      return res;
    }
    const newStore = await StoreLead.create(storePayload);
    await sendNotification(
      'Store Created',
      'Your store has created. It is under review',
      phoneNumber,
      role,
      ''
    );
    Logger.info(
      '<Service>:<StoreLeadService>: <Store onboarding: created new store successfully>'
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
    userType?: string
  ): Promise<any> {
    Logger.info('<Route>:<StoreLeadService>: <StoreLeadService : store get initiated>');
    let query: any = {};

    query = {
      'contactInfo.state': state,
      'contactInfo.city': city,
      profileStatus: 'ONBOARDED',
      oemUserName: filterOemUser
    };
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
    const newStore = await StoreLead.aggregate([
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
      '<Service>:<StoreLeadService>:<Search and Filter stores service initiated 111111>'
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

    let stores: any = await StoreLead.aggregate([
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
      '<Service>:<StoreLeadService>:<Search and Filter stores service initiated 111111>'
    );
    let query: any = {};
    const userRoleType = userType === 'OEM' ? true : false;
    let pendingForVerification: any = 0;
    let rejected: any = 0;
    let created: any = 0;
    let verified: any = 0;
    let followUp: any = 0;
    let deleted: any = 0;
    let approved: any = 0;

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

    const total = await StoreLead.count({ ...overallStatus, ...query });
    if (status === 'PENDING_FOR_VERIFICATION' || !status) {
      pendingForVerification = await StoreLead.count({
        profileStatus: 'PENDING_FOR_VERIFICATION',
        ...query
      });
    }
    if (status === 'REJECTED' || !status) {
      rejected = await StoreLead.count({
        profileStatus: 'REJECTED',
        ...query
      });
    }
    if (status === 'CREATED' || !status) {
      created = await StoreLead.count({
        profileStatus: 'CREATED',
        ...query
      });
    }
    if (status === 'VERIFIED' || !status) {
      verified = await StoreLead.count({
        profileStatus: 'VERIFIED',
        ...query
      });
    }
    if (status === 'FOLLOWUP' || !status) {
      followUp = await StoreLead.count({
        profileStatus: 'FOLLOWUP',
        ...query
      });
    }
    if (status === 'DELETED' || !status) {
      deleted = await StoreLead.count({
        profileStatus: 'DELETED',
        ...query
      });
    }
    if (status === 'APPROVED' || !status) {
      approved = await StoreLead.count({
        profileStatus: 'APPROVED',
        ...query
      });
    }
    // if (status === 'PARTNERDRAFT' || !status) {
    //   query.oemUserName = { $exists: true };
    //   if (role === AdminRole.OEM) {
    //     query.oemUserName = userName;
    //   }

    //   if (role === AdminRole.EMPLOYEE) {
    //     query.oemUserName = oemId;
    //   }

    //   if (oemId === 'SERVICEPLUG') {
    //     delete query['oemUserName'];
    //   }

    //   partnerdraft = await StoreLead.count({
    //     profileStatus: 'DRAFT',
    //     ...query
    //   });
    // }

    let totalCounts = {
      total,
      pendingForVerification,
      rejected,
      created,
      verified,
      followUp,
      deleted,
      approved
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
      '<Service>:<StoreLeadService>:<Search and Filter stores service initiated 111111>'
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

    let stores: any = await StoreLead.aggregate([
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
      '<Service>:<StoreLeadService>:<Search and Filter stores service initiated 111111> '
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

    let stores: any = await StoreLead.aggregate([
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

  async getStoreByUserId(userId: Types.ObjectId): Promise<IStoreLead> {
    Logger.info('<Service>:<StoreLeadService>:<Get store by storeId>');
    const storeResponse: IStoreLead = await StoreLead.findOne({ userId }).lean();
    return storeResponse;
  }

  async createHistory(storeRequest: any) {
    Logger.info('<Service>:<StoreLeadService>: <Adding history intiiated>');

    const historyInfo = storeRequest;

    const historyDetails = await StoreHistory.create(historyInfo);

    Logger.info('<Service>:<StoreLeadService>:<history created successfully>');
    return historyDetails;
  }

  async getHistory(searchReqBody: { storeId: any }): Promise<StoreResponse[]> {
    Logger.info('<Service>:<StoreLeadService>:<StoreHistory service initiated> ');
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
