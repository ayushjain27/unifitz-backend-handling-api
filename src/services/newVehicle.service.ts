/* eslint-disable no-console */
import NewVehicle, { INewVehicle } from '../models/NewVehicle';
import { Types } from 'mongoose';
import { injectable } from 'inversify';
import _ from 'lodash';
import Logger from '../config/winston';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';
import { AdminRole } from './../models/Admin';
import TestDrive from './../models/VehicleTestDrive';
import { S3Service } from './s3.service';
import { SurepassService } from './surepass.service';
import { sendEmail } from '../utils/common';

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

  // async updateVehicleImages(
  //   vehicleID: string,
  //   req: Request | any
  // ): Promise<any> {
  //   Logger.info('<Service>:<VehicleService>:<Upload Vehicles initiated>');
  //   const vehicle = await NewVehicle.findOne(
  //     { _id: vehicleID },
  //     { verificationDetails: 0 }
  //   );
  //   if (_.isEmpty(vehicle)) {
  //     throw new Error('Vehicle does not exist');
  //   }

  //   const files: Array<any> = req.files;
  //   const documents: Partial<IDocuments> | any = vehicle.documents || {
  //     profile: {},
  //     vehicleImageList: {}
  //   };
  //   if (!files) {
  //     throw new Error('Files not found');
  //   }
  //   for (const file of files) {
  //     const fileName:
  //       | 'first'
  //       | 'second'
  //       | 'third'
  //       | 'fourth'
  //       | 'fifth'
  //       | 'profile' = file.originalname?.split('.')[0];
  //     const { key, url } = await this.s3Client.uploadFile(
  //       vehicleID,
  //       fileName,
  //       file.buffer
  //     );
  //     if (fileName === 'profile') {
  //       documents.profile = { key, docURL: url };
  //     } else {
  //       documents.storeImageList[fileName] = { key, docURL: url };
  //     }
  //   }
  //   const res = await NewVehicle.findOneAndUpdate(
  //     { _id: vehicleID },
  //     { $set: { documents } },
  //     {
  //       returnDocument: 'after',
  //       projection: { 'verificationDetails.verifyObj': 0 }
  //     }
  //   );
  //   return res;
  // }

  async uploadNewVehicleImages(
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
    if (!files) {
      throw new Error('Files not found');
    }
    const ImageList: any = [];
    for (const file of files) {
      const fileName = file.originalname?.split('.')[0];
      const { key, url } = await this.s3Client.uploadFile(
        vehicleID,
        fileName,
        file.buffer
      );
      ImageList.push({ key, docURL: url });
    }

    const colorList: any = ImageList?.map((val: any, key: number) => {
      const jsonData = {
        image: val
      };
      return jsonData;
    });
    const vehicleImages = vehicle.colorCode
      .map((val) => (val?.image ? { image: val?.image } : undefined))
      .filter((res) => res !== undefined);
    const colorImages: any = [...vehicleImages, ...colorList];
    const colorCode: any = vehicle.colorCode?.map((val: any, key: number) => {
      const jsonData = {
        color: val?.color,
        colorName: val?.colorName,
        image: colorImages[key]?.image
      };
      return jsonData;
    });

    const res = await NewVehicle.findOneAndUpdate(
      { _id: vehicleID },
      { $set: { colorCode } },
      {
        returnDocument: 'after',
        projection: { 'verificationDetails.verifyObj': 0 }
      }
    );
    return res;
  }

  async updateVehicleVideos(
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

    const files: any = req.files;
    // console.log(req.files, req.body, req.videoUrl, '1111111111111111');

    if (!files) {
      throw new Error('Files not found');
    }
    const videoList: any = [];
    for (const file of files) {
      const fileName = file.originalname?.split('.')[0];
      const { key, url } = await this.s3Client.uploadFile(
        vehicleID,
        fileName,
        file.buffer
      );
      videoList.push({ key, docURL: url });
    }
    const videoUrl = videoList[0];

    const res = await NewVehicle.findOneAndUpdate(
      { _id: vehicleID },
      { $set: { videoUrl } },
      {
        returnDocument: 'after',
        projection: { 'verificationDetails.verifyObj': 0 }
      }
    );
    return res;
  }

  async getAllVehicle(
    userName?: string,
    role?: string,
    oemId?: string,
    vehicleType?: string
  ) {
    const query: any = {
      vehicle: vehicleType
    };
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
    if (!vehicleType) {
      delete query['vehicle'];
    }

    const vehicle = await NewVehicle.aggregate([{ $match: query }]);
    return vehicle;
  }

  async getVehiclePaginated(
    userName?: string,
    role?: string,
    oemId?: string,
    pageNo?: number,
    pageSize?: number,
    vehicle?: string,
    brand?: string
  ) {
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
    if (vehicle) {
      query.vehicle = vehicle;
    }
    if (brand) {
      query.brand = brand;
    }
    const productReviews = await NewVehicle.aggregate([
      {
        $match: query
      },
      {
        $skip: pageNo * pageSize
      },
      {
        $limit: pageSize
      }
    ]);
    return productReviews;
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

  async createTestDrive(reqBody: any): Promise<any> {
    Logger.info('<Service>:<VehicleService>:<Create new Vehicle >');
    const query = reqBody;
    const vehicleResult = await NewVehicle.findOne({
      _id: reqBody?.vehicleId
    })?.lean();
    if (_.isEmpty(vehicleResult)) {
      throw new Error('Vehicle does not exist');
    }
    query.vehicleName = vehicleResult?.vehicleNameSuggest;
    query.brand = vehicleResult?.brand;
    query.model = vehicleResult?.model;
    const newTestDrive = await TestDrive.create(query);
    if (newTestDrive?.email) {
      const templateData = {
        email: newTestDrive?.email,
        vehicleName: newTestDrive?.vehicleName,
        model: newTestDrive?.model,
        brand: newTestDrive?.brand
      };
      if (!_.isEmpty(newTestDrive?.email)) {
        sendEmail(
          templateData,
          newTestDrive?.email,
          'support@serviceplug.in',
          'NewVehicleTestDrive'
        );
      }
    }
    return newTestDrive;
  }
}
