/* eslint-disable no-console */
import NewVehicle, { INewVehicle, IDocuments } from '../models/NewVehicle';
import { Types } from 'mongoose';
import { injectable } from 'inversify';
import _ from 'lodash';
import Logger from '../config/winston';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';
import { AdminRole } from './../models/Admin';
import { S3Service } from './s3.service';
import { SurepassService } from './surepass.service';

@injectable()
export class NewVehicleInfoService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private surepassService = container.get<SurepassService>(
    TYPES.SurepassService
  );

  async create(vehicleStore: INewVehicle, userName?: string, role?: string) {
    Logger.info('<Service>:<VehicleService>: <Adding Vehicle intiiated>');

    const vehicleInfo = vehicleStore;
    if (role === AdminRole.OEM) {
      vehicleInfo.oemUserName = userName;
    }

    const vehicleDetails = await NewVehicle.create(vehicleInfo);

    Logger.info('<Service>:<VehicleService>:<Vehicle created successfully>');
    return vehicleDetails;
  }

  async updateVehicleImages(
    vehicleID: string,
    req: Request | any
  ): Promise<any> {
    Logger.info('<Service>:<VehicleService>:<Upload Vehicles initiated>');
    const vehicle = await NewVehicle.findOne(
      { _id: vehicleID },
      { verificationDetails: 0 }
    );
    if (_.isEmpty(vehicle)) {
      throw new Error('Vehicle does not exist');
    }

    const files: Array<any> = req.files;
    const documents: Partial<IDocuments> | any = vehicle.documents || {
      profile: {},
      vehicleImageList: {}
    };
    if (!files) {
      throw new Error('Files not found');
    }
    for (const file of files) {
      const fileName:
        | 'first'
        | 'second'
        | 'third'
        | 'fourth'
        | 'fifth'
        | 'profile' = file.originalname?.split('.')[0];
      const { key, url } = await this.s3Client.uploadFile(
        vehicleID,
        fileName,
        file.buffer
      );
      if (fileName === 'profile') {
        documents.profile = { key, docURL: url };
      } else {
        documents.storeImageList[fileName] = { key, docURL: url };
      }
    }
    const res = await NewVehicle.findOneAndUpdate(
      { _id: vehicleID },
      { $set: { documents } },
      {
        returnDocument: 'after',
        projection: { 'verificationDetails.verifyObj': 0 }
      }
    );
    return res;
  }

  async getAllVehicle(userName?: string, role?: string, oemId?: string) {
    const query: any = {};
    Logger.info('<Service>:<VehicleService>:<get Vehicles initiated>');

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }

    const vehicle = await NewVehicle.aggregate([{ $match: query }]);
    return vehicle;
  }

  async getById(vehicleID: string): Promise<any> {
    Logger.info('<Service>:<VehicleService>:<get vehicle initiated>');

    const vehicleResult = await NewVehicle.findOne({
      _id: vehicleID
    })?.lean();

    if (_.isEmpty(vehicleResult)) {
      throw new Error('vehicle does not exist');
    }
    Logger.info('<Service>:<vehicleService>:<Upload vehicle successful>');

    return vehicleResult;
  }

  async update(reqBody: any, vehicleId: string): Promise<any> {
    Logger.info('<Service>:<vehicleService>:<Update vehicle details >');
    const vehicleResult = await NewVehicle.findOne({
      _id: vehicleId
    })?.lean();
    if (_.isEmpty(vehicleResult)) {
      throw new Error('Vehicle does not exist');
    }
    console.log(vehicleResult, 'flnjr');
    const query: any = {};
    query._id = reqBody._id;
    const res = await NewVehicle.findOneAndUpdate(query, reqBody, {
      returnDocument: 'after',
      projection: { 'verificationDetails.verifyObj': 0 }
    });
    return res;
  }

  async delete(
    vehicleId: string,
    userName?: string,
    role?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<VehicleService>:<Delete Vehicle by Id service initiated>'
    );
    const query: any = {};
    query._id = vehicleId;
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }
    const res = await NewVehicle.findOneAndDelete(query);
    return res;
  }
}
