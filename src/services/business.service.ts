/* eslint-disable no-console */
import { injectable } from 'inversify';
import _ from 'lodash';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { S3Service } from './s3.service';
import BusinessModel, { IBusiness, BusinessStatus } from '../models/Business';

@injectable()
export class BusinessService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

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
    })?.lean();

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

    const businessResult = await BusinessModel.find()?.lean();

    return businessResult;
  }

  async getBusinessById(businessId: string): Promise<any> {
    Logger.info('<Service>:<BusinessService>:<get business initiated>');

    const businessResult: IBusiness = await BusinessModel.findOne({
      _id: businessId
    })?.lean();

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
    })?.lean();

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
}
