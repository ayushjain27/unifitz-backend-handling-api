/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import { injectable } from 'inversify';
import bcrypt from 'bcryptjs';
import _, { isEmpty } from 'lodash';
import secureRandomPassword from 'secure-random-password';
import { TYPES } from '../config/inversify.types';
import Payload from '../types/payload';
import container from '../config/inversify.container';
import Admin, { AdminRole, IAdmin } from '../models/Admin';
import Logger from '../config/winston';
import { S3Service } from './s3.service';
import { generateToken } from '../utils';
import { SurepassService } from './surepass.service';
import {
  DistributedPartnersReviewRequest,
  OverallStoreRatingResponse,
  VerifyB2BPartnersRequest
} from '../interfaces';
import { DocType } from '../enum/docType.enum';
import { IDocumentImageList } from '../models/Admin';
import { Types } from 'mongoose';
import DistributorPartnersReview from '../models/DistributorPartnersReview';
import Store, { IStore } from '../models/Store';
import Seller from '../models/Seller';
import { StaticIds } from './../models/StaticId';
import ContactUsModel, { IContactUs } from '../models/ContactUs';
import Marketing from '../models/Marketing';
import { permissions } from '../config/permissions';
import SPEmployee, { ISPEmployee } from '../models/SPEmployee';
import { sendEmail } from '../utils/common';
import { SQSService } from './sqs.service';
import { StoreService } from './store.service';
import { SQSEvent } from '../enum/sqsEvent.enum';

