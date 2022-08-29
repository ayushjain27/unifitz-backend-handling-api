import VechicleInfo, { IVehiclesInfo } from './../models/Vehicle';
import { Types } from 'mongoose';
import { injectable } from 'inversify';
import _ from 'lodash';
import Logger from '../config/winston';
import User, { IUser } from './../models/User';

@injectable()
export class VehicleInfoService {
  async addVehicle(vehicleStore: IVehiclesInfo) {
    Logger.info('<Service>:<VehicleService>: <Adding Vehicle intiiated>');
    const {
      userId,
      purpose,
      manufactureYear,
      ownership,
      vehicleType,
      vehicleImage,
      vehicleNumber,
      category,
      brand,
      modelName,
      fuel
    } = vehicleStore;

    // Check if user exists
    const user: IUser = await User.findOne({ userId }).lean();
    if (_.isEmpty(user)) {
      throw new Error('User not found');
    }
    const newVehicleStore = {
      userId: new Types.ObjectId(userId),
      purpose,
      manufactureYear,
      ownership,
      vehicleType,
      vehicleImage,
      vehicleNumber,
      category,
      brand,
      modelName,
      fuel
    };

    const newVehicleItem: IVehiclesInfo = await VechicleInfo.create(
      newVehicleStore
    );
    return newVehicleItem;
  }
}
