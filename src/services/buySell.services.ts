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
          createdAt: 1,
          isOwner: 1,
          isDealer: 1,
          isAuthorised: 1,
          hpLoan: 1,
          insuranceExperience: 1,
          description: 1
        }
      }
    ]);
    return buyVehicleList;
  }

  async getAll() {
    Logger.info(
      '<Service>:<BuySellService>:<Get all Buy Sell aggregation service initiated>'
    );
    const query: any = {};
    const result = await buySellVehicleInfo.find(query).lean();
    const totalAmount = result.reduce(
      (a, b) => a + b.vehicleInfo.expectedPrice,
      0
    );
    let count = 0;
    const activeVehicles: any = result.map((list: any) => {
      const date1 = new Date(list.createdAt);
      const date2 = new Date();
      const Difference_In_Time = date2.getTime() - date1.getTime();
      const Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
      if (Difference_In_Days <= 45) {
        count += 1;
        return count;
      }
      return count;
    });
    Logger.debug(
      `total length ${result.length}, ${totalAmount} ${activeVehicles}`
    );
    const allQuery: any = {
      allVehicles: result.length,
      totalAmount: totalAmount,
      active: activeVehicles[activeVehicles.length - 1],
      inactive: result.length - activeVehicles[activeVehicles.length - 1]
    };
    return allQuery;
  }
}