@injectable()
export class AdminService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private storeService = container.get<StoreService>(TYPES.StoreService);
  private surepassService = container.get<SurepassService>(
    TYPES.SurepassService
  );
  private sqsService = container.get<SQSService>(TYPES.SQSService);

  async create(reqBody: any): Promise<IAdmin> {
    const upAdminFields = Object.assign({}, reqBody) as IAdmin;

    // Update the password
    const password = secureRandomPassword.randomPassword({
      characters: [
        { characters: secureRandomPassword.upper, exactly: 3 },
        { characters: secureRandomPassword.symbols, exactly: 3 },
        { characters: secureRandomPassword.lower, exactly: 4 },
        { characters: secureRandomPassword.digits, exactly: 2 }
      ]
    });

    upAdminFields.password = await this.encryptPassword(password);
    // Build user object based on IAdmin

    // User the unique user ID
    const lastCreatedAdmin = await StaticIds.find({}).limit(1).exec();
    const userId = String(parseInt(lastCreatedAdmin[0].userId) + 1);

    await StaticIds.findOneAndUpdate({}, { userId: userId });

    upAdminFields.userId = String(userId);
    upAdminFields.userName = `SP${String(userId).slice(-4)}`;
    upAdminFields.role = 'OEM';
    upAdminFields.isFirstTimeLoggedIn = true;
    upAdminFields.accessList = permissions.OEM;

    if (reqBody?.documents?.gstData?.business_name) {
      upAdminFields.documents.gstData.businessName =
        reqBody?.documents?.gstData?.business_name;
    }

    const newAdmin: IAdmin = (
      await Admin.create(upAdminFields)
    ).toObject<IAdmin>();
    newAdmin.generatedPassword = password;

    Logger.info('<Service>:<AdminService>:<Admin created successfully>');
    return newAdmin;
  }

  async uploadDocuments(userId: string, req: Request | any): Promise<any> {
    Logger.info('<Service>:<AdminService>:<Upload Document Images initiated>');

    const document: IAdmin = await Admin.findOne({
      _id: new Types.ObjectId(userId)
    });
    if (_.isEmpty(document)) {
      throw new Error('User does not exist');
    }
    // Logger.debug(`${document} document`);
    const files: Array<any> = req.files;

    const documentImageList: Partial<IDocumentImageList> | any =
      document.documentImageList || {
        panFrontView: {},
        gstView: {},
        aadhaarFrontView: {},
        aadhaarBackView: {}
      };

    if (!files) {
      throw new Error('Files not found');
    }
    for (const file of files) {
      const fileName:
        | 'panFrontView'
        | 'gstView'
        | 'aadhaarFrontView'
        | 'aadhaarBackView' = file.originalname?.split('.')[0];
      const { key, url } = await this.s3Client.uploadFile(
        userId,
        fileName,
        file.buffer
      );
      documentImageList[fileName] = { key, docURL: url };
    }

    Logger.info(`<Service>:<AdminService>:<Upload all images - successful>`);

    const res = await Admin.findOneAndUpdate(
      { _id: userId },
      { $set: { documentImageList } },
      {
        returnDocument: 'after',
        projection: { 'verificationDetails.verifyObj': 0 }
      }
    );
    return res;
  }

  async updateUser(reqBody: any, userName: string): Promise<any> {
    const user = await this.getAdminUserByUserName(userName);
    if (!user) {
      Logger.error('<Service>:<AdminService>:<Admin User not found>');
      throw new Error('Admin user not found');
    }
    // const updatedUser = { ...user, reqBody };
    const query: any = {};
    query.userName = reqBody.userName;

    if (reqBody.lastModifyResult) {
      reqBody.updateCount = String(
        reqBody.updateCount ? Number(reqBody.updateCount) + 1 : 1
      );
      reqBody.status = 'DISABLED';
    }
    if (reqBody?.documents?.gstData?.gstin) {
      reqBody.documents.gstData.businessName =
        reqBody?.documents?.gstData?.business_name;
    }
    Logger.debug(`${query.updateCount},${reqBody.userName}, ${reqBody}`);
    const res = await Admin.findOneAndUpdate(query, reqBody, {
      returnDocument: 'after',
      projection: { 'verificationDetails.verifyObj': 0 }
    });
    return res;
  }

  async uploadAdminImage(userId: string, req: Request | any): Promise<any> {
    Logger.info('<Service>:<AdminService>:<Into the upload photo >');
    const file = req.file;
    if (!file) {
      throw new Error('File does not exist');
    }

    const admin: IAdmin = await Admin.findOne({ userName: userId })?.lean();

    if (_.isEmpty(admin)) {
      throw new Error('User does not exist');
    }
    const { key, url } = await this.s3Client.uploadFile(
      userId,
      'profile',
      file.buffer
    );
    const companyLogo = { key, url };
    const res = await Admin.findOneAndUpdate(
      { userName: userId },
      { $set: { companyLogo } },
      { returnDocument: 'after' }
    );
    return res;
  }

  async login(
    userName: string,
    password: string
  ): Promise<{ user: IAdmin; token: string }> {
    // const admin: IAdmin = await Admin.findOne({ userName })?.lean();
    const query = {
      userName: userName
    };
    const admin: IAdmin[] = await Admin.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: 'admin_users',
          localField: 'oemId',
          foreignField: 'userName',
          as: 'employeeCompanyDetails'
        }
      }
    ]);

    if (admin) {
      Logger.info('<Service>:<AdminService>:<Admin present in DB>');
      if (!(await bcrypt.compare(password, admin[0].password))) {
        throw new Error('Password validation failed');
      }
      Logger.info(
        '<Service>:<AdminService>:<Admin password validated successfully>'
      );
      if (admin[0].isFirstTimeLoggedIn) {
        await Admin.findOneAndUpdate(
          { _id: admin[0]._id },
          { $set: { isFirstTimeLoggedIn: false } }
        );
      }
    }
    const payload: Payload = {
      userId: admin[0].userName,
      role: admin[0].role
    };
    const token = await generateToken(payload);
    delete admin[0].password;

    return { user: admin[0], token };
  }

  async getAll(roleBase: string, oemId: string): Promise<IAdmin[]> {
    const query = {
      role: roleBase,
      oemId: oemId
    };
    if (!roleBase) {
      delete query['role'];
    }
    if (!oemId) {
      delete query['oemId'];
    }
    const admin: IAdmin[] = await Admin.find(query);

    return admin;
  }

  async getAdminUserByUserName(userName: string): Promise<IAdmin> {
    const query = {
      userName: userName
    };

    const adminUsers: IAdmin[] = await Admin.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: 'admin_users',
          localField: 'oemId',
          foreignField: 'userName',
          as: 'employeeCompanyDetails'
        }
      }
    ]);

    if (_.isEmpty(adminUsers)) {
      throw new Error('User does not exist');
    }

    // Assuming there's only one admin user in the result, get the first element
    const admin = adminUsers[0];
    delete admin.password;

    return admin;
  }

  async updatePassword(userName: string, password: string): Promise<any> {
    const admin: IAdmin = await Admin.findOne({ userName })?.lean();
    if (_.isEmpty(admin)) {
      throw new Error('User does not exist');
    }
    const updatedPassword = await this.encryptPassword(password);
    await Admin.findOneAndUpdate(
      { _id: admin._id },
      { $set: { password: updatedPassword } }
    );
    return true;
  }

  async updateUserStatus(reqBody: {
    userName: string;
    status: string;
  }): Promise<any> {
    Logger.info('<Service>:<UserService>:<Update user status >');

    const admin: IAdmin = await Admin.findOneAndUpdate(
      {
        userName: reqBody?.userName
      },
      { $set: { status: reqBody.status } },
      { returnDocument: 'after' }
    );

    return admin;
  }

  async updateUserAccessStatus(reqBody: {
    employeeId: string;
    userName: string;
    accessListKey: string;
    accessListEntry: string;
    accessListValue: boolean;
  }): Promise<any> {
    Logger.info('<Service>:<UserService>:<Update user status >');

    const {
      employeeId,
      userName,
      accessListKey,
      accessListEntry,
      accessListValue
    } = reqBody;
    let admin: IAdmin;
    admin = await Admin.findOne({ userName });
    const result: IAdmin = await Admin.findOneAndUpdate(
      {
        userName: reqBody?.userName
      },
      {
        $set: {
          [`accessList.${accessListKey}.${accessListEntry}`]: accessListValue
        }
      },
      { returnDocument: 'after' }
    );

    return {
      message: `Access User Status has updated`
    };
  }

  private async encryptPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    return hashed;
  }

  async initiateB2BPartnersVerification(
    payload: VerifyB2BPartnersRequest,
    role?: string
  ) {
    Logger.info('<Service>:<AdminService>:<Initiate Verifying user business>');
    // validate the store from user phone number and user id
    let verifyResult: any = {};
    const displayFields: any = {};

    if (role === AdminRole.ADMIN) {
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
    throw new Error('Invalid and unauthenticated request');
  }

  async searchAndFilterPaginated(searchReqBody: {
    pageNo: number;
    pageSize: number;
    storeId: string;
  }): Promise<IAdmin[]> {
    Logger.info(
      '<Service>:<AdminService>:<Search and Filter distributors partners service initiated>'
    );

    const { storeId } = searchReqBody;
    let store: IStore;
    if (storeId) {
      store = await Store.findOne({ storeId }, { verificationDetails: 0 });
    }
    if (!store) {
      Logger.error('<Service>:<ProductService>:< store id not found>');
      throw new Error('Store not found');
    }
    const query = {
      // 'contactInfo.geoLocation': {
      //   $near: {
      //     $geometry: { type: 'Point', coordinates: searchReqBody.coordinates }
      //   }
      // },
      'category.name': {
        $in: store.basicInfo.category.map((category) => category.name)
      },
      'subCategory.name': {
        $in: store.basicInfo.subCategory.map((subCategory) => subCategory.name)
      },
      companyType: 'Distributer',
      status: 'ACTIVE'
    };
    if (!store.basicInfo.category.map((category) => category.name)) {
      delete query['category.name'];
    }
    if (!store.basicInfo.category.map((category) => category.name)) {
      delete query['subCategory.name'];
    }
    Logger.debug(query);

    let distributedPartners: any = await Admin.aggregate([
      // {
      //   $geoNear: {
      //     near: {
      //       type: 'Point',
      //       coordinates: searchReqBody.coordinates as [number, number]
      //     },
      //     key: 'contactInfo.geoLocation',
      //     spherical: true,
      //     query: query,
      //     distanceField: 'contactInfo.distance',
      //     distanceMultiplier: 0.001
      //   }
      // },
      {
        $match: query
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

    if (distributedPartners && Array.isArray(distributedPartners)) {
      distributedPartners = await Promise.all(
        distributedPartners.map(async (distributedPartners) => {
          const updatedDistributedPartners = { ...distributedPartners };
          updatedDistributedPartners.overAllRating =
            await this.getOverallRatings(updatedDistributedPartners.userName);
          return updatedDistributedPartners;
        })
      );
    }
    return distributedPartners;
  }

  async addReview(
    distributedPartersReview: DistributedPartnersReviewRequest
  ): Promise<DistributedPartnersReviewRequest> {
    Logger.info('<Service>:<StoreService>:<Add Store Ratings initiate>');
    let store: IStore;
    if (distributedPartersReview?.storeId) {
      store = await Store.findOne(
        { storeId: distributedPartersReview.storeId },
        { verificationDetails: 0 }
      )?.lean();
    }
    if (!distributedPartersReview?.storeId) {
      throw new Error('Store not found');
    }
    const newDistributedPartnersReview = new DistributorPartnersReview(
      distributedPartersReview
    );
    newDistributedPartnersReview.ownerName = store?.basicInfo?.ownerName || '';
    await newDistributedPartnersReview.save();
    Logger.info(
      '<Service>:<AdminService>:<Distributors Partners Ratings added successfully>'
    );
    return newDistributedPartnersReview;
  }

  async getOverallRatings(
    userName: string
  ): Promise<OverallStoreRatingResponse> {
    Logger.info('<Service>:<AdminService>:<Get Overall Ratings initiate>');
    const distributorPartnersReviews = await DistributorPartnersReview.find({
      userName
    });
    if (distributorPartnersReviews.length === 0) {
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

    distributorPartnersReviews.forEach(({ rating, review }) => {
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
        (allRatings[key] * 100) / distributorPartnersReviews.length
      );
    }

    const averageRating = Number(
      ratingsCount / distributorPartnersReviews.length
    ).toPrecision(2);
    Logger.info(
      '<Service>:<AdminService>:<Get Overall Ratings performed successfully>'
    );
    return {
      allRatings,
      averageRating,
      totalRatings,
      totalReviews
    };
  }

  async getReviews(
    userName: string,
    pageNo?: number,
    pageSize?: number
  ): Promise<any[]> {
    Logger.info('<Service>:<StoreService>:<Get Store Ratings initiate>');
    const storeReviews = await DistributorPartnersReview.find({ userName })
      .skip(pageNo * pageSize)
      .limit(pageSize)
      .lean();
    Logger.info(
      '<Service>:<StoreService>:<Get Ratings performed successfully>'
    );
    if (storeReviews.length === 0 && !pageNo) {
      return [
        {
          ownerName: 'Service Plug',
          userName: 'SERVICEPLUG',
          rating: 5,
          review:
            'Thank you for onboarding with us. May you have a wonderful experience.'
        }
      ];
    } else {
      return storeReviews;
    }
  }

  async getById(req: { userName: string }, role?: string): Promise<IAdmin[]> {
    Logger.info(
      '<Service>:<AdminService>:<Get distributor partners by userName service initiated>'
    );
    const query: any = {};
    query.userName = req.userName;
    const distributorPartnersResponse = Admin.aggregate([
      {
        $match: query
      }
    ]);
    return distributorPartnersResponse;
  }

  async createContactUs(contactDetail: IContactUs): Promise<any> {
    Logger.info('<Service>:<AdminService>: <creating new contact>');
    const newContactDetail = await ContactUsModel.create(contactDetail);
    Logger.info('<Service>:<AdminService>:<contact created successfully>');
    return newContactDetail;
  }

  async resetPassword(userName: string): Promise<any> {
    Logger.info(
      '<Service>:<SPEmployeeService>:<Delete employee by Id service initiated>'
    );
    const query: any = {};
    query.userName = userName;
    console.log(query, 'dlfme');

    const oemUserDetails: IAdmin = await Admin.findOne({
      userName
    });

    // const password = secureRandomPassword.randomPassword();

    const password = secureRandomPassword.randomPassword({
      characters: [
        { characters: secureRandomPassword.upper, exactly: 3 },
        { characters: secureRandomPassword.symbols, exactly: 3 },
        { characters: secureRandomPassword.lower, exactly: 4 },
        { characters: secureRandomPassword.digits, exactly: 2 }
      ]
    });
    const updatedPassword = await this.encryptPassword(password);
    const res = await Admin.findOneAndUpdate(
      { userName: userName },
      {
        $set: {
          password: updatedPassword,
          generatedPassword: password,
          isFirstTimeLoggedIn: true
        }
      },
      { returnDocument: 'after' }
    );
    const templateData = {
      name: oemUserDetails?.ownerName,
      userName: oemUserDetails?.userName,
      password: password
    };

    if (!_.isEmpty(oemUserDetails?.contactInfo?.email)) {
      const data = {
        to: oemUserDetails?.contactInfo?.email,
        templateData: templateData,
        templateName: 'EmployeeResetPassword'
      };
      const sqsMessage = await this.sqsService.createMessage(
        SQSEvent.EMAIL_NOTIFICATION,
        data
      );
      console.log(sqsMessage, 'Message');
      // sendEmail(
      //   templateData,
      //   oemUserDetails?.contactInfo?.email,
      //   'support@serviceplug.in',
      //   'EmployeeResetPassword'
      // );
    }
    return 'Email sent';
  }

  async sellerRegister(reqBody: any): Promise<any> {
    Logger.info('<Service>:<AdminService>:<Create new seller >');

    let newSeller: any = reqBody;
    newSeller = await Seller.create(newSeller);
    const templateData = {
      name: newSeller?.userName,
      phoneNumber: newSeller?.phoneNumber,
      email: newSeller?.email,
      state: newSeller?.state,
      city: newSeller?.city,
      comment: newSeller?.comment
    };
    if (!_.isEmpty(newSeller?.email)) {
      const data = {
        to: newSeller?.email,
        templateData: templateData,
        templateName: 'NewSellerOnboarded'
      };
      const sqsMessage = await this.sqsService.createMessage(
        SQSEvent.EMAIL_NOTIFICATION,
        data
      );
      console.log(sqsMessage, 'Message');
      // sendEmail(
      //   templateData,
      //   newSeller?.email,
      //   'support@serviceplug.in',
      //   'NewSellerOnboarded'
      // );
    }
    return newSeller;
  }

  async createVideo(
    marketingLst?: any,
    oemId?: string,
    role?: string,
    userName?: string
  ) {
    Logger.info(
      '<Service>:<AdminService>:<create all video service initiated>'
    );
    const query = marketingLst;
    if (role === AdminRole.OEM) {
      query.employeeUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.employeeUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['employeeUserName'];
    }
    const result = await Marketing.create(query);
    return result;
  }

  async updateMarketingVideos(
    fileID: string,
    req: Request | any
  ): Promise<any> {
    Logger.info('<Service>:<VehicleService>:<Upload Vehicles initiated>');
    const marketingInfo = await Marketing.findOne(
      { _id: fileID },
      { verificationDetails: 0 }
    );
    if (_.isEmpty(marketingInfo)) {
      throw new Error('Fiile does not exist');
    }

    const files: any = req.files;

    if (!files) {
      throw new Error('Files not found');
    }
    const videoList: any = [];

    if (marketingInfo.fileType === 'video') {
      for (const file of files) {
        const fileName = file.originalname;
        const { key, url } = await this.s3Client.uploadVideo(
          fileID,
          fileName,
          file.buffer
        );
        videoList.push({ key, docURL: url });
      }
    }

    if (marketingInfo.fileType === 'image') {
      for (const file of files) {
        const fileName = file.originalname;
        const { key, url } = await this.s3Client.uploadFile(
          fileID,
          fileName,
          file.buffer
        );
        videoList.push({ key, docURL: url });
      }
    }

    const fileUrl = videoList[0];

    const res = await Marketing.findOneAndUpdate(
      { _id: fileID },
      { $set: { fileUrl } },
      {
        returnDocument: 'after',
        projection: { 'verificationDetails.verifyObj': 0 }
      }
    );
    return res;
  }

  async getAllCount(
    searchQuery?: string,
    state?: string,
    city?: string,
    selectType?: string,
    userName?: string,
    role?: string,
    oemId?: string,
    employeeId?: string,
    profileStatus?: string
  ) {
    Logger.info('<Service>:<AdminService>:<Get all video>');
    const query: any = {
      'state.name': { $in: [state] },
      'city.name': { $in: [city] },
      selectType,
      employeeId
    };

    const query2: any = { status: profileStatus };

    if (!profileStatus) {
      delete query2['status'];
    }
    if (!employeeId) {
      delete query['employeeId'];
    }
    if (!state) {
      delete query['state.name'];
    }
    if (!city) {
      delete query['city.name'];
    }
    if (!selectType) {
      delete query['selectType'];
    }
    if (searchQuery) {
      query.$or = [
        { storeId: searchQuery },
        { oemUserName: searchQuery },
        { phoneNumber: searchQuery }
      ];
    }
    if (role === AdminRole.OEM) {
      query.employeeUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.employeeUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['employeeUserName'];
    }
    // console.log(query, userName, 'queryyyyyyyyyyyy');
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const marketingResponse: any = await Marketing.aggregate([
      {
        $match: query
      },
      {
        $set: {
          status: {
            $cond: {
              if: { $eq: ['$endDate', currentDate] },
              then: 'ENABLED',
              else: {
                $cond: {
                  if: { $lt: ['$endDate', currentDate] },
                  then: 'DISABLED',
                  else: 'ENABLED'
                }
              }
            }
          }
        }
      },
      { $match: { status: profileStatus } },
      { $project: { status: 1 } }
    ]);
    const result = {
      count: marketingResponse?.length || 0
    };
    return result;
  }

  async getPaginatedAll(
    pageNo?: number,
    pageSize?: number,
    searchQuery?: string,
    state?: string,
    city?: string,
    selectType?: string,
    userName?: string,
    role?: string,
    oemId?: string,
    employeeId?: string,
    profileStatus?: string
  ): Promise<any> {
    Logger.info('<Service>:<AdminService>:<Get all video>');
    const query: any = {
      'state.name': { $in: [state] },
      'city.name': { $in: [city] },
      selectType,
      employeeId
    };

    const query2: any = { status: profileStatus };

    if (!profileStatus) {
      delete query2['status'];
    }
    if (!employeeId) {
      delete query['employeeId'];
    }
    if (!state) {
      delete query['state.name'];
    }
    if (!city) {
      delete query['city.name'];
    }
    if (!selectType) {
      delete query['selectType'];
    }
    if (searchQuery) {
      query.$or = [
        { storeId: searchQuery },
        { oemUserName: searchQuery },
        { phoneNumber: searchQuery }
      ];
    }

    if (role === AdminRole.OEM) {
      query.employeeUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.employeeUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['employeeUserName'];
    }
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const marketingResponse = await Marketing.aggregate([
      {
        $match: query
      },
      {
        $set: {
          status: {
            $cond: {
              if: { $eq: ['$endDate', currentDate] },
              then: 'ENABLED',
              else: {
                $cond: {
                  if: { $lt: ['$endDate', currentDate] },
                  then: 'DISABLED',
                  else: 'ENABLED'
                }
              }
            }
          }
        }
      },
      { $match: { status: profileStatus } },
      { $sort: { createdAt: -1 } },
      {
        $skip: pageNo * pageSize
      },
      {
        $limit: pageSize
      }
    ]);
    return marketingResponse;
  }

  async deleteVideoUpload(marketingId: string): Promise<any> {
    Logger.info(
      '<Service>:<AdminService>:<Delete Marketing by Id service initiated>'
    );
    const query: any = {};
    query._id = marketingId;
    const res = await Marketing.findOneAndDelete(query);
    return res;
  }

  async getVideoUploadDetails(marketingID: string): Promise<any> {
    Logger.info('<Service>:<adminService>:<get marketing initiated>');

    const jsonResult = await Marketing.findOne({
      _id: marketingID
    })?.lean();

    if (_.isEmpty(jsonResult)) {
      throw new Error('vehicle does not exist');
    }
    Logger.info('<Service>:<adminService>:<Upload marketing successful>');

    return jsonResult;
  }

  async updateVideoUpload(reqBody: any, marketingId: string): Promise<any> {
    Logger.info('<Service>:<adminService>:<Update marketing details >');
    const jsonResult = await Marketing.findOne({
      _id: marketingId
    })?.lean();
    if (_.isEmpty(jsonResult)) {
      throw new Error('marketing does not exist');
    }
    console.log(jsonResult, 'flnjr');
    const query: any = {};
    query._id = reqBody._id;
    const res = await Marketing.findOneAndUpdate(query, reqBody, {
      returnDocument: 'after',
      projection: { 'verificationDetails.verifyObj': 0 }
    });
    return res;
  }

  async getAllPaginated(
    pageNo?: number,
    pageSize?: number,
    state?: string,
    city?: string,
    category?: string,
    subCategory?: string,
    brand?: string,
    storeId?: string,
    oemUserName?: string,
    platform?: string,
    coordinates?: number[]
  ): Promise<any> {
    Logger.info('<Service>:<AdminService>:<Get all video>');
    const query: any = {
      userType: platform
      // postType: 'Files'
    };
    const queryTwo: any = {};
    const locationQuery: any = {};

    if (!platform) {
      delete query['userType'];
    }

    let stateFilter: string | null = null;
    let cityFilter: string | null = null;

    if (!isEmpty(storeId)) {
      const store = await this.storeService.getById({
        storeId: storeId,
        lat: '',
        long: ''
      });

      const categories = store[0]?.basicInfo?.category;
      const categoryNames = categories.map((sub) => sub.name);
      const subCategories = store[0]?.basicInfo?.subCategory;
      const subCategoryNames = subCategories.map((sub) => sub.name);
      const brands = store[0]?.basicInfo?.brand;
      const brandNames = brands.map((sub) => sub.name);
      queryTwo['category.name'] = { $in: categoryNames };
      queryTwo['subCategory.name'] = { $in: subCategoryNames };
      queryTwo['brand.name'] = { $in: brandNames };
      locationQuery['geoLocation'] =
        store[0]?.contactInfo?.geoLocation?.coordinates;

      queryTwo['state.name'] = { $in: [store[0]?.contactInfo?.state || null] };
      queryTwo['city.name'] = { $in: [store[0]?.contactInfo?.city || null] };
      stateFilter = store[0]?.contactInfo?.state || null;
      console.log(stateFilter, 'Dekm');
      cityFilter = store[0]?.contactInfo?.city || null;
    }

    if (!isEmpty(oemUserName)) {
      const userName = oemUserName;
      const oemUser: any = await this.getAdminUserByUserName(userName);
      const categories = oemUser[0]?.category;
      const categoryNames = categories.map((sub: any) => sub.name);
      const subCategories = oemUser[0]?.subCategory;
      const subCategoryNames = subCategories.map((sub: any) => sub.name);
      const brands = oemUser[0]?.brand;
      const brandNames = brands.map((sub: any) => sub.name);
      queryTwo['category.name'] = { $in: categoryNames };
      queryTwo['subCategory.name'] = { $in: subCategoryNames };
      queryTwo['brand.name'] = { $in: brandNames };
      queryTwo['state.name'] = {
        $in: [oemUser[0]?.contactInfo?.state || null]
      };
      queryTwo['city.name'] = { $in: [oemUser[0]?.contactInfo?.city || null] };
      stateFilter = oemUser[0]?.contactInfo?.state || null;
      console.log(stateFilter, 'Dekm');
      cityFilter = oemUser[0]?.contactInfo?.city || null;
      locationQuery['geoLocation'] =
        oemUser[0]?.contactInfo?.geoLocation?.coordinates;
    }

    if (!storeId && !oemUserName) {
      queryTwo['state.name'] = { $in: [state] };
      queryTwo['city.name'] = { $in: [city] };
      locationQuery['geoLocation'] = coordinates;
      stateFilter = state || null;
      console.log(stateFilter, 'Dekm');
      cityFilter = city || null;

      if (!state) delete queryTwo['state.name'];
      if (!city) delete queryTwo['city.name'];
      if (!coordinates) delete locationQuery['geoLocation'];
    }

    const matchStage: any = { ...queryTwo };
    const matchLocation: any = {};
    if (stateFilter && cityFilter) {
      matchLocation.$expr = {
        $and: [
          {
            $or: [
              { $eq: [{ $size: '$state' }, 0] },
              { $in: [stateFilter, '$state.name'] }
            ]
          },
          {
            $or: [
              { $eq: [{ $size: '$city' }, 0] },
              { $in: [cityFilter, '$city.name'] }
            ]
          }
        ]
      };
    } else if (stateFilter) {
      matchLocation.$expr = {
        $or: [
          { $eq: [{ $size: '$state' }, 0] },
          { $in: [stateFilter, '$state.name'] }
        ]
      };
    }
    console.log(
      query,
      matchStage,
      locationQuery,
      matchStage['category.name'],
      matchStage['subCategory.name'],
      matchStage['brand.name'],
      matchStage['state.name'],
      matchStage['city.name'],

      'matchStage'
    );

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const marketingResponse = await Marketing.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: locationQuery.geoLocation
          },
          key: 'geoLocation',
          spherical: true,
          query: query,
          distanceField: 'geoLocation.distance',
          distanceMultiplier: 0.001
        }
      },
      {
        $lookup: {
          from: 'stores',
          localField: 'storeId',
          foreignField: 'storeId',
          as: 'storeInfo'
        }
      },
      { $unwind: { path: '$storeInfo', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'admin_users',
          localField: 'oemUserName',
          foreignField: 'userName',
          as: 'partnerDetail'
        }
      },
      { $unwind: { path: '$partnerDetail', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          businessName: {
            $cond: {
              if: {
                $ne: [
                  { $ifNull: ['$storeInfo.basicInfo.businessName', ''] },
                  ''
                ]
              },
              then: '$storeInfo.basicInfo.businessName',
              else: {
                $cond: {
                  if: {
                    $ne: [{ $ifNull: ['$partnerDetail.businessName', ''] }, '']
                  },
                  then: '$partnerDetail.businessName',
                  else: null
                }
              }
            }
          },
          businessImage: {
            $cond: {
              if: {
                $ne: [
                  { $ifNull: ['$storeInfo.documents.profile.docURL', ''] },
                  ''
                ]
              },
              then: '$storeInfo.documents.profile.docURL',
              else: {
                $cond: {
                  if: {
                    $ne: [
                      {
                        $ifNull: [
                          '$partnerDetail.documentImageList.logo.docURL',
                          ''
                        ]
                      },
                      ''
                    ]
                  },
                  then: '$partnerDetail.documentImageList.logo.docURL',
                  else: null
                }
              }
            }
          }
        }
      },
      { $project: { storeInfo: 0, partnerDetail: 0 } },
      {
        $addFields: {
          hasCategory: { $gt: [{ $size: '$category' }, 0] },
          hasSubCategory: { $gt: [{ $size: '$subCategory' }, 0] },
          hasBrand: { $gt: [{ $size: '$brand' }, 0] },
          hasState: { $gt: [{ $size: '$state' }, 0] },
          hasCity: { $gt: [{ $size: '$city' }, 0] },
          isShow: {
            $cond: {
              if: { $eq: ['$distance', '$geoLocation.distance'] },
              then: true,
              else: {
                $cond: {
                  if: { $lt: ['$distance', '$geoLocation.distance'] },
                  then: false,
                  else: true
                }
              }
            }
          },
          status: {
            $cond: {
              if: { $eq: ['$endDate', currentDate] },
              then: 'ENABLED',
              else: {
                $cond: {
                  if: { $lt: ['$endDate', currentDate] },
                  then: 'DISABLED',
                  else: 'ENABLED'
                }
              }
            }
          }
        }
      },
      {
        $match: {
          status: 'ENABLED',
          isShow: true,
          $or: [
            {
              $and: [
                { hasCategory: true },
                { category: { $exists: true, $ne: [] } },
                { 'category.name': matchStage['category.name'] },
                { hasSubCategory: false },
                { hasBrand: false }
              ]
            },
            {
              $and: [
                { hasCategory: true },
                { category: { $exists: true, $ne: [] } },
                { 'category.name': matchStage['category.name'] },
                { hasSubCategory: true },
                { subCategory: { $exists: true, $ne: [] } },
                { 'subCategory.name': matchStage['subCategory.name'] },
                { hasBrand: false }
              ]
            },
            {
              $and: [
                { hasCategory: true },
                { category: { $exists: true, $ne: [] } },
                { 'category.name': matchStage['category.name'] },
                { hasSubCategory: true },
                { subCategory: { $exists: true, $ne: [] } },
                { 'subCategory.name': matchStage['subCategory.name'] },
                { hasBrand: true },
                { brand: { $exists: true, $ne: [] } },
                { 'brand.name': matchStage['brand.name'] }
              ]
            },
            {
              $and: [
                { hasState: true },
                { state: { $exists: true, $ne: [] } },
                { 'state.name': matchStage['state.name'] },
                { hasCity: false }
              ]
            },
            {
              $and: [
                { hasState: true },
                { state: { $exists: true, $ne: [] } },
                { 'state.name': matchStage['state.name'] },
                { hasCity: true },
                { city: { $exists: true, $ne: [] } },
                { 'city.name': matchStage['city.name'] }
              ]
            },
            {
              $and: [
                { hasCategory: false },
                { hasSubCategory: false },
                { hasBrand: false },
                { hasState: false },
                { hasCity: false }
              ]
            }
          ]
        }
      },
      {
        $match: matchLocation
      },
      { $sort: { createdAt: -1 } },
      {
        $skip: pageNo * pageSize
      },
      {
        $limit: pageSize
      }
    ]);
    // const fileUrlResponse = await Marketing.aggregate([
    //   {
    //     $match: { postType: 'YoutubeUrl', userType: platform }
    //   },
    //   {
    //     $addFields: {
    //       hasCategory: { $gt: [{ $size: '$category' }, 0] },
    //       hasSubCategory: { $gt: [{ $size: '$subCategory' }, 0] },
    //       hasBrand: { $gt: [{ $size: '$brand' }, 0] },
    //       hasState: { $gt: [{ $size: '$state' }, 0] },
    //       hasCity: { $gt: [{ $size: '$city' }, 0] },
    //       status: {
    //         $cond: {
    //           if: { $eq: ['$endDate', currentDate] },
    //           then: 'ENABLED',
    //           else: {
    //             $cond: {
    //               if: { $lt: ['$endDate', currentDate] },
    //               then: 'DISABLED',
    //               else: 'ENABLED'
    //             }
    //           }
    //         }
    //       }
    //     }
    //   },
    //   {
    //     $match: {
    //       status: 'ENABLED',
    //       $or: [
    //         {
    //           $and: [
    //             { hasCategory: true },
    //             { category: { $exists: true, $ne: [] } },
    //             { 'category.name': matchStage['category.name'] }
    //           ]
    //         },
    //         {
    //           $and: [
    //             { hasSubCategory: true },
    //             { subCategory: { $exists: true, $ne: [] } },
    //             { 'subCategory.name': matchStage['subCategory.name'] }
    //           ]
    //         },
    //         {
    //           $and: [
    //             { hasBrand: true },
    //             { brand: { $exists: true, $ne: [] } },
    //             { 'brand.name': matchStage['brand.name'] }
    //           ]
    //         },
    //         {
    //           $and: [
    //             { hasState: true },
    //             { state: { $exists: true, $ne: [] } },
    //             { 'state.name': matchStage['state.name'] }
    //           ]
    //         },
    //         {
    //           $and: [
    //             { hasCity: true },
    //             { city: { $exists: true, $ne: [] } },
    //             { 'city.name': matchStage['city.name'] }
    //           ]
    //         },
    //         {
    //           $and: [
    //             { hasCategory: false },
    //             { hasSubCategory: false },
    //             { hasBrand: false },
    //             { hasState: false },
    //             { hasCity: false }
    //           ]
    //         }
    //       ]
    //     }
    //   },
    //   {
    //     $match: matchLocation
    //   },
    //   { $sort: { createdAt: -1 } },
    //   {
    //     $skip: pageNo * pageSize
    //   },
    //   {
    //     $limit: pageSize
    //   }
    // ]);

    // const finalData: any = [...fileUrlResponse, ...marketingResponse];
    // const result: any = finalData.sort((a: any, b: any) => {
    //   const dateA = new Date(a.createdAt).getTime();
    //   const dateB = new Date(b.createdAt).getTime();
    //   if (isNaN(dateA) || isNaN(dateB)) {
    //     return 0;
    //   }
    //   return dateB - dateA;
    // });
    return marketingResponse;
  }

  async getVideoUploadCount(
    userName?: string,
    role?: string,
    oemId?: string,
    searchQuery?: string,
    state?: string,
    city?: string,
    employeeId?: string,
    selectType?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<AdminService>:<Total Count Video service initiated>'
    );
    let query: any = {
      'state.name': { $in: [state] },
      'city.name': { $in: [city] },
      selectType,
      employeeId
    };

    if (!employeeId) {
      delete query['employeeId'];
    }
    if (!state) {
      delete query['state.name'];
    }
    if (!city) {
      delete query['city.name'];
    }
    if (!selectType) {
      delete query['selectType'];
    }
    if (searchQuery) {
      query.$or = [
        { storeId: searchQuery },
        { oemUserName: searchQuery },
        { phoneNumber: searchQuery }
      ];
    }

    if (role === AdminRole.OEM) {
      query.employeeUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.employeeUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['employeeUserName'];
    }
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const totalCounts: any = await Marketing.aggregate([
      {
        $match: query
      },
      {
        $set: {
          status: {
            $cond: {
              if: { $eq: ['$endDate', currentDate] },
              then: 'ENABLED',
              else: {
                $cond: {
                  if: { $lt: ['$endDate', currentDate] },
                  then: 'DISABLED',
                  else: 'ENABLED'
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$status',
          initialCount: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          total: '$initialCount',
          _id: 0
        }
      }
    ]);
    return totalCounts;
  }

  async updateVideoStatus(reqBody: {
    marketingId: string;
    profileStatus: string;
    rejectionReason: string;
  }): Promise<any> {
    Logger.info('<Service>:<AdminService>:<Update video status >');

    const finalResult: any = await Marketing.findOneAndUpdate(
      {
        _id: new Types.ObjectId(reqBody.marketingId)
      },
      {
        $set: {
          profileStatus: reqBody.profileStatus,
          rejectionReason: reqBody.rejectionReason
        }
      },
      { returnDocument: 'after' }
    );

    return finalResult;
  }
}
