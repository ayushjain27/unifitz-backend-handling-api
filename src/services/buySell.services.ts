import { injectable } from 'inversify';
import Logger from '../config/winston';
import buySellVehicleInfo from './../models/BuySell';
import { IBuySell } from './../models/BuySell';
import User, { IUser } from './../models/User';
import Customer, { ICustomer } from './../models/Customer';
import { Types, ObjectId } from 'mongoose';
import _ from 'lodash';
import { S3Service } from './s3.service';
import { TYPES } from '../config/inversify.types';
import container from '../config/inversify.container';

@injectable()
export class BuySellService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
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

  async getAllBuyVehicles(query: any) {
    Logger.info(
      '<Service>:<BuySellService>:<Get all Buy vehhicle List initiated>'
    );
    const filterParams = query;
    let result;
    if (_.isEmpty(filterParams)) {
      result = await buySellVehicleInfo.find({}).lean();
    } else result = await buySellVehicleInfo.find({ ...filterParams }).lean();
    return result;
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
    const allQuery: any = [
      { title: 'All Vehicles', total: result.length },
      { title: 'Total Value', amount: totalAmount },
      {
        title: 'Active Vehicles',
        total: activeVehicles[activeVehicles.length - 1]
      },
      {
        title: 'Inactive Vehicles',
        total: result.length - activeVehicles[activeVehicles.length - 1]
      },
      { title: 'Sold', total: 0 },
      { title: 'Enquiry', total: 0 }
    ];
    return allQuery;
  }

  async uploadStoreCustomerVehicleImages(req: Request | any): Promise<any> {
    Logger.info(
      '<Service>:<BuySellService>:<Upload Buy Sell Vehicle Images initiated>'
    );
    const buySellVehicleDetails = await buySellVehicleInfo
      .findOne({
        'vehicleInfo.vehicleNumber': req?.body?.vehicleNumber
      })
      ?.lean();
    if (_.isEmpty(buySellVehicleDetails)) {
      throw new Error('Vehicle does not exist');
    }

    // const { vehicleNumber } = req.body;
    const files: Array<any> = req.files;
    // const vehicleInfo: IStoreCustomerVehicleInfo =
    //   storeCustomer.storeCustomerVehicleInfo[vehicleIndex];
    const vehicleImageList: Partial<IBuySell> | any =
    buySellVehicleDetails.vehicleInfo.vehicleImageList || {
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
        req.body.vehicleNumber,
        fileName,
        file.buffer
      );
      vehicleImageList[fileName] = { key, docURL: url };
    }
    Logger.info('<Service>:<VehicleService>:<Upload all images - successful>');
    Logger.info('<Service>:<VehicleService>:<Updating the vehicle info>');
    // console.log(req.body.vehicleNumber, 'Sdwl');
    const updatedVehicle = await buySellVehicleInfo.findOneAndUpdate(
      {
        'vehicleInfo.vehicleNumber': req?.body?.vehicleNumber
      },
      {
        $set: {
          'vehicleInfo.vehicleImageList': vehicleImageList
          // [`storeCustomerVehicleInfo.${vehicleIndex}.vehicleImageList`]:
        }
      },
      { returnDocument: 'after' }
    );
    // console.log(updatedVehicle, 'd,l;sf');
    return updatedVehicle;
  }
}
