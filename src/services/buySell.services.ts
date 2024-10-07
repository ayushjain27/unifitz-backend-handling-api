import { injectable } from 'inversify';
import Logger from '../config/winston';
import buySellVehicleInfo, { ICustomerDetails } from './../models/BuySell';

import { IBuySell } from './../models/BuySell';
import VehicleInfo, { IVehiclesInfo } from './../models/Vehicle';
import User, { IUser } from './../models/User';
import Customer, { ICustomer } from './../models/Customer';
import { Types, ObjectId } from 'mongoose';
import _ from 'lodash';
import { S3Service } from './s3.service';
import Admin, { AdminRole } from './../models/Admin';
import { TYPES } from '../config/inversify.types';
import container from '../config/inversify.container';
import { SurepassService } from './surepass.service';
import SPEmployee from '../models/SPEmployee';

@injectable()
export class BuySellService {
  private surepassService = container.get<SurepassService>(
    TYPES.SurepassService
  );
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  async addSellVehicle(buySellVehicle?: any, role?: string) {
    Logger.info('<Service>:<BuySellService>:<Adding Sell Vehicle initiated>');
    const { userId } = buySellVehicle;

    // Check if user exists
    // const user: IUser = await User.findOne({
    //   _id: new Types.ObjectId(`${userId}`)
    // }).lean();
    // Logger.debug(`user result ${JSON.stringify(user)}`);
    // if (_.isEmpty(user)) {
    //   throw new Error('User not found');
    // }
    // first check if the vehicle present in the vehicle db if yes update the db
    const vehicleDetail = await VehicleInfo.findOne({
      vehicleNumber: buySellVehicle.vehicleInfo?.vehicleNumber
    });

    let vehicleResult;

    if (_.isEmpty(vehicleDetail)) {
      // Vehicle does not exist, create a new vehicle entry
      vehicleResult = await VehicleInfo.create(buySellVehicle.vehicleInfo);
    } else {
      // Vehicle exists, check if it is not sold
      const isVehicleNotSold = await buySellVehicleInfo.findOne({
        status: 'SOLD',
        vehicleId: String(vehicleDetail?._id)
      });
      if (!_.isEmpty(isVehicleNotSold)) {
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
    }

    let employeeDetail;
    let employeeDetails;

    if (!_.isEmpty(buySellVehicle?.employeeId) || role === 'EMPLOYEE') {
      employeeDetail = await Admin.findOne({
        userName: buySellVehicle?.employeeId || buySellVehicle?.oemUserName
      }).lean();

      if (employeeDetail) {
        employeeDetails = await SPEmployee.findOne({
          employeeId: employeeDetail?.employeeId,
          userName: employeeDetail?.oemId
        }).lean();
      }
    }

    console.log(role, 'dkmelf');

    delete buySellVehicle['vehicleInfo'];
    const query = buySellVehicle;
    query.vehicleId = vehicleResult?._id.toString();
    query.vehicleInfo = vehicleResult?._id.toString();
    if (!_.isEmpty(employeeDetail) || role === 'EMPLOYEE') {
      query.employeeId = employeeDetail?.userName;
      query.employeeName = employeeDetails?.name;
      query.employeePhoneNumber = employeeDetails?.phoneNumber?.primary;
    }
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

    if (_.isEmpty(vehicleDetails)) {
      throw new Error('Vehicle Details with that vehicle number not found');
    }
    const vehicleResult = await VehicleInfo.findOneAndUpdate(
      {
        vehicleNumber: buySellVehicle?.vehicleInfo?.vehicleNumber,
        _id: buySellVehicle?.vehicleId
      },
      buySellVehicle.vehicleInfo,
      { returnDocument: 'after' }
    );

    const employeeDetail = await Admin.findOne({
      userName: buySellVehicle?.employeeId
    }).lean();
    const employeeDetails = await SPEmployee.findOne({
      employeeId: employeeDetail?.employeeId,
      userName: employeeDetail?.oemId
    });

    delete buySellVehicle['vehicleInfo'];
    const query = buySellVehicle;
    query.vehicleId = vehicleResult?._id.toString();
    query.vehicleInfo = vehicleResult?._id.toString();
    query.employeeId = employeeDetail?.userName;
    query.employeeName = employeeDetails?.name;
    query.employeePhoneNumber = employeeDetails?.phoneNumber?.primary;
    const newVehicleStore = {
      ...query,
      VehicleInfo: buySellVehicle?.vehicleId,
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
    // Conditionally add the nested state field if query.state is not empty
    if (query.state) {
      filterParams['$or'] = [
        { 'storeDetails.contactInfo.state': query.state },
        { 'sellerDetails.contactInfo.state': query.state }
      ];
    }
    delete filterParams.state;
    delete filterParams.coordinates;

    console.log(filterParams, query, 'dfmkl');
    const result = await buySellVehicleInfo.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: query.coordinates
          },
          key: 'location',
          spherical: true,
          query: filterParams,
          distanceField: 'distance',
          distanceMultiplier: 0.001
        }
      },
      { $set: { VehicleInfo: { $toObjectId: '$vehicleId' } } },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'VehicleInfo',
          foreignField: '_id',
          as: 'vehicleInfo'
        }
      },
      { $unwind: { path: '$vehicleInfo' } }
    ]);
    return result;
  }
  async getOwnStoreDetails(req: any) {
    Logger.info(
      '<Service>:<BuySellService>:<Get all Buy Sell aggregation service initiated>'
    );

    const query: any = {
      'storeDetails.storeId': req?.storeId,
      'sellerDetails._id': req?.userId,
      brandName: req?.brandName,
      fuelType: req?.fuelType,
      gearType: req?.gearType,
      regType: req?.regType,
      vehType: req?.vehType
    };
    if (!_.isEmpty(req?.storeId) && !_.isEmpty(req?.state)) {
      query['storeDetails.contactInfo.state'] = req?.state;
    }
    if (!_.isEmpty(req?.userId) && !_.isEmpty(req?.state)) {
      query['sellerDetails.contactInfo.state'] = req?.state;
    }
    if (!req?.storeId) {
      delete query['storeDetails.storeId'];
    }
    if (!req?.userId) {
      delete query['sellerDetails._id'];
    }
    if (!req?.state) {
      delete query['storeDetails.contactInfo.state'];
      delete query['sellerDetails.contactInfo.state'];
    }
    if (!req?.brandName) {
      delete query.brandName;
    }
    if (!req?.fuelType) {
      delete query.fuelType;
    }
    if (!req?.gearType) {
      delete query.gearType;
    }
    if (!req?.regType) {
      delete query.regType;
    }
    if (!req?.vehType) {
      delete query.vehType;
    }

    const result = await buySellVehicleInfo.find(query).populate('vehicleInfo');
    let totalAmount = 0;
    let activeVehCount = 0;
    let inActiveVehCount = 0;
    let soldVehCount = 0;
    let draftVehCount = 0;

    let activeVeh: any = [];
    let nonActiveVeh: any = [];
    let soldVeh: any = [];
    let draftVeh: any = [];
    const activeVehicles: any = result.map((list: any) => {
      const date1 = new Date(list.createdAt);
      const date2 = new Date();
      const Difference_In_Time = date2.getTime() - date1.getTime();
      const Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
      if (list?.status === 'DRAFT') {
        totalAmount += Number(list?.expectedPrice);
        draftVehCount += 1;
        const arr = [...draftVeh, { ...list?._doc }];
        draftVeh = arr;
        return draftVehCount;
      } else if (Difference_In_Days <= 45 && list?.status === 'ACTIVE') {
        totalAmount += Number(list?.expectedPrice);
        activeVehCount += 1;
        const arr = [...activeVeh, { ...list?._doc }];
        activeVeh = arr;
        return activeVehCount;
      } else if (list?.status === 'INACTIVE') {
        totalAmount += Number(list?.expectedPrice);
        inActiveVehCount += 1;
        const arr = [...nonActiveVeh, { ...list?._doc }];
        nonActiveVeh = arr;
        return inActiveVehCount;
      } else if (list?.status === 'SOLD') {
        soldVehCount += 1;
        const arr = [...soldVeh, { ...list?._doc }];
        soldVeh = arr;
        return soldVehCount;
      }
    });
    Logger.debug(
      `total length ${result.length}, ${totalAmount} ${activeVehicles}`
    );

    let finalAmount = '';

    if (totalAmount >= 10000000) {
      finalAmount = `${(totalAmount / 10000000).toFixed(2)}Cr`;
    }
    if (totalAmount >= 100000 && totalAmount < 10000000) {
      finalAmount = `${(totalAmount / 100000).toFixed(2)}L`;
    }
    if (totalAmount >= 1000 && totalAmount < 100000) {
      finalAmount = `${(totalAmount / 1000).toFixed(2)}k`;
    }

    const allQuery: any = [
      {
        title: 'All Vehicles',
        total: activeVehCount + inActiveVehCount + draftVehCount || 0,
        list: activeVeh.concat(nonActiveVeh, draftVeh) || []
      },
      { title: 'Total Value', amount: finalAmount },
      {
        title: 'Active Vehicles',
        total: activeVehCount || 0,
        list: activeVeh || []
      },
      {
        title: 'Inactive Vehicles',
        total: inActiveVehCount || 0,
        list: nonActiveVeh || []
      },
      { title: 'Sold', total: soldVehCount || 0, list: soldVeh || [] },
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

    return updatedVehicle;
  }

  async checkVehicleExistance(vehicleNumber: string) {
    Logger.info(
      '<Service>:<BuySellService>:<Get all Buy vehhicle List initiated>'
    );
    const vehicleList = await VehicleInfo.find({ vehicleNumber });

    let vehiclePresent: any;
    for (const vehicle of vehicleList) {
      vehiclePresent = await buySellVehicleInfo.findOne({
        vehicleId: String(vehicle._id),
        status: { $ne: 'SOLD' }
      });
    }

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
    let buySellVehicle: IBuySell;
    buySellVehicle = await buySellVehicleInfo.findOne({
      vehicleId: statusRequest.buySellVehicleId
    });

    if (_.isEmpty(buySellVehicle)) {
      throw new Error('BuySell Vehicle does not exist');
    }

    const date = new Date();

    const updatedVehicle = await buySellVehicleInfo.findOneAndUpdate(
      { vehicleId: statusRequest.buySellVehicleId },
      {
        $set: {
          status: statusRequest.status,
          activeDate: statusRequest.status === 'ACTIVE' ? date : null
        }
      },
      { returnDocument: 'after' }
    );
    Logger.info(
      '<Service>:<BuySellService>: <Vehicle: Vehicle status updated successfully>'
    );
    return updatedVehicle;
  }

  async getAllBuySellVehilce(
    req: any,
    userName?: string,
    role?: string
  ): Promise<IBuySell[]> {
    Logger.info('<Service>:<BuySellService>:<Get all buy sell vehicles>');

    let start;
    let end;
    const userResult: any = {};

    const query: any = {
      'vehicleInfo.vehicleType': req.vehicleType,
      userType: req.userType,
      'storeDetails.storeId': req?.storeId,
      oemUserName: req?.userName,
      brandName: req?.brandName
    };

    if (!req.storeId) {
      delete query['storeDetails.storeId'];
    }
    if (!req.userName) {
      delete query['oemUserName'];
    }
    if (!req.brandName) {
      delete query['brandName'];
    }

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
      delete query['vehicleInfo.vehicleType'];
    }

    if (!req.userType) {
      delete query['userType'];
    }
    console.log(query, 'dfwel;');

    Logger.debug(query);
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = req?.oemId;
    }

    if (req?.oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    let vehicleResponse: IBuySell[] = await buySellVehicleInfo.aggregate([
      {
        $match: query
      },
      { $set: { VehicleId: { $toString: '$_id' } } },
      {
        $lookup: {
          from: 'vehicleanalytics',
          localField: 'VehicleId',
          foreignField: 'moduleInformation',
          as: 'vehicleAnalytic'
        }
      },
      { $set: { VehicleInfo: { $toObjectId: '$vehicleId' } } },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'VehicleInfo',
          foreignField: '_id',
          as: 'vehicleInfo'
        }
      },
      {
        $set: {
          impressionCount: {
            $size: {
              $filter: {
                input: '$vehicleAnalytic',
                as: 'item',
                cond: { $eq: ['$$item.event', 'IMPRESSION_COUNT'] }
              }
            }
          },
          vehicleDetailClick: {
            $size: {
              $filter: {
                input: '$vehicleAnalytic',
                as: 'item',
                cond: { $eq: ['$$item.event', 'VEHICLE_DETAIL_CLICK'] }
              }
            }
          },
          executivePhoneNo: {
            $size: {
              $filter: {
                input: '$vehicleAnalytic',
                as: 'item',
                cond: { $eq: ['$$item.event', 'EXECUTIVE_PHONE_NUMBER_CLICK'] }
              }
            }
          },
          storePhoneNo: {
            $size: {
              $filter: {
                input: '$vehicleAnalytic',
                as: 'item',
                cond: { $eq: ['$$item.event', 'STORE_PHONE_NUMBER_CLICK'] }
              }
            }
          },
          locationClickCount: {
            $size: {
              $filter: {
                input: '$vehicleAnalytic',
                as: 'item',
                cond: { $eq: ['$$item.event', 'LOCATION_CLICK'] }
              }
            }
          }
        }
      },
      { $unwind: { path: '$vehicleInfo' } }
      // {
      //   $project: { vehicleAnalytic: 0 }
      // }
    ]);
    vehicleResponse = vehicleResponse.filter((item: any) => {
      if (!_.isEmpty(query['vehicleInfo.vehicleType'])) {
        if (item.vehicleInfo.vehicleType !== query['vehicleInfo.vehicleType']) {
          return false;
        }
      }

      if (!_.isEmpty(query.userType)) {
        if (item.userType !== query.userType) {
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

    const vehicleResponse: IBuySell = await buySellVehicleInfo
      .findOne({
        vehicleId
      })
      .populate('vehicleInfo');
    return vehicleResponse;
  }

  async deleteVehicle(vehicleId: string): Promise<any> {
    Logger.info(
      '<Service>:<BuySellService>:<Delete vehicle by Id service initiated>'
    );
    const res = await buySellVehicleInfo.findOneAndDelete({
      vehicleId: vehicleId
    });
    const vehicleDelete = await VehicleInfo.findOneAndDelete({
      _id: new Types.ObjectId(vehicleId)
    });
    return res;
  }

  async updateBuySellVehicleCustomerDetails(request: any) {
    let buySellVehicle: IBuySell;
    buySellVehicle = await buySellVehicleInfo.findOne({
      _id: new Types.ObjectId(request.id)
    });

    if (_.isEmpty(buySellVehicle)) {
      throw new Error('BuySell Vehicle does not exist');
    }

    const updatedVehicle = await buySellVehicleInfo.findOneAndUpdate(
      { _id: new Types.ObjectId(request.id) },
      {
        $set: {
          customerDetails: request.customerDetails
        }
      },
      { returnDocument: 'after' }
    );
    Logger.info(
      '<Service>:<BuySellService>: <Vehicle: Vehicle customer Details updated successfully>'
    );
    return updatedVehicle;
  }

  async uploadPanAadharImage(customerDetailsId: string, req: Request | any) {
    Logger.info(
      '<Service>:<BuySellService>:<Customer Details image uploading>'
    );
    const customer = await buySellVehicleInfo
      .findOne({
        _id: new Types.ObjectId(customerDetailsId)
      })
      .lean();

    if (_.isEmpty(customer)) {
      throw new Error('Customer does not exist');
    }

    const file: any = req.file;
    if (!file) {
      throw new Error('Files not found');
    }

    const fileName = 'profile';
    const { url } = await this.s3Client.uploadFile(
      customerDetailsId,
      fileName,
      file.buffer
    );

    const profileImageUrl = url;

    const res = await buySellVehicleInfo.findOneAndUpdate(
      { _id: new Types.ObjectId(customerDetailsId) },
      { $set: { 'customerDetails.aadharPanCardImage': profileImageUrl } },
      { returnDocument: 'after' } // Ensures the updated document is returned
    );

    return res;
  }
}
