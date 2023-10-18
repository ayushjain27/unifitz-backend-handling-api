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
    Logger.info('<Service>:<BuySellService>:<Adding Sell Vehicle initiated>');
    const { userId } = buySellVehicle;

    // Check if user exists
    const user: IUser = await User.findOne({
      _id: new Types.ObjectId(`${userId}`)
    }).lean();
    Logger.debug(`user result ${JSON.stringify(user)}`);
    if (_.isEmpty(user)) {
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

  async getAllBuyVehicleById(getVehicleRequest: { vehicleId: string }) {
    const { vehicleId } = getVehicleRequest;

    const allVehicles: IBuySell = await buySellVehicleInfo
      .find({
        _id: new Types.ObjectId(vehicleId)
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

  async getBuyVehicle(
    pageNo: number,
    pageSize: number,
    status: string,
    userType: string,
    subCategory: string,
    brand: string
  ) {
    Logger.info('<Service>:<ProductService>:<Get buy Vehicle lists initiate>');
    const query = {
      status: status,
      userType: userType,
      'vehicleInfo.category': subCategory,
      'vehicleInfo.brand': brand
    };
    if (!subCategory) {
      delete query['vehicleInfo.category'];
    }
    if (!brand) {
      delete query['vehicleInfo.brand'];
    }
    const buyVehicleList = await buySellVehicleInfo.aggregate([
      {
        $match: query
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'customers',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $skip: pageNo * pageSize
      },
      {
        $limit: pageSize
      },
      {
        $project: {
          _id: 1,
          vehicleId: 1,
          userId: 1,
          vehicleInfo: 1,
          userType: 1,
          status: 1,
          transactionDetails: 1,
          contactInfo: 1,
          createdAt: 1
        }
      }
    ]);
    return buyVehicleList;
  }
}
