/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
/* eslint-disable no-console */
import { injectable } from 'inversify';
import _ from 'lodash';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { S3Service } from './s3.service';
import BusinessModel, { IBusiness, BusinessStatus } from '../models/Business';
import Store from '../models/Store';
import Customer from '../models/Customer';
import InterestedBusiness, {
  IInterestedBusiness
} from '../models/InterestedBusiness';
import { SQSEvent } from '../enum/sqsEvent.enum';
import { SQSService } from './sqs.service';

@injectable()
export class BusinessService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private sqsService = container.get<SQSService>(TYPES.SQSService);

  async create(businessRequest: IBusiness): Promise<any> {
    Logger.info(
      '<Service>:<BusinessService>: <business onboarding: creating new business>'
    );
    const newbusiness = await BusinessModel.create(businessRequest);
    Logger.info('<Service>:<BusinessService>:<business created successfully>');
    return newbusiness;
  }

  async uploadImage(businessId: string, req: Request | any): Promise<any> {
    Logger.info('<Service>:<BusinessService>:<Into the upload banner >');
    const file = req.file;
    if (!file) {
      throw new Error('File does not exist');
    }
    const businessResult: IBusiness = await BusinessModel.findOne({
      _id: new Types.ObjectId(businessId)
    });

    if (_.isEmpty(businessResult)) {
      throw new Error('Business does not exist');
    }
    const { key, url } = await this.s3Client.uploadFile(
      businessId,
      'business',
      file.buffer
    );
    const imageUpload = { key, url };
    const businessDetails: any = {
      ...businessResult,
      businessImage: {
        ...imageUpload,
        docURL: url
      },
      status: BusinessStatus.ACTIVE,
      _id: new Types.ObjectId(businessId)
    };

    businessDetails.businessId = businessId;
    const res = await BusinessModel.findOneAndUpdate(
      { _id: businessId },
      businessDetails,
      {
        returnDocument: 'after'
      }
    );
    return res;
  }

  async getAllBusiness(): Promise<any> {
    Logger.info('<Service>:<BusinessService>:<get business initiated>');

    const businessResult = await BusinessModel.find();

    return businessResult;
  }

  async getFilterBusiness(
    businessType: string,
    category: string,
    subCategory: string,
    brandName: string,
    storeId: string,
    customerId: string
  ): Promise<any> {
    Logger.info('<Service>:<BusinessService>:<get business initiated>');
    const query = {
      businessType,
      'category.name': category,
      'subCategory.name': subCategory,
      brandName,
      status: 'ACTIVE'
    };
    let businessResponse: any;

    if (!category) {
      delete query['category.name'];
    }
    if (!subCategory) {
      delete query['subCategory.name'];
    }
    if (!brandName) {
      delete query.brandName;
    }
    businessResponse = await BusinessModel.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: 'interestedbusinesses',
          let: { business_id: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$businessId', '$$business_id'] },
                    {
                      $or: [
                        { $eq: ['$storeId', storeId] },
                        { $eq: ['$customerId', customerId] }
                      ]
                    }
                  ]
                }
              }
            }
          ],
          as: 'interested'
        }
      }
    ]);

    // const businessResult = await BusinessModel.find(query);

    return businessResponse;
  }

  async getBusinessById(businessId: string): Promise<any> {
    Logger.info('<Service>:<BusinessService>:<get business initiated>');

    const businessResult: IBusiness = await BusinessModel.findOne({
      _id: businessId
    });

    if (_.isEmpty(businessResult)) {
      throw new Error('business does not exist');
    }
    Logger.info('<Service>:<BusinessService>:<Upload business successful>');

    return businessResult;
  }

  async updateBusiness(reqBody: IBusiness, businessId: string): Promise<any> {
    Logger.info('<Service>:<BusinessService>:<Update business details >');
    const businessResult: IBusiness = await BusinessModel.findOne({
      _id: businessId
    });

    if (_.isEmpty(businessResult)) {
      throw new Error('business does not exist');
    }
    const query: any = {};
    query._id = reqBody._id;
    const res = await BusinessModel.findOneAndUpdate(query, reqBody, {
      returnDocument: 'after',
      projection: { 'verificationDetails.verifyObj': 0 }
    });
    return res;
  }

  async deleteBusiness(reqBody: { imageKey: string; businessId: string }) {
    Logger.info('<Service>:<BusinessService>:<Delete business >');

    // Delete the business from the s3
    await this.s3Client.deleteFile(reqBody.imageKey);
    const res = await BusinessModel.findOneAndDelete({
      _id: new Types.ObjectId(reqBody.businessId)
    });
    return res;
  }

  async updateBusinessStatus(reqBody: {
    businessId: string;
    status: string;
  }): Promise<any> {
    Logger.info('<Service>:<BusinessService>:<Update business status >');

    const businessResult: IBusiness = await BusinessModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(reqBody.businessId)
      },
      { $set: { status: reqBody.status } },
      { returnDocument: 'after' }
    );

    return businessResult;
  }

  async addToInterest(reqBody: {
    storeId: string;
    customerId: string;
    businessId: string;
    isInterested: boolean;
  }): Promise<any> {
    Logger.info('<Service>:<EventService>:<Update event and offers interest >');

    const [store, customer, business] = await Promise.all([
      Store.findOne({ storeId: reqBody.storeId }, { verificationDetails: 0 }),
      Customer.findOne({ _id: new Types.ObjectId(reqBody.customerId) }),
      BusinessModel.findOne({
        _id: new Types.ObjectId(reqBody.businessId)
      })
    ]);
    let newInterest: IInterestedBusiness = reqBody;
    newInterest.userName = store?.basicInfo?.ownerName || customer?.fullName;
    newInterest.phoneNumber =
      store?.contactInfo?.phoneNumber?.primary || customer?.phoneNumber;
    newInterest.organizerName = business?.organizerName || '';
    newInterest.email = business?.email;
    newInterest = await InterestedBusiness.create(newInterest);
    const templateData = {
      name: store?.basicInfo?.ownerName || customer?.fullName,
      phoneNumber:
        store?.contactInfo?.phoneNumber?.primary || customer?.phoneNumber,
      email: store?.contactInfo?.email || customer?.email,
      organiserName: business?.organizerName
    };
    const templateDataUsers = {
      name: store?.basicInfo?.ownerName || customer?.fullName,
      phoneNumber:
        store?.contactInfo?.phoneNumber?.primary || customer?.phoneNumber,
      email: store?.contactInfo?.email || customer?.email,
      eventOfferName: 'new business opportunities',
      organiserName: business?.organizerName
    };
    if (!_.isEmpty(business?.email)) {
      const data = {
        to: business?.email,
        templateData: templateData,
        templateName: 'EventsOfferscheme'
      };
      const sqsMessage = await this.sqsService.createMessage(
        SQSEvent.EMAIL_NOTIFICATION,
        data
      );
    }
    if (!_.isEmpty(store?.contactInfo?.email) || !_.isEmpty(customer?.email)) {
      const data = {
        to: store?.contactInfo?.email || customer?.email,
        templateData: templateData,
        templateName: 'EventsOffersUsersScheme'
      };
      const sqsMessage = await this.sqsService.createMessage(
        SQSEvent.EMAIL_NOTIFICATION,
        data
      );
    }
    return newInterest;
  }
}
