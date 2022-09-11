import VechicleInfo, {
  IVehiclesInfo,
  IVehicleImage
} from './../models/Vehicle';
import { Types } from 'mongoose';
import { injectable } from 'inversify';
import _ from 'lodash';
import Logger from '../config/winston';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';

import { S3Service } from './s3.service';

import User, { IUser } from './../models/User';

@injectable()
export class VehicleInfoService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async addOrUpdateVehicle(vehicleStore: IVehiclesInfo) {
    Logger.info('<Service>:<VehicleService>: <Adding Vehicle intiiated>');
    const {
      vehicleId,
      userId,
      purpose,
      manufactureYear,
      ownership,
      vehicleType,
      vehicleImageList,
      vehicleNumber,
      category,
      brand,
      modelName,
      fuel
    } = vehicleStore;

    // Check if user exists
    const user: IUser = await User.findOne({
      userId: new Types.ObjectId(userId)
    }).lean();
    if (_.isEmpty(user)) {
      throw new Error('User not found');
    }
    const newVehicleStore = {
      userId: new Types.ObjectId(userId),
      purpose,
      manufactureYear,
      ownership,
      vehicleType,
      vehicleImageList,
      vehicleNumber,
      category,
      brand,
      modelName,
      fuel
    };

    let newVehicleItem: IVehiclesInfo;

    if (_.isEmpty(vehicleId)) {
      newVehicleItem = await VechicleInfo.create(newVehicleStore);
    } else {
      newVehicleItem = await VechicleInfo.findOneAndUpdate(
        {
          _id: new Types.ObjectId(vehicleId)
        },
        newVehicleStore,
        { returnDocument: 'after' }
      );
    }

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
}
