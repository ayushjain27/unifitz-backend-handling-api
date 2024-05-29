/* eslint-disable no-console */
import VehicleInfo, {
  IVehiclesInfo,
  IVehicleImage,
  vehicleInfoSchema,
  IVehicleImageList
} from './../models/Vehicle';
import { Types } from 'mongoose';
import { injectable } from 'inversify';
import _ from 'lodash';
import Logger from '../config/winston';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';

import { S3Service } from './s3.service';

import User, { IUser } from './../models/User';
import { SurepassService } from './surepass.service';

@injectable()
export class VehicleInfoService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private surepassService = container.get<SurepassService>(
    TYPES.SurepassService
  );

  async addVehicle(vehicleStore: IVehiclesInfo) {
    Logger.info('<Service>:<VehicleService>: <Adding Vehicle intiiated>');

    // Check if user exists
    const user: IUser = await User.findOne({
      userId: new Types.ObjectId(vehicleStore.userId)
    }).lean();
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
    }else if(vehicleDetails?.purpose === 'BUY_SELL'){
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
    }else{
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

  async getAllVehicleByUser(getVehicleRequest: {
    userId: string;
    purpose: string;
  }) {
    const { userId, purpose } = getVehicleRequest;
    // Check if user exists
    const user: IUser = await User.findOne({
      userId: new Types.ObjectId(userId)
    }).lean();
    if (_.isEmpty(user)) {
      throw new Error('User not found');
    }

    const allVehicles = await VehicleInfo.find({
      userId: new Types.ObjectId(userId),
      purpose
    }).lean();
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

  async vehicleDetailsFromRC(reqBody: { vehicleNumber: string }): Promise<any> {
    Logger.info(
      '<Service>:<VehicleService>:<Initiate fetching vehicle Details>'
    );
    // validate the store from user phone number and user id
    const { vehicleNumber } = reqBody;
    const vehiclePresent = await VehicleInfo.findOne({
      vehicleNumber
    });
    if (!_.isEmpty(vehiclePresent)) {
      return {
        message: `This vehicle is already registered if you like to list same vehicles please contact our Support team 6360586465 or support@serviceplug.in`
      };
    }
    try {
      // get the store data
      const vehicleDetails = await this.surepassService.getRcDetails(
        vehicleNumber
      );
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
    const user: IUser = await User.findOne({
      userId: new Types.ObjectId(vehiclePayload.userId)
    }).lean();
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

  async getAll(req: any): Promise<IVehiclesInfo[]> {
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
      console.log(start.toISOString(), end.toISOString(), 'fdwrasfefdwr');

      query.createdAt = { $gte: start, $lte: end };
    }
    if (!req.vehicleType) {
      delete query['vehicleType'];
    }
    const vehicleResponse: IVehiclesInfo[] = await VehicleInfo.find(query);
    return vehicleResponse;
  }
}
