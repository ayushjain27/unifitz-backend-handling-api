import { injectable } from 'inversify';
import Logger from '../config/winston';
import buySellVehicleInfo from './../models/BuySell';

import { IBuySell } from './../models/BuySell';
import VehicleInfo, { IVehiclesInfo } from './../models/Vehicle';
import User, { IUser } from './../models/User';
import Customer, { ICustomer } from './../models/Customer';
import { Types, ObjectId } from 'mongoose';
import _ from 'lodash';
import { S3Service } from './s3.service';
import { TYPES } from '../config/inversify.types';
import container from '../config/inversify.container';
import { SurepassService } from './surepass.service';

@injectable()
export class BuySellService {
  private surepassService = container.get<SurepassService>(
    TYPES.SurepassService
  );
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  async addSellVehicle(buySellVehicle?: any) {
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
    // first check if the vehicle present in the vehicle db if yes update the db
    const vehicleDetails = await VehicleInfo.findOne({
      vehicleNumber: buySellVehicle.vehicleInfo?.vehicleNumber
    });
    let vehicleResult;
    if (_.isEmpty(vehicleDetails)) {
      vehicleResult = await VehicleInfo.create(buySellVehicle.vehicleInfo);
    } else {
      const vehicleDetails = {
        ...buySellVehicle.vehicleInfo,
        purpose: 'OWNED_BUY_SELL'
      };
      vehicleResult = await VehicleInfo.findOneAndUpdate(
        {
          vehicleNumber: buySellVehicle.vehicleInfo?.vehicleNumber
        },
        vehicleDetails,
        { returnDocument: 'after' }
      );
    }

    delete buySellVehicle['vehicleInfo'];
    const query = buySellVehicle;
    query.vehicleId = vehicleResult?._id.toString();
    query.vehicleInfo = vehicleResult?._id.toString();
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

  async updateSellVehicle(buySellVehicle?: any) {
    Logger.info('<Service>:<BuySellService>: <Updating Vehicle intiiated>');
    Logger.debug(`vehicle result ${buySellVehicle._id}`);
    // Check if vehicle exists
    const vehicle: IBuySell = await buySellVehicleInfo
      .findOne({
        _id: new Types.ObjectId(buySellVehicle?._id)
      })
      .lean();
    if (_.isEmpty(vehicle)) {
      throw new Error('Sell Vehicle not found');
    }
    const vehicleDetails = await VehicleInfo.findOne({
      _id: new Types.ObjectId(buySellVehicle?.vehicleId)
    });
    const vehicleResult = await VehicleInfo.findOneAndUpdate(
      {
        vehicleNumber: buySellVehicle?.vehicleInfo?.vehicleNumber,
        _id: buySellVehicle?.vehicleId
      },
      vehicleDetails,
      { returnDocument: 'after' }
    );
    const newVehicleStore = {
      ...buySellVehicle,
      _id: new Types.ObjectId(buySellVehicle?._id)
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
    const filterParams = { ...query, status: 'ACTIVE' };
    const result = await buySellVehicleInfo
      .find({ ...filterParams })
      .populate('vehicleInfo');
    return result;
  }
  async getOwnStoreDetails(req: any) {
    Logger.info(
      '<Service>:<BuySellService>:<Get all Buy Sell aggregation service initiated>'
    );
    const query: any = {};
    const result = await buySellVehicleInfo
      .find({
        'storeDetails.storeId': req?.storeId
      })
      .populate('vehicleInfo');
    let totalAmount = 0;
    let count = 0;
    let activeVeh: any = [];
    let nonActiveVeh: any = [];
    const activeVehicles: any = result.map((list: any) => {
      const date1 = new Date(list.createdAt);
      const date2 = new Date();
      totalAmount += Number(list?.expectedPrice);
      const Difference_In_Time = date2.getTime() - date1.getTime();
      const Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
      if (Difference_In_Days <= 45) {
        count += 1;
        const arr = [...activeVeh, { ...list }];
        activeVeh = arr;
        return count;
      }
      const arr = [...activeVeh, { ...list }];
      nonActiveVeh = arr;
      return count;
    });
    Logger.debug(
      `total length ${result.length}, ${totalAmount} ${activeVehicles}`
    );
    const allQuery: any = [
      { title: 'All Vehicles', total: result.length, list: result },
      { title: 'Total Value', amount: totalAmount },
      {
        title: 'Active Vehicles',
        total: activeVehicles[activeVehicles.length - 1] || 0,
        list: activeVeh || []
      },
      {
        title: 'Inactive Vehicles',
        total: result.length - activeVehicles[activeVehicles.length - 1] || 0,
        list: nonActiveVeh || []
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
    const buySellVehicleDetails = await VehicleInfo.findOne({
      _id: new Types.ObjectId(req?.body?.vehicleId)
    })?.lean();
    if (_.isEmpty(buySellVehicleDetails)) {
      throw new Error('Vehicle does not exist');
    }

    // const { vehicleNumber } = req.body;
    const files: Array<any> = req.files;
    // const vehicleInfo: IStoreCustomerVehicleInfo =
    //   storeCustomer.storeCustomerVehicleInfo[vehicleIndex];
    const vehicleImageList: Partial<IBuySell> | any =
      // buySellVehicleDetails
      //   .vehicleInfo.vehicleImageList ||
      {
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

  async checkVehicleExistance(vehicleNumber: string) {
    Logger.info(
      '<Service>:<BuySellService>:<Get all Buy vehhicle List initiated>'
    );
    const vehicleId = await VehicleInfo.findOne({
      vehicleNumber
    });
    const vehiclePresent: {
      storeDetails: { basicInfo: { businessName: '' } };
    } = await buySellVehicleInfo.findOne({
      vehicleId: String(vehicleId?._id)
    });
    if (!_.isEmpty(vehiclePresent)) {
      return {
        message: `This vehicle is already registered if you like to list same vehicles please contact our Support team 6360586465 or support@serviceplug.in`,
        isPresent: true
      };
    }
    const vehicleDetails = await this.surepassService.getRcDetails(
      vehicleNumber
    );
    return vehicleDetails;
  }

  async updateBuySellVehicleStatus(statusRequest: any) {
    console.log(statusRequest?.buySellVehicleId, 'dwfl');
    let buySellVehicle: IBuySell;
    buySellVehicle = await buySellVehicleInfo.findOne({
      vehicleId: statusRequest.buySellVehicleId
    });

    if (_.isEmpty(buySellVehicle)) {
      throw new Error('BuySell Vehicle does not exist');
    }

    const updatedVehicle = await buySellVehicleInfo.findOneAndUpdate(
      { vehicleId: statusRequest.buySellVehicleId },
      {
        $set: {
          status: statusRequest.status
        }
      },
      { returnDocument: 'after' }
    );
    Logger.info(
      '<Service>:<BuySellService>: <Vehicle: Vehicle status updated successfully>'
    );
    return updatedVehicle;
  }

  async getAllBuySellVehilce(req: any): Promise<IBuySell[]> {
    Logger.info('<Service>:<BuySellService>:<Get all buy sell vehicles>');

    let start;
    let end;

    const query: any = {
      'vehicleInfo.vehicleType': req.vehicleType
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
      delete query['vehicleInfo.vehicleType'];
    }
    Logger.debug(query);
    console.log(query, 'jbkhjj');
    let vehicleResponse: IBuySell[] = await buySellVehicleInfo
      .find({})
      .populate('vehicleInfo');
    vehicleResponse = vehicleResponse.filter((item: any) => {
      if (!_.isEmpty(query['vehicleInfo.vehicleType'])) {
        if (item.vehicleInfo.vehicleType !== query['vehicleInfo.vehicleType']) {
          return false;
        }
      }

      if (!_.isEmpty(query.createdAt)) {
        const createdAt = new Date(item.createdAt);
        if (
          !(
            createdAt >= query.createdAt['$gte'] &&
            createdAt <= query.createdAt['$lte']
          )
        ) {
          return false;
        }
      }

      return true;
    });

    return vehicleResponse;
  }

  async getBuySellDetailsByVehicleId(vehicleId: string): Promise<any> {
    Logger.info('<Service>:<BuySellService>:<Get all buy sell vehicles>');

    const vehicleResponse: IBuySell = await buySellVehicleInfo.findOne({
      vehicleId
    }).populate('vehicleInfo');;
    return vehicleResponse;
  }
}
