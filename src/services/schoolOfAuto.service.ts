/* eslint-disable no-console */
import { injectable } from 'inversify';
import _ from 'lodash';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { S3Service } from './s3.service';
import SchoolOfAutoModel, {
  ISchoolOfAuto,
  schoolOfAutoStatus
} from '../models/SchoolOfAuto';

@injectable()
export class SchoolOfAutoService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async create(businessRequest: ISchoolOfAuto): Promise<any> {
    Logger.info('<Service>:<SchoolOfAutoService>: <creating new auto service>');
    const newResult = await SchoolOfAutoModel.create(businessRequest);
    Logger.info(
      '<Service>:<SchoolOfAutoService>:<auto service created successfully>'
    );
    return newResult;
  }

  // async uploadImage(schoolOfAutoId: string, req: Request | any): Promise<any> {
  //   Logger.info('<Service>:<SchoolOfAutoService>:<Into the upload banner >');
  //   const file = req.file;
  //   if (!file) {
  //     throw new Error('File does not exist');
  //   }
  //   const businessResult: ISchoolOfAuto = await SchoolOfAutoModel.findOne({
  //     _id: new Types.ObjectId(schoolOfAutoId)
  //   })?.lean();

  //   if (_.isEmpty(businessResult)) {
  //     throw new Error('Business does not exist');
  //   }
  //   const { key, url } = await this.s3Client.uploadFile(
  //     schoolOfAutoId,
  //     'business',
  //     file.buffer
  //   );
  //   const imageUpload = { key, url };
  //   const businessDetails: any = {
  //     ...businessResult,
  //     businessImage: {
  //       ...imageUpload,
  //       docURL: url
  //     },
  //     status: schoolOfAutoStatus.ACTIVE,
  //     _id: new Types.ObjectId(schoolOfAutoId)
  //   };

  //   businessDetails.schoolOfAutoId = schoolOfAutoId;
  //   const res = await SchoolOfAutoModel.findOneAndUpdate(
  //     { _id: schoolOfAutoId },
  //     businessDetails,
  //     {
  //       returnDocument: 'after'
  //     }
  //   );
  //   return res;
  // }

  async getAll(): Promise<any> {
    Logger.info('<Service>:<SchoolOfAutoService>:<get auto service initiated>');

    const getAllResult = await SchoolOfAutoModel.find()?.lean();

    return getAllResult;
  }

  async getById(schoolOfAutoId: string): Promise<any> {
    Logger.info('<Service>:<SchoolOfAutoService>:<get auto service initiated>');

    const getResult: ISchoolOfAuto = await SchoolOfAutoModel.findOne({
      _id: schoolOfAutoId
    })?.lean();

    if (_.isEmpty(getResult)) {
      throw new Error('School of auto service does not exist');
    }
    Logger.info(
      '<Service>:<SchoolOfAutoService>:<Upload auto service successful>'
    );

    return getResult;
  }

  async update(reqBody: ISchoolOfAuto, schoolOfAutoId: string): Promise<any> {
    Logger.info(
      '<Service>:<SchoolOfAutoService>:<Update auto service details >'
    );
    const updateResult: ISchoolOfAuto = await SchoolOfAutoModel.findOne({
      _id: schoolOfAutoId
    })?.lean();

    if (_.isEmpty(updateResult)) {
      throw new Error('School of auto service does not exist');
    }
    const query: any = {};
    query._id = reqBody._id;
    const res = await SchoolOfAutoModel.findOneAndUpdate(query, reqBody, {
      returnDocument: 'after',
      projection: { 'verificationDetails.verifyObj': 0 }
    });
    return res;
  }

  async delete(reqBody: { schoolOfAutoId: string }) {
    Logger.info('<Service>:<SchoolOfAutoService>:<Delete auto service >');

    // Delete the business from the s3
    // await this.s3Client.deleteFile(reqBody.imageKey);
    const res = await SchoolOfAutoModel.findOneAndDelete({
      _id: new Types.ObjectId(reqBody.schoolOfAutoId)
    });
    return res;
  }

  async updateStatus(reqBody: {
    schoolOfAutoId: string;
    status: string;
  }): Promise<any> {
    Logger.info(
      '<Service>:<SchoolOfAutoService>:<Update auto service status >'
    );

    const updateResult: ISchoolOfAuto =
      await SchoolOfAutoModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(reqBody.schoolOfAutoId)
        },
        { $set: { status: reqBody.status } },
        { returnDocument: 'after' }
      );

    return updateResult;
  }
}
