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
  StoreRequest,
  StoreResponse,
  VerifyAadharRequest,
  VerifyBusinessRequest
} from '../interfaces';
// import Store, { IDocuments, IStore } from '../models/Store';
import StoreLead, { IDocuments, IStoreLead } from '../models/StoreLead';
import Store from '../models/Store';
import User, { IUser } from '../models/User';
import Request from '../types/request';
import { S3Service } from './s3.service';
import { NotificationService } from './notification.service';
import { DocType } from '../enum/docType.enum';
import { SurepassService } from './surepass.service';
import { SPEmployeeService } from './spEmployee.service';
import { StoreService } from './store.service';

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
  private storeService = container.get<StoreService>(TYPES.StoreService);

  async create(
    storeRequest: StoreRequest,
    oemId: string,
    role: string,
    userName: string
  ): Promise<IStoreLead> {
    let storeRes: any = {};
    Logger.info('<Service>:<StoreLeadService>:<Onboarding service initiated>');

    Logger.info(
      '<Route>:<StoreLeadService>: <Store onboarding: creating new store>'
    );
    const storeNumber: any = storeRequest;
    const storeData = await Store.findOne({
      'contactInfo.phoneNumber.primary':
        storeNumber?.store?.contactInfo?.phoneNumber?.primary
    });
    const storeVal = await StoreLead.findOne({
      'store.contactInfo.phoneNumber.primary':
        storeNumber?.store?.contactInfo?.phoneNumber?.primary
    });
    if (storeData) {
      throw new Error('Store Primary PhoneNumber Already exist');
    }
    if (storeVal) {
      throw new Error('Store Primary PhoneNumber Already exist');
    }
    storeRes = {
      ...storeRequest,
      status: StoreLeadProfileStatus.PENDING_FOR_VERIFICATION
    };
    // storeRes.store.userName = oemId;
    if (role === AdminRole.OEM) {
      storeRes.store.userName = userName;
    }
    if (role === AdminRole.EMPLOYEE) {
      storeRes.store.userName = oemId;
    }
    if (oemId === 'SERVICEPLUG') {
      delete storeRes['store.userName'];
    }
    let newStore;
    try {
      newStore = await StoreLead.create(storeRes);
    } catch (err) {
      throw new Error(err);
    }
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
    const storePayload: any = storeRequest;

    Logger.info('<Service>:<StoreLeadService>: <Store: updating new store>');
    // storePayload.profileStatus = StoreLeadProfileStatus.DRAFT;
    const query: any = {
      _id: storePayload?._id
    };
    const updatedStore = await StoreLead.findOneAndUpdate(query, storePayload, {
      returnDocument: 'after',
      projection: { 'store.verificationDetails.verifyObj': 0 }
    });
    Logger.info(
      '<Service>:<StoreLeadService>: <Store: update store successfully>'
    );
    return updatedStore;
  }

  async updateStoreImages(storeId: string, req: Request | any): Promise<any> {
    Logger.info('<Service>:<StoreLeadService>:<Upload Vehicles initiated>');
    const storeRes = await StoreLead.findOne(
      { _id: storeId },
      { 'store.verificationDetails': 0 }
    );
    if (_.isEmpty(storeRes)) {
      throw new Error('Store does not exist');
    }

    const files: Array<any> = req.files;
    const documents: Partial<IDocuments> | any = storeRes?.store?.documents || {
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
      { _id: storeId },
      { $set: { 'store.documents': documents } },
      {
        returnDocument: 'after',
        projection: { 'store.verificationDetails.verifyObj': 0 }
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
    const query: any = {
      _id: statusRequest.storeId
    };
    const storeRes: IStoreLead = await StoreLead.findOne(
      { _id: statusRequest?.storeId },
      { 'store.verificationDetails': 0 }
    );
    const phoneNumber =
      storeRes?.store?.basicInfo?.userPhoneNumber ||
      storeRes?.store?.contactInfo?.phoneNumber?.primary;

    await StoreLead.findOneAndUpdate(query, {
      $set: {
        status: statusRequest.status,
        rejectionReason: statusRequest.rejectionReason
      }
    });
    Logger.info(
      '<Service>:<StoreLeadService>: <Store: store status updated successfully>'
    );
    const updatedStore = await StoreLead.findOne(
      {
        _id: statusRequest.storeId
      },
      { 'store.verificationDetails.verifyObj': 0 }
    );
    if (statusRequest.status === 'APPROVED') {
      const userData = {
        role: 'STORE_OWNER',
        phoneNumber: updatedStore?.store?.contactInfo?.phoneNumber?.primary
      };
      const newUser = await User.findOneAndUpdate({}, userData);
      const newStore = await this.createNewStore(updatedStore);
    }
    return updatedStore;
  }

  async createNewStore(jsonResult: any) {
    const storeRequest: any = {
      storePayload: {
        basicInfo: jsonResult?.store?.basicInfo,
        contactInfo: jsonResult?.store?.contactInfo,
        documents: jsonResult?.store?.documents,
        storeTiming: jsonResult?.store?.storeTiming,
        verificationDetails: jsonResult?.verificationDetails,
        isVerified: jsonResult?.isVerified
      },
      phoneNumber: jsonResult?.store?.contactInfo?.phoneNumber?.primary
    };
    const userName = '';
    const role = 'STORE_OWNER';
    const oemId =
      jsonResult?.store?.userName === 'SERVICEPLUG'
        ? ''
        : jsonResult?.store?.userName;
    const storeStatus = 'ONBOARDED';
    const createStore = await this.storeService.create(
      storeRequest,
      userName,
      role,
      oemId,
      storeStatus
    );

    return createStore;
  }

  async getById(req: {
    storeId: string;
    lat: string;
    long: string;
  }): Promise<StoreResponse[]> {
    Logger.info(
      '<Service>:<StoreLeadService>:<Get stores by Id service initiated>'
    );
    const query: any = {
      _id: req.storeId
    };
    let storeResponse: any;
    if (_.isEmpty(req.lat) && _.isEmpty(req.long)) {
      storeResponse = await StoreLead.find(query, {
        'store.verificationDetails.verifyObj': 0
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

  async deleteStore(storeId: string): Promise<any> {
    Logger.info(
      '<Service>:<StoreLeadService>:<Delete stores by Id service initiated>'
    );
    const query: any = {
      _id: storeId
    };
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

  async initiateBusinessVerification(
    payload: VerifyBusinessRequest,
    phoneNumber: string,
    role?: string
  ) {
    Logger.info(
      '<Service>:<StoreLeadService>:<Initiate Verifying user business>'
    );
    // validate the store from user phone number and user id
    let verifyResult: any = {};
    const displayFields: any = {};

    try {
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
    Logger.info(
      '<Service>:<StoreLeadService>:<Approve Verifying user business>'
    );
    // validate the store from user phone number and user id

    try {
      const storeDetails = await StoreLead.findOne(
        {
          _id: payload.storeId
        },
        { 'store.verificationDetails': 0 }
      ).lean();

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
    storeDetails: any
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
          isVerified: isVerified,
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
        projection: { 'store.verificationDetails.verifyObj': 0 }
      }
    );

    return updatedStore;
  }

  async verifyAadhar(
    payload: VerifyAadharRequest,
    phoneNumber: string,
    role?: string
  ) {
    Logger.info(
      '<Service>:<StoreLeadService>:<Initiate Verifying user business>'
    );
    // validate the store from user phone number and user id
    const verifyResult: any = {};
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
    searchQuery?: string,
    startDate?: string,
    endDate?: string,
    accessPolicy?: string
  ): Promise<StoreResponse[]> {
    Logger.info(
      '<Service>:<StoreLeadService>:<Search and Filter stores service initiated 111111>'
    );
    let query: any = {};
    const userRoleType = userType === 'OEM' ? true : false;
    const firstDay = new Date(startDate);
    const lastDay = new Date(endDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);
    query = {
      // isVerified: Boolean(verifiedStore),
      updatedAt: {
        $gte: firstDay,
        $lte: nextDate
      },
      status: status,
      'store.employeeId': employeeId
    };
    if (accessPolicy === 'ENABLED') {
      delete query['store.employeeId'];
    }
    if (searchQuery) {
      query.$or = [
        { 'store.employeeId': searchQuery },
        { 'store.contactInfo.phoneNumber.primary': searchQuery }
      ];
    }
    if (startDate === null || endDate === null) {
      delete query['updatedAt'];
    }
    if (!employeeId) {
      delete query['store.employeeId'];
    }
    if (role === AdminRole.OEM) {
      query = {
        ...query,
        'store.userName': userName
      };
    }
    if (role === AdminRole.EMPLOYEE) {
      query = {
        ...query,
        'store.userName': oemId
      };
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['store.userName'];
    }

    console.log(query, 'FEWFm');

    const basePipeline: any = [
      {
        $match: query
      },
      {
        $skip: pageNo * pageSize
      },
      {
        $limit: pageSize
      }
    ];

    if (status === 'APPROVED') {
      const lookupStage: any = {
        $lookup: {
          from: 'stores',
          let: {
            primaryPhone: '$store.contactInfo.phoneNumber.primary',
            secondaryPhone: '$store.contactInfo.phoneNumber.secondary'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        '$contactInfo.phoneNumber.primary',
                        '$$primaryPhone'
                      ]
                    },
                    {
                      $eq: [
                        '$contactInfo.phoneNumber.secondary',
                        '$$secondaryPhone'
                      ]
                    }
                  ]
                }
              }
            }
          ],
          as: 'matchedContacts'
        }
      };

      basePipeline.splice(1, 0, lookupStage, {
        $unwind: { path: '$matchedContacts' }
      });

      basePipeline.push({
        $set: {
          storeId: '$matchedContacts.storeId'
        }
      });
    }
    basePipeline.push({
      $project: {
        'store.verificationDetails.verifyObj': 0,
        matchedContacts: 0
      }
    });

    const stores: any = await StoreLead.aggregate(basePipeline);
    return stores;
  }

  async getTotalStoresCount(
    userName?: string,
    role?: string,
    oemId?: string,
    userType?: string,
    status?: string,
    verifiedStore?: string,
    employeeId?: string,
    searchQuery?: string,
    startDate?: string,
    endDate?: string,
    accessPolicy?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<StoreLeadService>:<Search and Filter stores service initiated 111111>'
    );
    let query: any = {};
    let pendingForVerification: any = 0;
    let rejected: any = 0;
    // let created: any = 0;
    let verified: any = 0;
    let followUp: any = 0;
    let approved: any = 0;

    const firstDay = new Date(startDate);
    const lastDay = new Date(endDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);

    query = {
      updatedAt: {
        $gte: firstDay,
        $lte: nextDate
      },
      'store.employeeId': employeeId
      // 'store.userName': oemId
    };

    if (accessPolicy === 'ENABLED') {
      delete query['store.employeeId'];
    }

    if (searchQuery) {
      query.$or = [
        { 'store.employeeId': searchQuery },
        { 'store.contactInfo.phoneNumber.primary': searchQuery }
      ];
    }
    if (!startDate || !endDate) {
      delete query['updatedAt'];
    }
    if (!employeeId) {
      delete query['store.employeeId'];
    }
    console.log(query, 'FEWFmssss');

    if (role === AdminRole.OEM) {
      query = {
        ...query,
        'store.userName': userName
      };
    }
    if (role === AdminRole.EMPLOYEE) {
      query = {
        ...query,
        'store.userName': oemId
      };
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['store.userName'];
    }

    const total = await StoreLead.count({ ...query });
    if (status === 'PENDING_FOR_VERIFICATION' || !status) {
      pendingForVerification = await StoreLead.count({
        status: 'PENDING_FOR_VERIFICATION',
        ...query
      });
    }
    if (status === 'REJECTED' || !status) {
      rejected = await StoreLead.count({
        status: 'REJECTED',
        ...query
      });
    }
    // if (status === 'CREATED' || !status) {
    //   created = await StoreLead.count({
    //     status: 'CREATED',
    //     ...query
    //   });
    // }
    if (status === 'VERIFIED' || !status) {
      verified = await StoreLead.count({
        status: 'VERIFIED',
        ...query
      });
    }
    if (status === 'FOLLOWUP' || !status) {
      followUp = await StoreLead.count({
        status: 'FOLLOWUP',
        ...query
      });
    }
    if (status === 'APPROVED' || !status) {
      approved = await StoreLead.count({
        status: 'APPROVED',
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

    const totalCounts = {
      total,
      pendingForVerification,
      rejected,
      // created,
      verified,
      followUp,
      approved
    };

    return totalCounts;
  }
}
