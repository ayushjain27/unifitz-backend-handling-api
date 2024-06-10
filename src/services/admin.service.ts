import { injectable } from 'inversify';
import bcrypt from 'bcryptjs';
import _ from 'lodash';
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
import { StaticIds } from './../models/StaticId';
import ContactUsModel, { IContactUs } from '../models/ContactUs';
import { permissions } from '../config/permissions';
import SPEmployee, { ISPEmployee } from '../models/SPEmployee';

@injectable()
export class AdminService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private surepassService = container.get<SurepassService>(
    TYPES.SurepassService
  );

  async create(reqBody: IAdmin): Promise<IAdmin> {
    const upAdminFields = Object.assign({}, reqBody) as IAdmin;

    // Update the password
    const password = secureRandomPassword.randomPassword();

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
    console.log(permissions.OEM, 'f;klmk');
    upAdminFields.accessList = permissions.OEM;
    console.log(upAdminFields, 'fw;elk');

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

  async updateUser(reqBody: IAdmin, userName: string): Promise<any> {
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
    const admin: IAdmin = await Admin.findOne({ userName })?.lean();

    if (admin) {
      Logger.info('<Service>:<AdminService>:<Admin present in DB>');
      if (!(await bcrypt.compare(password, admin.password))) {
        throw new Error('Password validation failed');
      }
      Logger.info(
        '<Service>:<AdminService>:<Admin password validated successfully>'
      );
      if (admin.isFirstTimeLoggedIn) {
        await Admin.findOneAndUpdate(
          { _id: admin._id },
          { $set: { isFirstTimeLoggedIn: false } }
        );
      }
    }
    const payload: Payload = {
      userId: admin.userName,
      role: admin.role
    };
    const token = await generateToken(payload);
    delete admin.password;

    return { user: admin, token };
  }

  async getAll(roleBase: string, oemId: string): Promise<IAdmin[]> {

    const query = {
      role : roleBase,
      oemId: oemId
    }
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
    const admin: IAdmin = await Admin.findOne({ userName })?.lean();

    if (_.isEmpty(admin)) {
      throw new Error('User does not exist');
    }
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
      let result: IAdmin = await Admin.findOneAndUpdate(
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
}
