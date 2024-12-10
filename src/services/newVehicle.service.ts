/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import NewVehicle, { INewVehicle } from '../models/NewVehicle';
import { Types } from 'mongoose';
import { injectable } from 'inversify';
import _ from 'lodash';
import Logger from '../config/winston';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';
import Admin, { AdminRole } from './../models/Admin';
import TestDrive from './../models/VehicleTestDrive';
import { S3Service } from './s3.service';
import { SurepassService } from './surepass.service';
import { sendEmail, sendNotification } from '../utils/common';
import Store from '../models/Store';
import { SQSEvent } from '../enum/sqsEvent.enum';
import { SQSService } from './sqs.service';

@injectable()
export class NewVehicleInfoService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private surepassService = container.get<SurepassService>(
    TYPES.SurepassService
  );
  private sqsService = container.get<SQSService>(TYPES.SQSService);

  async create(vehicleStore: INewVehicle, userName?: string, role?: string) {
    Logger.info('<Service>:<VehicleService>: <Adding Vehicle intiiated>');

    const vehicleInfo = vehicleStore;
    if (role === AdminRole.OEM) {
      vehicleInfo.oemUserName = userName;
    }
    vehicleInfo.status = 'DRAFT';

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
    const imgKeys: Array<any> = req.body.keys;

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
        image: val,
        imgKey: Number(imgKeys[key])
      };
      return jsonData;
    });
    const vehicleImages = vehicle.colorCode
      .map((val, key) =>
        val?.image ? { image: val?.image, imgKey: key } : undefined
      )
      .filter((res) => res !== undefined);
    const colorImages: any = [...vehicleImages, ...colorList].sort(
      (a, b) => a.imgKey - b.imgKey
    );
    const colorCode: any = vehicle.colorCode?.map((val: any, key: number) => {
      const jsonData = {
        color: val?.color,
        colorName: val?.colorName,
        skuNumber: val?.skuNumber,
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
    if (vehicle?.videoUrl?.key) {
      await this.s3Client.deleteFile(vehicle?.videoUrl?.key);
    }
    const files: any = req.files;

    if (!files) {
      throw new Error('Files not found');
    }

    const videoList: any = [];
    for (const file of files) {
      const fileName = file.originalname;
      const { key, url } = await this.s3Client.uploadVideo(
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
    vehicleType?: string,
    storeId?: string,
    adminFilterOemId?: string,
    brandName?: any,
    firstDate?: string,
    lastDate?: string
  ) {
    const firstDay = firstDate ? new Date(firstDate) : undefined;
    const nextDay = lastDate
      ? new Date(lastDate).setDate(new Date(lastDate).getDate() + 1)
      : undefined;
    const storeKey = [storeId];
    const query: any = {
      updatedAt:
        firstDate && lastDate ? { $gte: firstDay, $lte: nextDay } : undefined,
      vehicle: vehicleType,
      brand: brandName?.catalogName,
      oemUserName: adminFilterOemId,
      'stores.storeId': { $in: storeKey }
    };
    if (!query.updatedAt) delete query['updatedAt'];

    Logger.info('<Service>:<VehicleService>:<get Vehicles initiated>');
    if (!brandName?.catalogName) {
      delete query['brand'];
    }
    if (!adminFilterOemId) {
      delete query['oemUserName'];
    }
    if (!storeId) {
      delete query['stores.storeId'];
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
    if (!vehicleType) {
      delete query['vehicle'];
    }

    const vehicle = await NewVehicle.aggregate([{ $match: query }]);
    return vehicle;
  }

  async getAllVehiclePaginated(
    userName?: string,
    role?: string,
    oemId?: string,
    pageNo?: number,
    pageSize?: number,
    vehicle?: string,
    brand?: any,
    storeId?: string,
    adminFilterOemId?: string,
    searchQuery?: string,
    firstDate?: string,
    lastDate?: string
  ) {
    const firstDay = firstDate ? new Date(firstDate) : undefined;
    const nextDay = lastDate
      ? new Date(lastDate).setDate(new Date(lastDate).getDate() + 1)
      : undefined;
    const storeKey = [storeId];
    const query: any = {
      updatedAt:
        firstDate && lastDate ? { $gte: firstDay, $lte: nextDay } : undefined,
      oemUserName: adminFilterOemId,
      'stores.storeId': { $in: storeKey }
    };
    if (searchQuery) {
      query.$or = [
        { oemUserName: searchQuery },
        { productSuggest: searchQuery }
      ];
    }
    if (!query.updatedAt) delete query['updatedAt'];

    if (!adminFilterOemId) {
      delete query['oemUserName'];
    }
    if (!storeId) {
      delete query['stores.storeId'];
    }
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
      query.brand = JSON.parse(brand?.catalogName);
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

  async getVehiclePaginated(
    userName?: string,
    role?: string,
    oemId?: string,
    pageNo?: number,
    pageSize?: number,
    vehicle?: string,
    brand?: string
  ) {
    const query: any = {
      status: 'ONBOARDED'
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
    if (query?.type === 'CUSTOMER') {
      const vehicleResult = await NewVehicle.findOne({
        _id: reqBody?.vehicleId
      })?.lean();
      if (_.isEmpty(vehicleResult)) {
        throw new Error('Vehicle does not exist');
      }
      query.vehicleName = vehicleResult?.vehicleNameSuggest;
      query.brand = vehicleResult?.brand;
      query.model = vehicleResult?.model;
      const lastTestDrive = await TestDrive.find({
        userId: reqBody?.userId,
        vehicleId: reqBody?.vehicleId,
        'storeDetails.storeId': reqBody?.storeDetails?.storeId
      });
      console.log(lastTestDrive, 'sf');
      console.log(query, 'ssdff');
      const date = new Date();
      if (lastTestDrive.length > 0) {
        const changeType = reqBody?.changeType || '';

        const updatedVehicle = await TestDrive.findOneAndUpdate(
          {
            userId: reqBody?.userId,
            vehicleId: reqBody?.vehicleId,
            'storeDetails.storeId': reqBody?.storeDetails?.storeId
          },
          {
            $set: {
              count: !_.isEmpty(changeType)
                ? lastTestDrive[0]?.count
                : (lastTestDrive[0]?.count || 0) + 1, // Initialize count to 0 if it's undefined
              inactiveUserDate: !_.isEmpty(changeType)
                ? lastTestDrive[0]?.inactiveUserDate
                : date,
              ...query
            }
          },
          { returnDocument: 'after' }
        );
        console.log(updatedVehicle, 'elknfnj');
        const storeDetails = await Store.findOne({
          storeId: reqBody?.storeDetails?.storeId
        });
        sendNotification(
          'New Enquiry',
          `You've received a new inquiry`,
          storeDetails?.contactInfo?.phoneNumber?.primary,
          'STORE_OWNER',
          ''
        );
        if (!_.isEmpty(storeDetails?.oemUserName)) {
          const adminDetails = await Admin.findOne({
            userName: storeDetails?.oemUserName
          });
          if (!_.isEmpty(adminDetails?.contactInfo)) {
            if (!_.isEmpty(adminDetails?.contactInfo?.email)) {
              const templateData = {
                userName: reqBody?.userName,
                phoneNumber: reqBody?.phoneNumber,
                email: reqBody?.email,
                userState: reqBody?.state,
                userCity: reqBody?.city,
                vehicleName: vehicleResult?.vehicleNameSuggest,
                brand: vehicleResult?.brand,
                model: vehicleResult?.model,
                dealerName: reqBody?.dealerName,
                storeId: reqBody?.storeDetails?.storeId,
                storeState: reqBody?.storeDetails?.state,
                storeCity: reqBody?.storeDetails?.city
              };
              const data = {
                to: adminDetails?.contactInfo?.email,
                templateData: templateData,
                templateName: 'NewVehicleEnquiryOemUserPartner'
              };

              const sqsMessage = await this.sqsService.createMessage(
                SQSEvent.EMAIL_NOTIFICATION,
                data
              );
              console.log(sqsMessage, 'Message');
              // await sendEmail(
              //   templateData,
              //   adminDetails?.contactInfo?.email,
              //   'support@serviceplug.in',
              //   'NewVehicleEnquiryOemUserPartner'
              // );
            }
          }
          if (!_.isEmpty(storeDetails?.contactInfo?.email)) {
            const templateDataToStore = {
              userName: reqBody?.userName,
              phoneNumber: reqBody?.phoneNumber,
              email: reqBody?.email,
              userState: reqBody?.state,
              userCity: reqBody?.city,
              vehicleName: vehicleResult?.vehicleNameSuggest,
              brand: vehicleResult?.brand,
              model: vehicleResult?.model
            };
            const data = {
              to: storeDetails?.contactInfo?.email,
              templateData: templateDataToStore,
              templateName: 'NewVehicleTestDriveStore'
            };

            const sqsMessage = await this.sqsService.createMessage(
              SQSEvent.EMAIL_NOTIFICATION,
              data
            );
            console.log(sqsMessage, 'Message');
            // await sendEmail(
            //   templateDataToStore,
            //   storeDetails?.contactInfo?.email,
            //   'support@serviceplug.in',
            //   'NewVehicleTestDriveStore'
            // );
          }
        }
        return updatedVehicle;
      }

      // If no previous test drive, set the count to 0 and create a new test drive
      query.count = 1;
      query.inactiveUserDate = date;
      const newTestDrive = await TestDrive.create(query);
      const storeDetails = await Store.findOne({
        storeId: reqBody?.storeDetails?.storeId
      });
      sendNotification(
        'New Enquiry',
        `You've received a new inquiry`,
        storeDetails?.contactInfo?.phoneNumber?.primary,
        'STORE_OWNER',
        ''
      );
      return newTestDrive;
    }
    const lastTestDrive = await TestDrive.find({
      _id: new Types.ObjectId(query?._id)
    });
    if (lastTestDrive.length > 0) {
      const updatedVehicle = await TestDrive.findOneAndUpdate(
        {
          _id: new Types.ObjectId(query._id)
        },
        {
          $set: {
            ...query
          }
        },
        { returnDocument: 'after' }
      );
      return updatedVehicle;
    }
    const newTestDrive = await TestDrive.create(query);
    return newTestDrive;
  }

  async checkAvailabilityUserTestDrive(reqBody: any): Promise<any> {
    Logger.info('<Service>:<VehicleService>:<Create new Vehicle >');
    const lastTestDrive = await TestDrive.find({
      userId: reqBody?.userId,
      vehicleId: reqBody?.vehicleId,
      'storeDetails.storeId': reqBody?.storeId
    });
    if (lastTestDrive.length > 0) {
      const lastTestDriveTime = new Date(lastTestDrive[0]?.inactiveUserDate);
      const now = new Date();
      const timeDifference = now.getTime() - lastTestDriveTime.getTime();
      const hoursDifference = timeDifference / (1000 * 3600); // Convert time difference to hours

      // Check if the last test drive was within the last 24 hours
      if (hoursDifference < 24) {
        return {
          message: `Thank you! You’ll hear from the dealer shortly.`,
          isPresent: true
        };
      }
      // Update the count if the test drive exists
    }
    return {
      message: 'Available',
      isPresent: false
    };
  }

  async getAllTestDrive(
    userName?: string,
    role?: string,
    oemId?: string,
    storeId?: string,
    enquiryStatus?: string,
    searchValue?: string,
    followUpdate?: Date,
    oemUser?: string
  ) {
    const query: any = {
      'storeDetails.storeId': storeId,
      enquiryStatus: enquiryStatus,
      $or: [
        {
          brand: new RegExp(searchValue, 'i')
        },
        {
          model: new RegExp(searchValue, 'i')
        },
        {
          phoneNumber: new RegExp(`\\+91${searchValue}`, 'i')
        }
      ]
    };
    Logger.info('<Service>:<VehicleService>:<get Vehicles initiated>');

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemUser) {
      query.oemUserName = oemUser;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    if (!storeId) {
      delete query['storeDetails.storeId'];
    }
    if (!enquiryStatus) {
      delete query['enquiryStatus'];
    }
    if (!searchValue) {
      delete query['brand'];
    }
    if (!searchValue) {
      delete query['model'];
    }
    if (!searchValue) {
      delete query['phoneNumber'];
    }

    const vehicle = await TestDrive.find(query);
    return vehicle;
  }

  async getAllTestDrivePaginated(
    userName?: string,
    role?: string,
    oemId?: string,
    storeId?: string,
    enquiryStatus?: string,
    searchValue?: string,
    followUpdate?: Date,
    oemUser?: string,
    pageNo?: number,
    pageSize?: number
  ) {
    const query: any = {
      'storeDetails.storeId': storeId,
      enquiryStatus: enquiryStatus,
      $or: [
        {
          brand: new RegExp(searchValue, 'i')
        },
        {
          model: new RegExp(searchValue, 'i')
        },
        {
          phoneNumber: new RegExp(`\\+91${searchValue}`, 'i')
        }
      ]
    };
    Logger.info('<Service>:<VehicleService>:<get Vehicles initiated>');

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemUser) {
      query.oemUserName = oemUser;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    if (!storeId) {
      delete query['storeDetails.storeId'];
    }
    if (!enquiryStatus) {
      delete query['enquiryStatus'];
    }
    if (!searchValue) {
      delete query['brand'];
    }
    if (!searchValue) {
      delete query['model'];
    }
    if (!searchValue) {
      delete query['phoneNumber'];
    }

    const vehicle = await TestDrive.aggregate([
      { $match: query },
      {
        $skip: pageNo * pageSize
      },
      {
        $limit: pageSize
      }
    ]);
    return vehicle;
  }

  async getAllTestDriveCount(
    userName?: string,
    role?: string,
    oemId?: string,
    storeId?: string,
    enquiryStatus?: string,
    searchValue?: string,
    followUpdate?: Date,
    oemUser?: string
  ) {
    const query: any = {
      'storeDetails.storeId': storeId,
      enquiryStatus: enquiryStatus,
      $or: [
        {
          brand: new RegExp(searchValue, 'i')
        },
        {
          model: new RegExp(searchValue, 'i')
        },
        {
          phoneNumber: new RegExp(`\\+91${searchValue}`, 'i')
        }
      ]
    };
    Logger.info('<Service>:<VehicleService>:<get Vehicles initiated>');

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemUser) {
      query.oemUserName = oemUser;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    if (!storeId) {
      delete query['storeDetails.storeId'];
    }
    if (!enquiryStatus) {
      delete query['enquiryStatus'];
    }
    if (!searchValue) {
      delete query['brand'];
    }
    if (!searchValue) {
      delete query['model'];
    }
    if (!searchValue) {
      delete query['phoneNumber'];
    }

    const vehicle = await TestDrive.count(query);
    const allData = {
      total: vehicle
    };
    return allData;
  }

  async updateNotificationStatus(
    reqBody: any,
    vehicleId: string
  ): Promise<any> {
    Logger.info('<Service>:<vehicleService>:<Update vehicle details >');
    const vehicleResult = await TestDrive.findOne({
      _id: vehicleId
    })?.lean();
    if (_.isEmpty(vehicleResult)) {
      throw new Error('Vehicle does not exist');
    }
    const query: any = {};
    query._id = reqBody._id;

    const res = await TestDrive.findOneAndUpdate(query, reqBody, {
      returnDocument: 'after',
      projection: { 'verificationDetails.verifyObj': 0 }
    });
    return res;
  }

  async getTestDriveDetailsById(id: string): Promise<any> {
    Logger.info('<Service>:<VehicleService>:<get enquiry initiated>');

    const vehicleResult = await TestDrive.findOne({
      _id: new Types.ObjectId(id)
    })?.lean();

    if (_.isEmpty(vehicleResult)) {
      throw new Error('Enquiry does not exist');
    }

    return vehicleResult;
  }
}
