/* eslint-disable no-console */
import VechicleInfo, {
  IVehiclesInfo,
  IVehicleImage,
  vehicleInfoSchema
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
    const newVehicleStore = {
      ...vehicleStore,
      userId: new Types.ObjectId(vehicleStore.userId)
    };

    const newVehicleItem: IVehiclesInfo = await VechicleInfo.create(
      newVehicleStore
    );
    Logger.info('<Service>:<VehicleService>:<Vehicle created successfully>');
    return newVehicleItem;
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

    const allVehicles = await VechicleInfo.find({
      userId: new Types.ObjectId(userId),
      purpose
    }).lean();
    return allVehicles;
  }

  async uploadVehicleImages(
    vehicleId: string,
    req: Request | any
  ): Promise<any> {
    Logger.info('<Service>:<VehicleService>:<Upload Banner initiated>');

    const vehicleInfo: IVehiclesInfo = await VechicleInfo.findOne({
      _id: new Types.ObjectId(vehicleId)
    });
    if (_.isEmpty(vehicleInfo)) {
      throw new Error('Vehicle does not exist');
    }

    const files: Array<any> = req.files;

    if (!files) {
      throw new Error('Files not found');
    }

    const vehicleImages = [];

    for (const file of files) {
      const fileName: string = file.originalname;

      const { key, url } = await this.s3Client.uploadFile(
        'vehicle',
        fileName,
        file.buffer
      );
      const vehImage = { title: fileName, key, url };

      vehicleImages.push(vehImage);
      Logger.info(
        `<Service>:<VehicleService>:<Upload file for ${fileName} - successful>`
      );
    }

    Logger.info(`<Service>:<VehicleService>:<Upload all images - successful>`);

    Logger.info(`<Service>:<VehicleService>:<Updating the vehicle info>`);

    const updatedVehicle = await VechicleInfo.findOneAndUpdate(
      {
        _id: new Types.ObjectId(vehicleId)
      },
      {
        $set: {
          vehicleImageList: vehicleImages
        }
      },
      { returnDocument: 'after' }
    );

    return updatedVehicle;
  }

  async updateOrDeleteVehicleImage(
    reqBody: {
      vehicleId: string;
      vehicleImageKey: string;
    },
    req: Request | any
  ) {
    Logger.info('<Service>:<VehicleService>:<Upload Banner initiated>');
    const { vehicleId, vehicleImageKey } = reqBody;

    const vehicleInfo: IVehiclesInfo = await VechicleInfo.findOne({
      _id: new Types.ObjectId(vehicleId)
    });
    if (_.isEmpty(vehicleInfo)) {
      throw new Error('Vehicle does not exist');
    }
    const vehImageList = [...vehicleInfo.vehicleImageList];

    const file = req.file;

    if (!vehicleImageKey) {
      throw new Error('No Old Image reference found');
    }
    const updInd = _.findIndex(
      vehImageList,
      (vehImg: IVehicleImage) => vehImg.key === vehicleImageKey
    );

    if (!file) {
      vehImageList.splice(updInd, 1);
      await this.s3Client.deleteFile(vehicleImageKey);
    } else {
      const { key, url } = await this.s3Client.replaceFile(
        vehicleImageKey,
        file.buffer
      );
      vehImageList[updInd] = { ...vehImageList[updInd], key, url };
    }

    Logger.info(`<Service>:<VehicleService>:<Upload all images - successful>`);

    Logger.info(`<Service>:<VehicleService>:<Updating the vehicle info>`);

    const updatedVehicle = await VechicleInfo.findOneAndUpdate(
      {
        _id: new Types.ObjectId(vehicleId)
      },
      {
        $set: {
          vehicleImageList: vehImageList
        }
      },
      { returnDocument: 'after' }
    );

    return updatedVehicle;
  }

  async vehicleDetailsFromRC(reqBody: { vehicleNumber: string }): Promise<any> {
    Logger.info(
      '<Service>:<VehicleService>:<Initiate fetching vehicle Details>'
    );
    // validate the store from user phone number and user id
    const { vehicleNumber } = reqBody;
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
    const vehicle: IVehiclesInfo = await VechicleInfo.findOne({
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
      vehicle = await VechicleInfo.findOne({
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

    updatedVehicle = await VechicleInfo.findOneAndUpdate(
      { _id: new Types.ObjectId(vehicleId) },
      updatedVehicle,
      { returnDocument: 'after' }
    );
    Logger.info('<Service>:<VehicleService>:<Vehicle updated successfully>');
    return updatedVehicle;
  }
}
