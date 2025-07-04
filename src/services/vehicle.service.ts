/* eslint-disable no-console */
import VehicleInfo, {
  IVehiclesInfo,
  IVehicleImage,
  vehicleInfoSchema,
  IVehicleImageList
} from './../models/Vehicle';
import { Types } from 'mongoose';
import { injectable } from 'inversify';
import _, { isEmpty } from 'lodash';
import Logger from '../config/winston';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';

import { S3Service } from './s3.service';
import { AdminRole } from './../models/Admin';
import User, { IUser } from './../models/User';
import { SurepassService } from './surepass.service';
import Customer, { ICustomer } from '../models/Customer';
import ParkAssistVehicle, {
  IParkAssistVehicle,
  IParkAssistVehicleImageList
} from '../models/ParkAssistVehicles';
import { CustomerService } from './customer.service';
import { StoreService } from './store.service';
import EmergencyContactDetails, {
  IEmergencyContactDetails
} from '../models/EmergencyContactDetails';
import Store from '../models/Store';
@injectable()
export class VehicleInfoService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private surepassService = container.get<SurepassService>(
    TYPES.SurepassService
  );
  private customerService = container.get<CustomerService>(
    TYPES.CustomerService
  );
  private storeService = container.get<StoreService>(TYPES.StoreService);

  async addVehicle(vehicleStore: IVehiclesInfo) {
    Logger.info('<Service>:<VehicleService>: <Adding Vehicle intiiated>');

    // Check if user exists
    const user: ICustomer = await Customer.findOne({
      _id: new Types.ObjectId(vehicleStore.userId)
    });
    if (_.isEmpty(user)) {
      throw new Error('User not found');
    }
    const vehicleDetails = await VehicleInfo.findOne({
      vehicleNumber: vehicleStore?.vehicleNumber
    });
    let vehicleResult;
    if (_.isEmpty(vehicleDetails)) {
      const vehicleDetails = {
        ...vehicleStore,
        userId: new Types.ObjectId(vehicleStore.userId)
      };
      vehicleResult = await VehicleInfo.create(vehicleDetails);
    } else if (vehicleDetails?.purpose === 'BUY_SELL') {
      const vehicleDetails = {
        ...vehicleStore,
        purpose: 'OWNED_BUY_SELL'
      };
      vehicleResult = await VehicleInfo.findOneAndUpdate(
        {
          vehicleNumber: vehicleStore?.vehicleNumber
        },
        vehicleDetails,
        { returnDocument: 'after' }
      );
    } else {
      vehicleResult = await VehicleInfo.findOneAndUpdate(
        {
          vehicleNumber: vehicleStore?.vehicleNumber
        },
        vehicleStore,
        { returnDocument: 'after' }
      );
    }

    Logger.info('<Service>:<VehicleService>:<Vehicle created successfully>');
    return vehicleResult;
  }

  async getAllVehicleByUser(userId: string): Promise<any> {
    // Check if user exists
    const user: ICustomer = await Customer.findOne({
      _id: new Types.ObjectId(userId)
    });
    if (_.isEmpty(user)) {
      throw new Error('User not found');
    }

    const allVehicles = await VehicleInfo.find({
      userId: new Types.ObjectId(userId)
    });
    return allVehicles;
  }

  async updateVehicleImages(
    vehicleId: string,
    req: Request | any
  ): Promise<any> {
    Logger.info('<Service>:<VehicleService>:<Upload Vehicle Images initiated>');

    const vehicle: IVehiclesInfo = await VehicleInfo.findOne({
      _id: new Types.ObjectId(vehicleId)
    });
    if (_.isEmpty(vehicle)) {
      throw new Error('Vehicle does not exist');
    }

    const files: Array<any> = req.files;

    const vehicleImageList: Partial<IVehicleImageList> | any =
      vehicle.vehicleImageList || {
        frontView: {},
        leftView: {},
        seatView: {},
        odometer: {},
        rightView: {},
        backView: {}
      };

    if (!files) {
      throw new Error('Files not found');
    }
    for (const file of files) {
      const fileName:
        | 'frontView'
        | 'leftView'
        | 'seatView'
        | 'odometer'
        | 'rightView'
        | 'backView' = file.originalname?.split('.')[0] || 'frontView';
      const { key, url } = await this.s3Client.uploadFile(
        vehicleId,
        fileName,
        file.buffer
      );
      vehicleImageList[fileName] = { key, docURL: url };
    }

    Logger.info(`<Service>:<VehicleService>:<Upload all images - successful>`);

    Logger.info(`<Service>:<VehicleService>:<Updating the vehicle info>`);

    const updatedVehicle = await VehicleInfo.findOneAndUpdate(
      {
        _id: vehicleId
      },
      {
        $set: {
          vehicleImageList: vehicleImageList
        }
      },
      { returnDocument: 'after' }
    );

    return updatedVehicle;
  }

  async deleteVehicleImage(
    vehicleId: string,
    req: Request | any,
    vehicleImageKey?: string // New parameter for image deletion
  ): Promise<any> {
    Logger.info('<Service>:<VehicleService>:<Update Vehicle Image initiated>');

    const vehicle: IVehiclesInfo = await VehicleInfo.findOne({
      _id: new Types.ObjectId(vehicleId)
    });

    if (_.isEmpty(vehicle)) {
      throw new Error('Vehicle does not exist');
    }

    // const files: Array<any> = req.files;

    const vehicleImageList: Partial<IVehicleImageList> | any =
      vehicle.vehicleImageList || {
        frontView: {},
        leftView: {},
        seatView: {},
        odometer: {},
        rightView: {},
        backView: {}
      };

    if (!vehicleImageKey) {
      throw new Error('No Old Image reference found');
    } else {
      // If deleteImageKey is provided, delete the corresponding image
      await this.s3Client.deleteFile(vehicleImageKey);

      // Remove the deleted image from the vehicle image list
      vehicleImageList[vehicleImageKey] = {};
    }

    const updatedVehicle = await VehicleInfo.findOneAndUpdate(
      {
        _id: vehicleId
      },
      {
        $set: {
          vehicleImageList: vehicleImageList
        }
      },
      { returnDocument: 'after' }
    );

    return updatedVehicle;
  }

  // async updateOrDeleteVehicleImage(
  //   reqBody: {
  //     vehicleId: string;
  //     vehicleImageKey: string;
  //   },
  //   req: Request | any
  // ) {
  //   Logger.info('<Service>:<VehicleService>:<Upload Banner initiated>');
  //   const { vehicleId, vehicleImageKey } = reqBody;

  //   const vehicleInfo: IVehiclesInfo = await VehicleInfo.findOne({
  //     _id: new Types.ObjectId(vehicleId)
  //   });
  //   if (_.isEmpty(vehicleInfo)) {
  //     throw new Error('Vehicle does not exist');
  //   }
  //   const vehImageList = [...vehicleInfo.vehicleImageList];

  //   const file = req.file;

  //   if (!vehicleImageKey) {
  //     throw new Error('No Old Image reference found');
  //   }
  //   const updInd = _.findIndex(
  //     vehImageList,
  //     (vehImg: IVehicleImage) => vehImg.key === vehicleImageKey
  //   );

  //   if (!file) {
  //     vehImageList.splice(updInd, 1);
  //     await this.s3Client.deleteFile(vehicleImageKey);
  //   } else {
  //     const { key, url } = await this.s3Client.replaceFile(
  //       vehicleImageKey,
  //       file.buffer
  //     );
  //     vehImageList[updInd] = { ...vehImageList[updInd], key, url };
  //   }

  //   Logger.info(`<Service>:<VehicleService>:<Upload all images - successful>`);

  //   Logger.info(`<Service>:<VehicleService>:<Updating the vehicle info>`);

  //   const updatedVehicle = await VehicleInfo.findOneAndUpdate(
  //     {
  //       _id: new Types.ObjectId(vehicleId)
  //     },
  //     {
  //       $set: {
  //         vehicleImageList: vehImageList
  //       }
  //     },
  //     { returnDocument: 'after' }
  //   );

  //   return updatedVehicle;
  // }

  async vehicleDetailsFromRC(reqBody: any): Promise<any> {
    Logger.info(
      '<Service>:<VehicleService>:<Initiate fetching vehicle Details>'
    );
    // validate the store from user phone number and user id
    const { vehicleNumber } = reqBody;
    const vehiclePresent = await VehicleInfo.findOne({
      vehicleNumber: reqBody.vehicleNumber,
      userId: new Types.ObjectId(reqBody.userId)
    });
    if (!_.isEmpty(vehiclePresent)) {
      return {
        message: `This vehicle is already registered if you like to list same vehicles please contact our Support team 6360586465 or support@serviceplug.in`,
        isPresent: true
      };
    }
    try {
      // get the store data
      const vehicleDetails =
        await this.surepassService.getRcDetails(vehicleNumber);
      return vehicleDetails;
    } catch (err) {
      throw new Error(err);
    }
  }

  async getVehicleByVehicleId(vehicleId: string): Promise<IVehiclesInfo> {
    Logger.info(
      '<Service>:<VehicleService>: <Vehicle Fetch: Get vehicle by vehicle id>'
    );
    const vehicle: IVehiclesInfo = await VehicleInfo.findOne({
      _id: new Types.ObjectId(vehicleId)
    });
    return vehicle;
  }

  async update(
    vehiclePayload: IVehiclesInfo,
    vehicleId: string
  ): Promise<IVehiclesInfo> {
    Logger.info(
      '<Service>:<VehicleService>: <Vehicle Update: updating vehicle>'
    );

    // check if user exist
    let vehicle: IVehiclesInfo;
    if (vehicleId) {
      vehicle = await VehicleInfo.findOne({
        _id: new Types.ObjectId(vehicleId)
      });
    }
    if (!vehicle) {
      Logger.error(
        '<Service>:<updatedVehicle>:<Vehicle not found with that vehicle Id>'
      );
    }
    const user: ICustomer = await Customer.findOne({
      _id: new Types.ObjectId(vehiclePayload.userId)
    });
    if (_.isEmpty(user)) {
      throw new Error('User not found');
    }

    let updatedVehicle: IVehiclesInfo = vehiclePayload;

    updatedVehicle = await VehicleInfo.findOneAndUpdate(
      { _id: new Types.ObjectId(vehicleId) },
      updatedVehicle,
      { returnDocument: 'after' }
    );
    Logger.info('<Service>:<VehicleService>:<Vehicle updated successfully>');
    return updatedVehicle;
  }

  async getAll(req: any, userName?: any, role?: any): Promise<IVehiclesInfo[]> {
    Logger.info('<Service>:<VehicleService>:<Get all vehicles>');
    let start;
    let end;

    const query: any = {
      vehicleType: req.vehicleType
    };
    if (req?.date) {
      // Create start time in UTC at the beginning of the day (00:00:00)
      start = new Date(req.date);
      start.setDate(start.getDate() + 1);
      start.setUTCHours(0, 0, 0, 0);

      // Create end time in UTC at the end of the day (23:59:59)
      end = new Date(req.date);
      end.setDate(end.getDate() + 1);
      end.setUTCHours(23, 59, 59, 999);

      query.createdAt = { $gte: start, $lte: end };
    } else if (
      !_.isEmpty(req.year) &&
      !_.isEmpty(req.month) &&
      _.isEmpty(req.date)
    ) {
      start = new Date(Date.UTC(req.year, req.month - 1, 1));
      start.setUTCHours(0, 0, 0, 0);

      end = new Date(Date.UTC(req.year, req.month, 0));
      end.setUTCHours(23, 59, 59, 999);

      query.createdAt = { $gte: start, $lte: end };
    } else if (
      !_.isEmpty(req.year) &&
      _.isEmpty(req.month) &&
      _.isEmpty(req.date)
    ) {
      start = new Date(Date.UTC(req.year, 0, 1));
      start.setUTCHours(0, 0, 0, 0);

      end = new Date(Date.UTC(req.year, 12, 0));
      end.setUTCHours(23, 59, 59, 999);

      query.createdAt = { $gte: start, $lte: end };
    }
    if (!req.vehicleType) {
      delete query['vehicleType'];
    }
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = req?.oemId;
    }

    if (req?.oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    const vehicleResponse: IVehiclesInfo[] = await VehicleInfo.find(query);
    return vehicleResponse;
  }

  async getAllCount(
    req: any,
    userName?: any,
    role?: any
  ): Promise<IVehiclesInfo[]> {
    Logger.info('<Service>:<VehicleService>:<Get all vehicles>');
    const query: any = {
      purpose: 'OWNED'
    };
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = req?.oemId;
    }

    if (req?.oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    const vehicleResponse: IVehiclesInfo[] = await VehicleInfo.find(query);
    return vehicleResponse;
  }

  async getVehiclePaginated(
    userName?: string,
    role?: string,
    oemId?: string,
    pageNo?: number,
    pageSize?: number,
    searchQuery?: string
  ): Promise<IVehiclesInfo[]> {
    Logger.info('<Service>:<VehicleService>:<Get all vehicles>');

    const query: any = {
      purpose: 'OWNED'
    };
    if (searchQuery !== '') {
      query.$or = [
        {
          vehicleNumber: searchQuery
        }
      ];
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
    const vehicleResponse: IVehiclesInfo[] = await VehicleInfo.aggregate([
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
    return vehicleResponse;
  }

  async getAllOwnedVehicles(vehicleNumber: string): Promise<any> {
    Logger.info('<Service>:<VehicleService>:<Get all vehicles>');

    const query = {
      purpose: { $in: ['OWNED', 'OWNED_BUY_SELL'] }, // Fixed logical error
      vehicleNumber
    };

    const vehicleResponse = await VehicleInfo.findOne(query);
    return vehicleResponse;
  }

  async createParkAssistVehicle(vehicleStore: IParkAssistVehicle) {
    Logger.info('<Service>:<VehicleService>: <Adding Vehicle intiiated>');

    // Check if user exists
    if (vehicleStore?.customerId) {
      const customerId = vehicleStore?.customerId;
      const customer =
        await this.customerService.getcustomerDetailsByCustomerId(customerId);
      if (_.isEmpty(customer)) {
        throw new Error('User not found');
      }
    }
    if (vehicleStore?.storeId) {
      const storeId = vehicleStore?.storeId;
      const store = await this.storeService.getById({
        storeId,
        lat: '',
        long: ''
      });
      if (_.isEmpty(store)) {
        throw new Error('Store not found');
      }
    }
    const vehicleDetails = await ParkAssistVehicle.findOne({
      vehicleNumber: vehicleStore?.vehicleNumber
    });
    let vehicleResult;
    if (!isEmpty(vehicleDetails)) {
      return {
        message: `This vehicle is already registered if you like to list same vehicles please contact our Support team 6360586465 or support@serviceplug.in`,
        isPresent: true
      };
    } else {
      vehicleResult = ParkAssistVehicle.create(vehicleStore);
    }

    Logger.info('<Service>:<VehicleService>:<Vehicle created successfully>');
    return vehicleResult;
  }

  async uploadParkAssistVehicleImages(
    vehicleId: string,
    req: Request | any
  ): Promise<any> {
    Logger.info('<Service>:<VehicleService>:<Upload Vehicle Images initiated>');

    const vehicle: IParkAssistVehicle = await ParkAssistVehicle.findOne({
      _id: new Types.ObjectId(vehicleId)
    });
    if (_.isEmpty(vehicle)) {
      throw new Error('Vehicle does not exist');
    }

    const files: Array<any> = req.files;

    const vehicleImageList: Partial<IParkAssistVehicleImageList> | any =
      vehicle.vehicleImageList || {
        rcFrontView: {},
        rcBackView: {}
      };

    if (!files) {
      throw new Error('Files not found');
    }
    for (const file of files) {
      const fileName: 'rcFrontView' | 'rcBackView' =
        file.originalname?.split('.')[0] || 'rcFrontView';
      const { key, url } = await this.s3Client.uploadFile(
        vehicleId,
        fileName,
        file.buffer
      );
      vehicleImageList[fileName] = { key, docURL: url };
    }

    Logger.info(`<Service>:<VehicleService>:<Upload all images - successful>`);

    Logger.info(`<Service>:<VehicleService>:<Updating the vehicle info>`);

    const updatedVehicle = await ParkAssistVehicle.findOneAndUpdate(
      {
        _id: new Types.ObjectId(vehicleId)
      },
      {
        $set: {
          vehicleImageList: vehicleImageList
        }
      },
      { returnDocument: 'after' }
    );

    return updatedVehicle;
  }

  async updateParkAssistVehicle(
    vehiclePayload: IParkAssistVehicle,
    vehicleId: string
  ): Promise<IParkAssistVehicle> {
    Logger.info(
      '<Service>:<VehicleService>: <Vehicle Update: updating vehicle>'
    );

    // check if user exist
    let vehicle: IParkAssistVehicle;
    if (vehicleId) {
      vehicle = await ParkAssistVehicle.findOne({
        _id: new Types.ObjectId(vehicleId)
      });
    }
    if (!vehicle) {
      Logger.error(
        '<Service>:<updatedVehicle>:<Vehicle not found with that vehicle Id>'
      );
    }

    let updatedVehicle: IParkAssistVehicle = vehiclePayload;

    updatedVehicle = await ParkAssistVehicle.findOneAndUpdate(
      { _id: new Types.ObjectId(vehicleId) },
      updatedVehicle,
      { returnDocument: 'after' }
    );
    Logger.info('<Service>:<VehicleService>:<Vehicle updated successfully>');
    return updatedVehicle;
  }

  async getParkAssistVehicleByVehicleId(
    vehicleId: string
  ): Promise<IParkAssistVehicle> {
    Logger.info(
      '<Service>:<VehicleService>: <Vehicle Fetch: Get vehicle by vehicle id>'
    );
    const vehicle: IParkAssistVehicle = await ParkAssistVehicle.findOne({
      _id: new Types.ObjectId(vehicleId)
    });
    return vehicle;
  }

  async getAllParkAsistVehiclesById(
    userId: string,
    platform: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<VehicleService>: <Vehicle Fetch: Get vehicle by vehicle id>'
    );

    if (!userId) {
      throw new Error('User Id not found');
    }
    let vehicles;
    if (platform === 'CUSTOMER') {
      vehicles = await ParkAssistVehicle.find({ customerId: userId });
    } else {
      vehicles = await ParkAssistVehicle.find({ storeId: userId });
    }
    return vehicles;
  }

  async deleteParkAssistVehicle(vehicleId: string): Promise<any> {
    Logger.info(
      '<Service>:<VehicleService>:<Delete vehicle by Id service initiated>'
    );
    const res = await ParkAssistVehicle.findOneAndDelete({
      _id: new Types.ObjectId(vehicleId)
    });
    return res;
  }

  async createEmergencyContactDetails(
    requestPayload: IEmergencyContactDetails
  ): Promise<any> {
    Logger.info(
      '<Service>:<VehicleService>:<Delete vehicle by Id service initiated>'
    );
    const phoneNumber = `+91${requestPayload.phoneNumber.slice(-10)}`;
    requestPayload.phoneNumber = phoneNumber;
    if (requestPayload?.customerId) {
      const customer =
        await this.customerService.getcustomerDetailsByCustomerId(
          requestPayload.customerId
        );
      if (_.isEmpty(customer)) {
        throw new Error('Customer Not Found');
      }
      if (customer?.emergencyDetails) {
        const isPhoneNumberExists = customer?.emergencyDetails?.some(
          (contact: any) => contact.phoneNumber === requestPayload.phoneNumber
        );
        if (isPhoneNumberExists) {
          return {
            message: `This Phone number already exists in emergency contact details`,
            isPresent: true
          };
        } else {
          let createEmergencyDetails =
            await EmergencyContactDetails.create(requestPayload);
          let customers = await Customer.findOneAndUpdate(
            {
              customerId: requestPayload.customerId
            },
            { $push: { emergencyDetails: requestPayload } },
            { returnDocument: 'after' }
          );
          return createEmergencyDetails;
        }
      } else {
        let createEmergencyDetails =
          await EmergencyContactDetails.create(requestPayload);
        let customers = await Customer.findOneAndUpdate(
          {
            customerId: requestPayload.customerId
          },
          { $set: { emergencyDetails: requestPayload } },
          { returnDocument: 'after' }
        );
        return createEmergencyDetails;
      }
    }
    if (requestPayload?.storeId) {
      const storeId = requestPayload?.storeId;
      const store = await this.storeService.getById({
        storeId,
        lat: '',
        long: ''
      });
      if (_.isEmpty(store)) {
        throw new Error('Store Not Found');
      }
      if (Array.isArray(store[0]?.emergencyDetails)) {
        const isPhoneNumberExists = store[0]?.emergencyDetails?.some(
          (contact: any) => contact.phoneNumber === requestPayload.phoneNumber
        );
        if (isPhoneNumberExists) {
          return {
            message: `This Phone number already exists in emergency contact details`,
            isPresent: true
          };
        } else {
          let createEmergencyDetails =
            await EmergencyContactDetails.create(requestPayload);
          let stores = await Store.findOneAndUpdate(
            {
              storeId: requestPayload.storeId
            },
            { $push: { emergencyDetails: requestPayload } },
            { returnDocument: 'after' }
          );
          return createEmergencyDetails;
        }
      } else {
        let createEmergencyDetails =
          await EmergencyContactDetails.create(requestPayload);
        let stores = await Store.findOneAndUpdate(
          {
            storeId: requestPayload.storeId
          },
          { $set: { emergencyDetails: requestPayload } },
          { returnDocument: 'after' }
        );
        return createEmergencyDetails;
      }
    }
  }

  async deleteEmergencyContactDetail(
    emergencyContactDetailId: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<VehicleService>:<Delete vehicle by Id service initiated>'
    );
    let emergencyEmployeeDetail = await EmergencyContactDetails.findOne({
      _id: new Types.ObjectId(emergencyContactDetailId)
    });
    let emergencyEmployeeDetailDeletion =
      await EmergencyContactDetails.findOneAndDelete({
        _id: new Types.ObjectId(emergencyContactDetailId)
      });
    if (!emergencyEmployeeDetail) {
      throw new Error('Detail Not found');
    }
    if (emergencyEmployeeDetail?.customerId) {
      const customer =
        await this.customerService.getcustomerDetailsByCustomerId(
          emergencyEmployeeDetail.customerId
        );
      if (_.isEmpty(customer)) {
        throw new Error('Customer Not Found');
      }
      if (customer?.emergencyDetails) {
        const isPhoneNumberExists = customer?.emergencyDetails?.some(
          (contact: any) =>
            contact.phoneNumber === emergencyEmployeeDetail.phoneNumber
        );
        if (!isPhoneNumberExists) {
          return {
            message: `This Phone number is not exists in emergency contact details`,
            isPresent: true
          };
        } else {
          let customers = await Customer.findOneAndUpdate(
            {
              customerId: emergencyEmployeeDetail.customerId
            },
            {
              $pull: {
                emergencyDetails: {
                  phoneNumber: emergencyEmployeeDetail.phoneNumber
                }
              }
            }, // Corrected $pull condition
            { new: true }
          );
        }
      }
    }
    if (emergencyEmployeeDetail?.storeId) {
      const storeId = emergencyEmployeeDetail?.storeId;
      const store = await this.storeService.getById({
        storeId,
        lat: '',
        long: ''
      });
      if (_.isEmpty(store)) {
        throw new Error('Store Not Found');
      }
      if (Array.isArray(store[0]?.emergencyDetails)) {
        const isPhoneNumberExists = store[0]?.emergencyDetails?.some(
          (contact: any) =>
            contact.phoneNumber === emergencyEmployeeDetail.phoneNumber
        );
        if (!isPhoneNumberExists) {
          return {
            message: `This Phone number already exists in emergency contact details`,
            isPresent: true
          };
        } else {
          let stores = await Store.findOneAndUpdate(
            {
              storeId: emergencyEmployeeDetail.storeId
            },
            {
              $pull: {
                emergencyDetails: {
                  phoneNumber: emergencyEmployeeDetail.phoneNumber
                }
              }
            },
            { returnDocument: 'after' }
          );
        }
      }
    }
    return emergencyEmployeeDetailDeletion;
  }

  async getAllEmergencyDetailsByUserId(
    userId: string,
    platform: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<VehicleService>: <Vehicle Fetch: Get vehicle by vehicle id>'
    );

    if (!userId) {
      throw new Error('User Id not found');
    }
    let emergencyDetails;
    if (platform === 'CUSTOMER') {
      emergencyDetails = await EmergencyContactDetails.find({
        customerId: userId
      });
    } else {
      emergencyDetails = await EmergencyContactDetails.find({
        storeId: userId
      });
    }
    return emergencyDetails;
  }

  async getTotalVehiclesCount(
    platform: string,
    state: string,
    city: string,
    searchText: string
  ): Promise<any> {
    Logger.info('<Service>:<VehicleService>:<count all Park Assist Vehicles>');

    let matchQuery: any = {};

    // Add state and city filters if provided
    if (state) matchQuery['customerDetails.contactInfo.state'] = state;
    if (city) matchQuery['customerDetails.contactInfo.city'] = city;

    // Add platform-based filters
    if (platform === 'PARTNER') {
      matchQuery['storeId'] = { $exists: true };
    } else if (platform === 'CUSTOMER') {
      matchQuery['customerId'] = { $exists: true };
    }

    if (searchText) {
      if (searchText) {
        matchQuery.$or = [
          { vehicleNumber: searchText }, // Case-insensitive vehicle number match
          {
            'storeDetails.contactInfo.phoneNumber.primary': `+91${searchText.slice(-10)}` // Ensure TypeScript accepts this key
          },
          {
            'customerDetails.phoneNumber': `+91${searchText.slice(-10)}`
          }
        ];
      }
    }

    // Aggregate query to fetch total, active, and inactive counts in one go
    const counts = await ParkAssistVehicle.aggregate([
      {
        $lookup: {
          from: 'stores',
          localField: 'storeId',
          foreignField: 'storeId',
          as: 'storeDetails'
        }
      },
      {
        $unwind: { path: '$storeDetails', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: 'customerId',
          as: 'customerDetails'
        }
      },
      {
        $unwind: { path: '$customerDetails', preserveNullAndEmptyArrays: true }
      },
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] }
          },
          inActive: {
            $sum: { $cond: [{ $eq: ['$status', 'INACTIVE'] }, 1, 0] }
          }
        }
      }
    ]);

    // Return default counts if aggregation returns empty
    return counts.length > 0 ? counts[0] : { total: 0, active: 0, inActive: 0 };
  }

  async getAllParkAssistVehiclePaginated(
    status?: string,
    pageNo?: number,
    pageSize?: number,
    platform?: string,
    state?: string,
    city?: string,
    searchText?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<VehicleService>:<Search and Filter park assist vehicles service initiated>'
    );

    let matchQuery: any = {
      status: status
    };

    // Add state and city filters if provided
    if (state) matchQuery['customerDetails.contactInfo.state'] = state;
    if (city) matchQuery['customerDetails.contactInfo.city'] = city;

    // Add platform-based filters
    if (platform === 'PARTNER') {
      matchQuery['storeId'] = { $exists: true };
    } else if (platform === 'CUSTOMER') {
      matchQuery['customerId'] = { $exists: true };
    }

    if (searchText) {
      if (searchText) {
        matchQuery.$or = [
          { vehicleNumber: searchText }, // Case-insensitive vehicle number match
          {
            'storeDetails.contactInfo.phoneNumber.primary': `+91${searchText.slice(-10)}` // Ensure TypeScript accepts this key
          },
          {
            'customerDetails.phoneNumber': `+91${searchText.slice(-10)}`
          }
        ];
      }
    }

    let parkAssistVehicles: any = await ParkAssistVehicle.aggregate([
      {
        $lookup: {
          from: 'stores',
          localField: 'storeId',
          foreignField: 'storeId',
          as: 'storeDetails'
        }
      },
      {
        $unwind: { path: '$storeDetails', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: 'customerId',
          as: 'customerDetails'
        }
      },
      {
        $unwind: { path: '$customerDetails', preserveNullAndEmptyArrays: true }
      },
      { $match: matchQuery },
      {
        $skip: pageNo * pageSize
      },
      {
        $limit: pageSize
      }
    ]);
    return parkAssistVehicles;
  }

  async getParkAssistVehicleDetailsByVehilceNumber(
    vehicleNumber: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<VehicleService>:<Get vehicle details by vehicle number service initiated 111111>'
    );

    const vehicle = await ParkAssistVehicle.findOne({
      vehicleNumber: vehicleNumber
    });

    const emergencyDetails = await EmergencyContactDetails.find({
      customerId: vehicle.customerId
    }).lean();

    const customerDetails = await Customer.findOne({
      customerId: vehicle.customerId
    });

    return {
      vehicleData: vehicle,
      emergencyData: emergencyDetails,
      customerData: customerDetails
    };
  }

  async updateParkAssistVehicleStatus(
    vehicleId: string,
    status: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<VehicleService>:<Update vehicle status by vehicle id service initiated>'
    );

    const result = await ParkAssistVehicle.findOneAndUpdate(
      { _id: new Types.ObjectId(vehicleId) }, // Corrected object wrapping
      { $set: { status: status } }, // Fixed incorrect `$set` syntax
      { new: true } // Optional: Returns the updated document
    );

    return result;
  }

  async getTotalEmergencyContactsCount(
    platform: string,
    state: string,
    city: string,
    searchText: string
  ): Promise<any> {
    Logger.info('<Service>:<VehicleService>:<Count all Park Assist Vehicles>');

    // Build query dynamically
    const matchQuery: any = {};

    if (state) matchQuery['customerDetails.contactInfo.state'] = state;
    if (city) matchQuery['customerDetails.contactInfo.city'] = city;

    if (platform === 'PARTNER') {
      matchQuery['storeId'] = { $exists: true };
    } else if (platform === 'CUSTOMER') {
      matchQuery['customerId'] = { $exists: true };
    }

    if (searchText) {
      const parkAssistVehicleDetails = await ParkAssistVehicle.findOne({
        vehicleNumber: searchText
      }).lean(); // Use lean() for better performance

      const searchConditions: Record<string, any>[] = [];

      // Add search conditions for phone numbers
      searchConditions.push(
        {
          'storeDetails.contactInfo.phoneNumber.primary': `+91${searchText.slice(-10)}`
        },
        { 'customerDetails.phoneNumber': `+91${searchText.slice(-10)}` }
      );

      // Add customerId and storeId only if they exist
      if (parkAssistVehicleDetails?.customerId) {
        searchConditions.push({
          customerId: parkAssistVehicleDetails.customerId
        });
      }
      if (parkAssistVehicleDetails?.storeId) {
        searchConditions.push({ storeId: parkAssistVehicleDetails.storeId });
      }

      // Assign $or condition only if searchConditions is not empty
      if (searchConditions.length > 0) {
        matchQuery.$or = searchConditions;
      }
    }

    // Aggregate query to fetch total, active, and inactive counts
    const counts = await EmergencyContactDetails.aggregate([
      {
        $lookup: {
          from: 'stores',
          localField: 'storeId',
          foreignField: 'storeId',
          as: 'storeDetails'
        }
      },
      { $unwind: { path: '$storeDetails', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: 'customerId',
          as: 'customerDetails'
        }
      },
      {
        $unwind: { path: '$customerDetails', preserveNullAndEmptyArrays: true }
      }, // Lookup park assist vehicles using storeId and customerId
      { $match: matchQuery },
      {
        $group: {
          _id: '$_id', // Ensure unique records
          isPublic: { $first: '$isPublic' }, // Preserve original value
          isPrivate: { $first: '$isPrivate' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          isPublic: { $sum: { $cond: [{ $eq: ['$isPublic', true] }, 1, 0] } },
          isPrivate: { $sum: { $cond: [{ $eq: ['$isPublic', false] }, 1, 0] } }
        }
      }
    ]);

    return (
      counts[0] || { total: 0, totalVehicles: 0, isPublic: 0, isPrivate: 0 }
    );
  }

  async getAllParkAssistEmergencyContactsPaginated(
    status?: string,
    pageNo?: number,
    pageSize?: number,
    platform?: string,
    state?: string,
    city?: string,
    searchText?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<VehicleService>:<Search and Filter park assist vehicles service initiated>'
    );

    const matchQuery: any = {};

    if (status === 'public') {
      matchQuery.isPublic = true;
    } else {
      matchQuery.isPublic = false;
    }
    if (state) matchQuery['customerDetails.contactInfo.state'] = state;
    if (city) matchQuery['customerDetails.contactInfo.city'] = city;

    if (platform === 'PARTNER') {
      matchQuery['storeId'] = { $exists: true };
    } else if (platform === 'CUSTOMER') {
      matchQuery['customerId'] = { $exists: true };
    }

    if (searchText) {
      const parkAssistVehicleDetails = await ParkAssistVehicle.findOne({
        vehicleNumber: searchText
      }).lean(); // Use lean() for better performance

      const searchConditions: Record<string, any>[] = [];

      // Add search conditions for phone numbers
      searchConditions.push(
        {
          'storeDetails.contactInfo.phoneNumber.primary': `+91${searchText.slice(-10)}`
        },
        { 'customerDetails.phoneNumber': `+91${searchText.slice(-10)}` }
      );

      // Add customerId and storeId only if they exist
      if (parkAssistVehicleDetails?.customerId) {
        searchConditions.push({
          customerId: parkAssistVehicleDetails.customerId
        });
      }
      if (parkAssistVehicleDetails?.storeId) {
        searchConditions.push({ storeId: parkAssistVehicleDetails.storeId });
      }

      // Assign $or condition only if searchConditions is not empty
      if (searchConditions.length > 0) {
        matchQuery.$or = searchConditions;
      }
    }

    let parkAssistemergencyContacts: any =
      await EmergencyContactDetails.aggregate([
        {
          $lookup: {
            from: 'stores',
            localField: 'storeId',
            foreignField: 'storeId',
            as: 'storeDetails'
          }
        },
        {
          $unwind: { path: '$storeDetails', preserveNullAndEmptyArrays: true }
        },

        {
          $lookup: {
            from: 'customers',
            localField: 'customerId',
            foreignField: 'customerId',
            as: 'customerDetails'
          }
        },
        {
          $unwind: {
            path: '$customerDetails',
            preserveNullAndEmptyArrays: true
          }
        }, // Lookup park assist vehicles using storeId and customerId
        { $match: matchQuery },
        {
          $skip: pageNo * pageSize
        },
        {
          $limit: pageSize
        }
      ]);
    return parkAssistemergencyContacts;
  }

  async getVehicleAndEmergencyDetailsByVehicleNumber(
    vehicleNumber: string
  ): Promise<{ vehicleData: any; emergencyData: any[] }> {
    Logger.info('<Service>:<VehicleService>:<Search and Filter initiated>');

    // Fetch vehicle details
    const vehicle = await ParkAssistVehicle.findOne({
      vehicleNumber,
      status: 'ACTIVE'
    }).lean();
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Fetch emergency contact details
    const emergencyDetails = await EmergencyContactDetails.find({
      customerId: vehicle.customerId
    }).lean();

    const customer = await Customer.findOne({
      customerId: vehicle.customerId
    });

    const accessList = customer?.accessList as {
      PARK_ASSIST?: {
        CREATE?: boolean;
        READ?: boolean;
        UPDATE?: boolean;
        DELETE?: boolean;
      };
    };

    const hasAccess = accessList?.PARK_ASSIST?.READ;

    if (!emergencyDetails.length) {
      return { vehicleData: vehicle, emergencyData: [] }; // No emergency contacts found
    }

    // Extract unique phone numbers
    const phoneNumbers = emergencyDetails.map(
      (detail) => `+91${detail.phoneNumber.slice(-10)}`
    );

    // Fetch customers who have these phone numbers
    const validCustomers = await Customer.find({
      phoneNumber: { $in: phoneNumbers }
    }).lean();
    const validPhoneNumbers = new Set(
      validCustomers.map((customer) => customer.phoneNumber)
    );

    const publicEmergencyDetails = emergencyDetails.filter(
      (detail) => detail.isPublic
    );
    const privateEmergencyDetails = emergencyDetails.filter(
      (detail) =>
        validPhoneNumbers.has(`+91${detail.phoneNumber.slice(-10)}`) &&
        !detail.isPublic
    );

    return {
      vehicleData: vehicle,
      emergencyData: hasAccess
        ? [...publicEmergencyDetails, ...privateEmergencyDetails]
        : []
    };
  }

  async getVehicleDetailsFromRc(
    vehicleNumber: string
  ): Promise<{ vehicleData: any; emergencyData: any[] }> {
    Logger.info('<Service>:<VehicleService>:<Search and Filter initiated>');

    try {
      // get the store data
      const vehicleDetails =
        await this.surepassService.getRcDetails(vehicleNumber);
      return vehicleDetails;
    } catch (err) {
      throw new Error(err);
    }
  }

  async updateRcDetails(requestPayload: any): Promise<any> {
    Logger.info('<Service>:<VehicleService>:<Update rc Details initiated>');

    try {
      const updateVehicle = await ParkAssistVehicle.findOneAndUpdate(
        {
          vehicleNumber: requestPayload.vehicleNumber,
          customerId: requestPayload.customerId
        },
        {
          $set: { rcDetails: requestPayload?.rcDetails }
        },
        {
          new: true
        }
      );

      return updateVehicle;
    } catch (err: any) {
      Logger.error(
        '<Service>:<VehicleService>:<Update rc Details failed>',
        err
      );
      throw new Error(err.message);
    }
  }
}
