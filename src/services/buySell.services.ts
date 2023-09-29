import { injectable } from 'inversify';
import Logger from '../config/winston';
import buySellVehicleInfo from './../models/BuySell';
import { IBuySell } from './../models/BuySell';
import User, { IUser } from './../models/User';
import Customer, { ICustomer } from './../models/Customer';
import { Types } from 'mongoose';
import _ from 'lodash';

@injectable()
export class BuySellService {
  async addSellVehicle(buySellVehicle?: IBuySell) {
    Logger.info(
      '<Service>:<BuySellService>:<Adding BuySell Vehicle initiated>'
    );
    const { userId } = buySellVehicle;
    Logger.debug(userId, buySellVehicle, 'result');
    const customer: ICustomer = await Customer.findOne({
      _id: new Types.ObjectId(userId)
    }).lean();
    Logger.debug(`user result ${customer}`);
    if (_.isEmpty(customer)) {
      throw new Error('User not found');
    }

    const query: IBuySell = buySellVehicle;
    const result = await buySellVehicleInfo.create(query);
    return result;
  }

  async getAllSellVehicleByUser(getVehicleRequest: { userId: string }) {
    const { userId } = getVehicleRequest;
    // Check if user exists
    Logger.debug(userId, getVehicleRequest, 'result');
    const user: IUser = await User.findOne({
      userId: new Types.ObjectId(userId)
    }).lean();
    Logger.debug(`user result ${user}`);
    if (_.isEmpty(user)) {
      throw new Error('User not found');
    }
    const allVehicles: IBuySell = await buySellVehicleInfo
      .find({
        userId: new Types.ObjectId(userId)
      })
      .lean();
    return allVehicles;
  }

  async updateSellVehicle(vehicleStore?: IBuySell) {
    Logger.info('<Service>:<BuySellService>: <Updating Vehicle intiiated>');
    Logger.debug(`vehicle result ${vehicleStore._id}`);
    // Check if vehicle exists
    const vehicle: IBuySell = await buySellVehicleInfo
      .findOne({
        _id: new Types.ObjectId(vehicleStore?._id)
      })
      .lean();
    if (_.isEmpty(vehicle)) {
      throw new Error('Sell Vehicle not found');
    }
    const newVehicleStore = {
      ...vehicleStore,
      _id: new Types.ObjectId(vehicleStore?._id)
    };

    const newVehicleItem: IBuySell = await buySellVehicleInfo.findOneAndUpdate(
      {
        _id: new Types.ObjectId(newVehicleStore._id)
      },
      newVehicleStore,
      { returnDocument: 'after' }
    );
    return newVehicleItem;
  }
}
