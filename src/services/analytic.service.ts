import { body } from 'express-validator';
import { injectable } from 'inversify';
import Logger from '../config/winston';
import { AdminRole } from './../models/Admin';
import { StoreResponse } from '../interfaces';
// import {
//   CategoryResponse,
//   CategoryRequest
// } from '../interfaces/category.interface';
import _, { isEmpty } from 'lodash';
import Store from '../models/Store';
import Customer from '../models/Customer';
import Admin from '../models/Admin';
import { Types } from 'mongoose';
import User from '../models/User';
import container from '../config/inversify.container';
import { S3Service } from './s3.service';
import { TYPES } from '../config/inversify.types';
import EventModel from './../models/Event';
import VehicleAnalyticModel from './../models/VehicleAnalytic';
import NewVehicleAnalyticModel from './../models/NewVehicleAnalytic';
import MarketingAnalyticModel from './../models/MarketingAnalytic';
import Marketing from './../models/Marketing';
import OfferModel from './../models/Offers';
import SchoolOfAutoModel from '../models/SchoolOfAuto';
import BusinessModel from '../models/Business';
import EventAnalyticModel, {
  IEventAnalytic
} from '../models/CustomerEventAnalytic';
import PartnerAnalyticModel from '../models/PartnerAnalytic';
import PlusFeatureAnalyticModel from '../models/PlusFeaturesAnalytic';
import { SPEmployeeService } from './spEmployee.service';

@injectable()
export class AnalyticService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private spEmployeeService = container.get<SPEmployeeService>(
    TYPES.SPEmployeeService
  );

  async getTotalCustomers(searchReqBody: {
    startDate: string;
    endDate: string;
    state: string;
    city: string;
    employeeId: string;
    role: string;
    userName: string;
    oemId: string;
  }) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all Category service initiated>'
    );

    const query: any = {};
    let startDate;
    let endDate;
    if (searchReqBody?.startDate && searchReqBody?.endDate) {
      startDate = new Date(searchReqBody.startDate);
      startDate.setDate(startDate.getDate());
      startDate.setUTCHours(0, 0, 0, 0);

      endDate = new Date(searchReqBody.endDate);
      endDate.setDate(endDate.getDate());
      endDate.setUTCHours(23, 59, 59, 999);
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    if (searchReqBody.role === AdminRole.EMPLOYEE && !isEmpty(searchReqBody?.employeeId)) {
      const employeeId = searchReqBody?.employeeId;
      const userName = searchReqBody?.oemId;
      const employeeDetails =
        await this.spEmployeeService.getEmployeeByEmployeeId(
          employeeId,
          userName
        );
      if (employeeDetails) {
        query['contactInfo.state'] = {
          $in: employeeDetails.state.map((stateObj) => stateObj.name)
        };
        if (!isEmpty(employeeDetails?.city)) {
          query['contactInfo.city'] = {
            $in: employeeDetails.city.map((cityObj) => cityObj.name)
          };
        }
      }
    }

    if (searchReqBody.state) {
      query['contactInfo.state'] = { $in: searchReqBody.state };
    }
    if (searchReqBody.city) {
      query['contactInfo.city'] = { $in: searchReqBody.city };
    }

    Logger.debug(query);
    const result = await Customer.find(query).countDocuments();
    return { total: result };
  }

  async getVerifiedStores(
    userName: string,
    role: string,
    oemId?: string,
    oemUserId?: string,
    state?: string,
    city?: string,
    employeeId?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all Category service initiated>'
    );
    const query: any = {};
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      if(oemId !== 'SERVICEPLUG'){
      query.oemUserName = oemId;
      }
      const employeeDetails =
        await this.spEmployeeService.getEmployeeByEmployeeId(
          employeeId,
          oemId
        );
      if (employeeDetails) {
        query['contactInfo.state'] = {
          $in: employeeDetails.state.map((stateObj) => stateObj.name)
        };
        if (!isEmpty(employeeDetails?.city)) {
          query['contactInfo.city'] = {
            $in: employeeDetails.city.map((cityObj) => cityObj.name)
          };
        }
      }
    }

    if (state) {
      query['contactInfo.state'] = state;
    }
    if (city) {
      query['contactInfo.city'] = city;
    }
    if (oemUserId) {
      query.oemUserName = oemUserId;
    }

    const gstVerStores = await Store.countDocuments({
      'verificationDetails.documentType': 'GST',
      profileStatus: 'ONBOARDED',
      ...query
    });
    const aadharVerStores = await Store.countDocuments({
      'verificationDetails.documentType': 'AADHAR',
      profileStatus: 'ONBOARDED',
      ...query
    });
    return { gstVerified: gstVerStores, aadharVerified: aadharVerStores };
  }

  async getTotalUsers(userName: string, role: string, payload: any) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all users service initiated>'
    );
    const query: any = {};
    if (role === AdminRole.OEM) {
      query.$or = [{ userName: userName }, { createdOemUser: userName }];
    }
    if (role === AdminRole.EMPLOYEE) {
      if(payload?.oemId !== 'SERVICEPLUG'){
      query.userName = payload?.oemId;
      }
      const employeeDetails =
        await this.spEmployeeService.getEmployeeByEmployeeId(
          payload.employeeId,
          payload.oemId
        );
      if (employeeDetails) {
        query['contactInfo.state'] = {
          $in: employeeDetails.state.map((stateObj) => stateObj.name)
        };
        if (!isEmpty(employeeDetails?.city)) {
          query['contactInfo.city'] = {
            $in: employeeDetails.city.map((cityObj) => cityObj.name)
          };
        }
      }
    }

    if (payload?.state) {
      query['contactInfo.state'] = payload.state;
    }
    if (payload?.city) {
      query['contactInfo.city'] = payload.city;
    }
    if (payload?.oemUserId) {
      query.userName = payload?.oemUserId;
    }
    const queryFilter: any = await Admin.find(query, {
      'verificationDetails.verifyObj': 0
    });
    const totalManu = queryFilter.filter(
      (val: any) => val.companyType === 'Manufacturer'
    ).length;
    const totalDist = queryFilter.filter(
      (val: any) => val.companyType === 'Distributer'
    ).length;
    const totalDealer = queryFilter.filter(
      (val: any) => val.companyType === 'Dealer'
    ).length;
    return {
      totalManufacturer: totalManu,
      totalDistributers: totalDist,
      totalDealers: totalDealer
    };
  }

  async searchAndFilterStoreData(searchReqBody: {
    startDate: string;
    endDate: string;
    subCategory: string;
    category: string;
    state: string;
    city: string;
    role?: string;
    userName?: string;
    oemId?: string;
    oemUserId?: string;
    brandName?: string;
    storeId?: string;
    employeeId?: string;
  }) {
    Logger.info(
      '<Service>:<StoreService>:<Search and Filter stores service initiated>'
    );

    const query: any = {
      profileStatus: 'ONBOARDED'
    };

    let startDate;
    let endDate;
    if (searchReqBody?.startDate && searchReqBody?.endDate) {
      startDate = new Date(searchReqBody.startDate);
      startDate.setDate(startDate.getDate() + 1);
      startDate.setUTCHours(0, 0, 0, 0);

      endDate = new Date(searchReqBody.endDate);
      endDate.setDate(endDate.getDate() + 1);
      endDate.setUTCHours(23, 59, 59, 999);
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    if (searchReqBody.storeId) {
      query.storeId = searchReqBody.storeId;
    }
    if (searchReqBody.oemUserId) {
      query.oemUserName = searchReqBody.oemUserId;
    }
    if (searchReqBody.category) {
      query['basicInfo.category.name'] = { $in: searchReqBody.category };
    }
    if (searchReqBody.subCategory) {
      query['basicInfo.subCategory.name'] = { $in: searchReqBody.subCategory };
    }
    if (searchReqBody.brandName) {
      query['basicInfo.brand.name'] = { $in: searchReqBody.brandName };
    }

    if (searchReqBody.role === AdminRole.EMPLOYEE && !isEmpty(searchReqBody?.employeeId)) {
      const employeeId = searchReqBody?.employeeId;
      const userName = searchReqBody?.oemId;
      const employeeDetails =
        await this.spEmployeeService.getEmployeeByEmployeeId(
          employeeId,
          userName
        );
      if (employeeDetails) {
        query['contactInfo.state'] = {
          $in: employeeDetails.state.map((stateObj) => stateObj.name)
        };
        if (!isEmpty(employeeDetails?.city)) {
          query['contactInfo.city'] = {
            $in: employeeDetails.city.map((cityObj) => cityObj.name)
          };
        }
      }
    }
    if (searchReqBody.state) {
      query['contactInfo.state'] = { $in: searchReqBody.state };
    }
    if (searchReqBody.city) {
      query['contactInfo.city'] = { $in: searchReqBody.city };
    }
    Logger.debug(query);

    if (searchReqBody.role === AdminRole.OEM) {
      query.oemUserName = searchReqBody.userName;
    }

    if (searchReqBody.role === AdminRole.EMPLOYEE) {
      query.oemUserName = searchReqBody.oemId;
    }

    if (searchReqBody.oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }

    const res = await Store.find(query, {
      _id: 1, // Keep _id (optional)
      'contactInfo.geoLocation.coordinates': 1 // Include only coordinates
    });
    return res;
  }

  async getPlusFeatureData(searchReqBody: {
    startDate: string;
    endDate: string;
    subCategory: string;
    category: string;
    state: string;
    city: string;
    role?: string;
    userName?: string;
    oemId?: string;
  }) {
    Logger.info(
      '<Service>:<StoreService>:<Search and Filter stores service initiated>'
    );

    let startDate = null;
    let endDate = null;
    if (searchReqBody.startDate) {
      startDate = new Date(searchReqBody.startDate.toString());
      endDate = new Date(searchReqBody.endDate.toString());
      endDate.setDate(endDate.getDate() + 1);
    }

    const query: any = {
      'category.name': { $in: searchReqBody.category },
      'subCategory.name': { $in: searchReqBody.subCategory },
      state: { $in: searchReqBody.state },
      city: { $in: searchReqBody.city },
      createdAt: { $gte: startDate, $lt: endDate }
    };
    if (!searchReqBody.category) {
      delete query['category.name'];
    }
    if (!searchReqBody.subCategory || searchReqBody.subCategory.length === 0) {
      delete query['subCategory.name'];
    }
    if (!searchReqBody.state) {
      delete query['state'];
    }
    if (!searchReqBody.city) {
      delete query['city'];
    }
    if (!startDate && !endDate) {
      delete query.createdAt;
    }
    Logger.debug(query);

    // let res: any[] = [];
    if (searchReqBody.role === AdminRole.OEM) {
      query.oemUserName = searchReqBody.userName;
    }

    if (searchReqBody.role === AdminRole.EMPLOYEE) {
      query.oemUserName = searchReqBody.oemId;
    }

    if (searchReqBody.oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }

    const [offer, event, business, schoolOfAuto]: any = await Promise.all([
      OfferModel.find(query, {
        'verificationDetails.verifyObj': 0
      }),
      EventModel.find(query, {
        'verificationDetails.verifyObj': 0
      }),
      BusinessModel.find(query, {
        'verificationDetails.verifyObj': 0
      }),
      SchoolOfAutoModel.find(query, {
        'verificationDetails.verifyObj': 0
      })
    ]);

    const templateData = {
      offer: offer,
      event: event,
      business: business,
      schoolOfAuto: schoolOfAuto
    };

    return templateData;
  }

  async createEventAnalytic(requestData: any): Promise<any> {
    let userResult: any = {};
    const userData: any = {};
    const eventResult = requestData;
    if (
      requestData.event === 'LOGIN_PHONE' ||
      requestData.event === 'LOGIN_WEB' ||
      requestData.event === 'LOGIN_OTP_VERIFY'
    ) {
      const getByPhoneNumber = {
        phoneNumber: requestData.phoneNumber,
        role: 'USER'
      };
      userResult = await User.findOne(getByPhoneNumber);
    } else {
      userResult = await User.findOne({
        _id: new Types.ObjectId(requestData.userId)
      });

      if (_.isEmpty(userResult)) {
        throw new Error('User does not exist');
      }
    }

    const customerResponse = await Customer.findOne({
      phoneNumber: `+91${userResult.phoneNumber.slice(-10)}`
    });

    userData.userId = userResult?._id || requestData.userId;
    userData.fullName = customerResponse?.fullName || '';
    userData.email = customerResponse?.email || '';
    userData.phoneNumber = requestData.phoneNumber || '';
    userData.geoLocation = {
      type: 'Point',
      coordinates: requestData?.coordinates
    };
    userData.address = requestData?.address || '';
    userData.state = requestData?.state || '';
    userData.city = requestData?.city || '';

    eventResult.userInformation = userData;

    Logger.info(
      '<Service>:<CategoryService>:<Create analytic service initiated>'
    );
    let newAnalytic: any = [];
    if (!_.isEmpty(eventResult)) {
      newAnalytic = await EventAnalyticModel.create(eventResult);
    }
    Logger.info('<Service>:<CategoryService>:<analytic created successfully>');
    return newAnalytic;
  }

  async getEventAnalytic(
    role: string,
    userName: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    storeId: string,
    platform: string,
    oemId?: string,
    adminFilterOemId?: string,
    brandName?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    // const currentDate = new Date(lastDay);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);
    query = {
      'userInformation.state': state,
      'userInformation.city': city,
      createdAt: {
        $gte: firstDay,
        $lte: nextDate
      },
      platform: platform,
      event: 'IMPRESSION_COUNT',
      moduleInformation: storeId,
      oemUserName: adminFilterOemId
    };
    if (!adminFilterOemId) {
      delete query['oemUserName'];
    }
    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    if (!platform) {
      delete query['platform'];
    }
    if (!storeId) {
      delete query['moduleInformation'];
    }
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    Logger.debug(`${JSON.stringify(query)} ${role} ${userName} datateee`);
    // const c_Date = new Date();

    const queryFilter: any = await EventAnalyticModel.aggregate([
      {
        $match: query
      },
      {
        $project: {
          createdAt: 1,
          groupId: {
            $dateFromParts: {
              year: {
                $year: '$createdAt'
              },
              month: {
                $month: '$createdAt'
              },
              day: {
                $dayOfMonth: '$createdAt'
              },
              hour: {
                $cond: [
                  {
                    $gte: [
                      {
                        $dateDiff: {
                          startDate: firstDay,
                          endDate: lastDay,
                          unit: 'day'
                        }
                      },
                      1
                    ]
                  },
                  0,
                  {
                    $hour: '$createdAt'
                  }
                ]
              }
            }
          },
          moduleInformation: 1
        }
      },
      {
        $group: {
          _id: {
            createdAt: '$createdAt',
            groupId: '$groupId',
            store: '$moduleInformation'
          }
        }
      },
      {
        $group: {
          _id: '$_id.groupId',
          views: {
            $sum: 1
          }
          // stores: {
          //   $push: {
          //     store: '$_id.store'
          //   }
          // }
        }
      },
      // {
      //   $addFields: {
      //     stores: {
      //       $map: {
      //         input: {
      //           $setUnion: '$stores'
      //         },
      //         as: 'j',
      //         in: {
      //           storeName: '$$j.store',
      //           storeVisited: {
      //             $size: {
      //               $filter: {
      //                 input: '$stores',
      //                 cond: {
      //                   $eq: ['$$this.store', '$$j.store']
      //                 }
      //               }
      //             }
      //           }
      //         }
      //       }
      //     }
      //   }
      // },
      // {
      //   $set: {
      //     topViewStore: {
      //       $arrayElemAt: [
      //         '$stores',
      //         {
      //           $indexOfArray: [
      //             '$stores.storeVisited',
      //             { $max: '$stores.storeVisited' }
      //           ]
      //         }
      //       ]
      //     }
      //   }
      // },
      {
        $project: {
          date: {
            $toString: '$_id'
          },
          views: 1,
          // stores: 1,
          // topViewStore: 1,
          _id: 0
        }
      },
      {
        $unset: ['_id']
      },
      { $sort: { date: 1 } }
    ]);

    return queryFilter;
  }

  async getCustomerEventAnalytic(
    role: string,
    userName: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    storeId: string,
    platform: string,
    oemId?: string,
    adminFilterOemId?: string,
    brandName?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const startDate = new Date(firstDay);
    const nextDate = new Date(lastDay);
    startDate.setDate(firstDay.getDate() + 1);
    nextDate.setDate(lastDay.getDate() + 1);
    query = {
      'userInformation.state': state,
      'userInformation.city': city,
      createdAt: {
        $gte: startDate,
        $lte: nextDate
      },
      platform: platform,
      event: 'IMPRESSION_COUNT',
      moduleInformation: storeId,
      oemUserName: adminFilterOemId
    };
    if (!adminFilterOemId) {
      delete query['oemUserName'];
    }
    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    if (!platform) {
      delete query['platform'];
    }
    if (!storeId) {
      delete query['moduleInformation'];
    }
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    Logger.debug(`${JSON.stringify(query)} ${role} ${userName} datateee`);

    const queryFilter = await EventAnalyticModel.aggregate([
      {
        $match: query
      },
      {
        $project: {
          createdAt: 1,
          groupId: {
            $dateFromParts: {
              year: {
                $year: '$createdAt'
              },
              month: {
                $month: '$createdAt'
              },
              day: {
                $dayOfMonth: '$createdAt'
              },
              hour: {
                $cond: [
                  {
                    $gte: [
                      {
                        $dateDiff: {
                          startDate: firstDay,
                          endDate: lastDay,
                          unit: 'day'
                        }
                      },
                      1
                    ]
                  },
                  0,
                  {
                    $hour: '$createdAt'
                  }
                ]
              }
            }
          },
          moduleInformation: 1,
          module: 1,
          event: 1
        }
      },
      {
        $group: {
          _id: {
            createdAt: '$createdAt',
            groupId: '$groupId',
            eventId: '$moduleInformation',
            moduleName: '$module',
            eventName: '$event'
          }
        }
      },
      {
        $group: {
          _id: '$_id.groupId',
          views: {
            $sum: 1
          }
        }
      },
      {
        $project: {
          date: {
            $toString: '$_id'
          },
          views: 1,
          _id: 0
        }
      },
      {
        $unset: ['_id']
      },
      { $sort: { date: 1 } }
    ]);

    return queryFilter;
  }

  async getActiveUser(
    role: string,
    userName: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    storeId: string,
    oemId?: string,
    adminFilterOemId?: string,
    brandName?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    Logger.debug(
      `${firstDate} ${lastDate} ${role} ${userName} firstDate / lastDate`
    );
    // const c_Date = new Date();
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);
    const tday = new Date();

    query = {
      'userInformation.state': state,
      'userInformation.city': city,
      createdAt: {
        $gte: firstDay,
        $lte: nextDate
      },
      event: 'LOCATION_CHANGE',
      // moduleInformation: storeId
      // oemUserName: role
      oemUserName: adminFilterOemId
    };
    if (!adminFilterOemId) {
      delete query['oemUserName'];
    }

    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    // if (!storeId) {
    //   delete query['moduleInformation'];
    // }
    // if (userName !== AdminRole.OEM) {
    //   delete query['oemUserName'];
    // }
    const queryFilter: any = await EventAnalyticModel.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);
    return queryFilter;
  }

  async getUsersByState(
    role: string,
    userName: string,
    state: string,
    city: string,
    firstDate: string,
    lastDate: string,
    storeId: string,
    platform: string,
    oemId?: string,
    adminFilterOemId?: string,
    brandName?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    Logger.debug(`${firstDate} ${lastDate} datateee`);
    // const c_Date = new Date();
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);

    query = {
      createdAt: {
        $gte: firstDay,
        $lte: nextDate
      },
      'userInformation.state': state,
      'userInformation.city': city,
      event: 'LOCATION_CHANGE',
      platform: platform,
      // moduleInformation: storeId
      // oemUserName: role
      oemUserName: adminFilterOemId
    };
    if (!adminFilterOemId) {
      delete query['oemUserName'];
    }
    if (!firstDate || !lastDate) {
      delete query['createdAt'];
    }
    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    if (!platform) {
      delete query['platform'];
    }
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    const queryFilter: any = await EventAnalyticModel.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: '$userInformation.city',
          users: { $sum: 1 },
          state: { $first: '$userInformation.state' },
          geoLocation: { $first: '$userInformation.geoLocation' }
        }
      },
      {
        $project: {
          city: { $toString: '$_id' },
          users: 1,
          state: 1,
          geoLocation: 1,
          _id: 0
        }
      },
      { $sort: { users: -1 } },
      { $limit: 15 }
    ]);
    return queryFilter;
  }

  async getUsersByArea(
    role: string,
    userName: string,
    state: string,
    city: string,
    firstDate: string,
    lastDate: string,
    storeId: string,
    platform: string,
    oemId?: string,
    adminFilterOemId?: string,
    brandName?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    Logger.debug(`${firstDate} ${lastDate} datateee`);
    // const c_Date = new Date();
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);

    query = {
      createdAt: {
        $gte: firstDay,
        $lte: nextDate
      },
      'userInformation.state': state,
      'userInformation.city': city,
      event: 'LOCATION_CHANGE',
      platform: platform,
      // moduleInformation: storeId
      // oemUserName: role
      oemUserName: adminFilterOemId
    };
    if (!adminFilterOemId) {
      delete query['oemUserName'];
    }
    if (!firstDate || !lastDate) {
      delete query['createdAt'];
    }
    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    if (!platform) {
      delete query['platform'];
    }
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    const queryFilter: any = await EventAnalyticModel.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: '$userInformation.geoLocation.coordinates',
          users: {
            $sum: 1
          },
          state: {
            $first: '$userInformation.state'
          },
          city: {
            $first: '$userInformation.city'
          },
          geoLocation: {
            $first: '$userInformation.geoLocation'
          }
        }
      },
      {
        $project: {
          geoLocation: 1,
          users: 1,
          state: 1,
          city: 1,
          _id: 0
        }
      },
      { $sort: { users: -1 } }
      // { $limit: 1000 }
    ]);
    return queryFilter;
  }

  async getTrafficAnalaytic(
    role: string,
    userName: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    storeId: string,
    platform: string,
    oemId?: string,
    adminFilterOemId?: string,
    oemUserId?: string,
    employeeId?: string,
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {
      event: { $ne: 'IMPRESSION_COUNT' }
    };
    Logger.debug(`${role} ${userName} getTrafficAnalaytic getTrafficAnalaytic`);
    // const c_Date = new Date();
    const dateFilter: any = {};
    if (firstDate) {
      const start = new Date(firstDate);
      start.setUTCHours(0, 0, 0, 0);
      dateFilter.$gte = new Date(start);
    }
    if (lastDate) {
      const end = new Date(lastDate);
      end.setUTCHours(23, 59, 59, 999);
      dateFilter.$lte = new Date(end);
    }

    if (role === AdminRole.EMPLOYEE && !isEmpty(employeeId)) {
      const employeeDetails =
        await this.spEmployeeService.getEmployeeByEmployeeId(
          employeeId,
          oemId
        );
      if (employeeDetails) {
        query['userInformation.state'] = {
          $in: employeeDetails.state.map((stateObj) => stateObj.name)
        };
        if (!isEmpty(employeeDetails?.city)) {
          query['userInformation.city'] = {
            $in: employeeDetails.city.map((cityObj) => cityObj.name)
          };
        }
      }
    }

    // 3. Optimized field filtering
    const filterFields = {
      'userInformation.state': state,
      'userInformation.city': city,
      moduleInformation: storeId,
      platform: platform,
      oemUserName: adminFilterOemId || oemUserId
    };

    Object.entries(filterFields).forEach(([key, value]) => {
      if (value) query[key] = value;
    });

    if (Object.keys(dateFilter).length) {
      query.createdAt = dateFilter;
    }

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE && oemId !== 'SERVICEPLUG') {
      query.oemUserName = oemId;
    }

    try {
      const startTime = Date.now();

      const combinedResult = await EventAnalyticModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$event',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            name: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]);

      Logger.debug(`Query executed in ${Date.now() - startTime}ms`);
      return combinedResult;
    } catch (error) {
      Logger.error('Error in getTrafficAnalytic:', error);
      throw error;
    }
  }

  async getOverallTrafficAnalaytic(
    role: string,
    userName: string,
    state: string,
    city: string,
    storeId: string,
    platform: string,
    oemId?: string,
    adminFilterOemId?: string,
    oemUserId?: string,
    employeeId?: string,
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {
      event: { $ne: 'IMPRESSION_COUNT' }
    };
    Logger.debug(`${role} ${userName} getTrafficAnalaytic getTrafficAnalaytic`);
    // const c_Date = new Date();
    const tday = new Date();

    // 3. Optimized field filtering
    const filterFields = {
      moduleInformation: storeId,
      platform: platform,
      oemUserName: adminFilterOemId || oemUserId
    };

    if (role === AdminRole.EMPLOYEE && !isEmpty(employeeId)) {
      const employeeDetails =
        await this.spEmployeeService.getEmployeeByEmployeeId(
          employeeId,
          oemId
        );
      if (employeeDetails) {
        query['userInformation.state'] = {
          $in: employeeDetails.state.map((stateObj) => stateObj.name)
        };
        if (!isEmpty(employeeDetails?.city)) {
          query['userInformation.city'] = {
            $in: employeeDetails.city.map((cityObj) => cityObj.name)
          };
        }
      }
    }

    if (state) {
      query['userInformation.state'] = state;
    }
    if (city) {
      query['userInformation.city'] = city;
    }

    Object.entries(filterFields).forEach(([key, value]) => {
      if (value) query[key] = value;
    });

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE && oemId !== 'SERVICEPLUG') {
      query.oemUserName = oemId;
    }

    const combinedResult = await EventAnalyticModel.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: '$event',
          initialCount: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          count: '$queryCount',
          total: '$initialCount',
          _id: 0
        }
      }
    ]);

    return combinedResult;
  }

  async createPlusFeatures(requestData: any): Promise<any> {
    let userResult: any = {};
    const userData: any = {};
    const eventResult = requestData;
    let customerResponse: any = {};

    userResult = await User.findOne({
      _id: new Types.ObjectId(requestData.userId)
    });

    if (requestData?.phoneNumber || !_.isEmpty(userResult)) {
      customerResponse = await Customer.findOne({
        phoneNumber: `+91${userResult.phoneNumber.slice(-10)}`
      });
    }
    userData.userId = userResult?._id || requestData.userId || '';
    userData.fullName = customerResponse?.fullName || '';
    userData.email = customerResponse?.email || '';
    userData.phoneNumber = requestData.phoneNumber || '';
    userData.geoLocation = {
      type: 'Point',
      coordinates: requestData?.coordinates
    };
    userData.address = requestData?.address || '';
    userData.state = requestData?.state || '';
    userData.city = requestData?.city || '';

    eventResult.userInformation = userData;

    Logger.info(
      '<Service>:<PlusFeatureAnalytic>:<Create analytic service initiated>'
    );
    let newAnalytic: any = [];
    if (!_.isEmpty(eventResult)) {
      newAnalytic = await PlusFeatureAnalyticModel.create(eventResult);
    }
    Logger.info(
      '<Service>:<PlusFeatureAnalytic>:<analytic created successfully>'
    );
    return newAnalytic;
  }

  async getPlusFeatureAnalytic(
    role: string,
    userName: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    moduleId: string,
    platform: string,
    oemId?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    Logger.debug(`${role} ${userName} getTrafficAnalaytic getTrafficAnalaytic`);
    // const c_Date = new Date();
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);
    const tday = new Date();

    query = {
      'userInformation.state': state,
      'userInformation.city': city,
      createdAt: {
        $gte: firstDay,
        $lte: nextDate
      },
      // event: 'LOGIN_OTP_VERIFY',
      moduleInformation: moduleId,
      platform: platform
    };

    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    if (!platform) {
      delete query['platform'];
    }
    if (!moduleId) {
      delete query['moduleInformation'];
    }

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }

    const queryFilter: any = await PlusFeatureAnalyticModel.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: {
            createdAt: '$createdAt',
            moduleInformation: '$moduleInformation',
            event: '$event'
          }
        }
      },
      {
        $group: {
          _id: '$_id.event',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          _id: 0,
          count: 1
        }
      }
    ]);

    delete query['createdAt'];
    const AllEventResult: any = await PlusFeatureAnalyticModel.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: {
            createdAt: '$createdAt',
            moduleInformation: '$moduleInformation',
            event: '$event'
          }
        }
      },
      {
        $group: {
          _id: '$_id.event',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          _id: 0,
          count: 1
        }
      }
    ]);

    const finalResult = AllEventResult.map((val: any) => {
      const objectData = queryFilter.find((res: any) => res.name === val?.name);
      return {
        name: val?.name,
        count: objectData?.count,
        total: val?.count
      };
    });
    return finalResult;
  }

  async getAdvertisementAnalytic(
    role: string,
    userName: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    moduleId: string,
    platform: string,
    oemId?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);
    query = {
      'userInformation.state': state,
      'userInformation.city': city,
      createdAt: {
        $gte: firstDay,
        $lte: nextDate
      },
      event: 'IMPRESSION_COUNT',
      moduleInformation: moduleId,
      platform: platform
    };

    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    if (!moduleId) {
      delete query['moduleInformation'];
    }
    if (!platform) {
      delete query['platform'];
    }
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    Logger.debug(`${JSON.stringify(query)} ${role} ${userName} datateee`);

    const queryFilter: any = await PlusFeatureAnalyticModel.aggregate([
      {
        $match: query
      },
      {
        $project: {
          createdAt: 1,
          groupId: {
            $dateFromParts: {
              year: {
                $year: '$createdAt'
              },
              month: {
                $month: '$createdAt'
              },
              day: {
                $dayOfMonth: '$createdAt'
              },
              hour: {
                $cond: [
                  {
                    $gte: [
                      {
                        $dateDiff: {
                          startDate: firstDay,
                          endDate: lastDay,
                          unit: 'day'
                        }
                      },
                      1
                    ]
                  },
                  0,
                  {
                    $hour: '$createdAt'
                  }
                ]
              }
            }
          },
          moduleInformation: 1,
          module: 1,
          event: 1
        }
      },
      {
        $group: {
          _id: {
            createdAt: '$createdAt',
            groupId: '$groupId',
            eventId: '$moduleInformation',
            moduleName: '$module',
            eventName: '$event'
          }
        }
      },
      {
        $group: {
          _id: '$_id.groupId',
          views: {
            $sum: 1
          }
          // moduleResult: {
          //   $push: {
          //     eventId: '$_id.eventId',
          //     moduleName: '$_id.moduleName',
          //     eventName: '$_id.eventName'
          //   }
          // }
        }
      },
      // {
      //   $addFields: {
      //     moduleResult: {
      //       $map: {
      //         input: {
      //           $setUnion: '$moduleResult'
      //         },
      //         as: 'j',
      //         in: {
      //           eventId: '$$j.eventId',
      //           moduleName: '$$j.moduleName',
      //           eventName: '$$j.eventName',
      //           eventVisited: {
      //             $size: {
      //               $filter: {
      //                 input: '$moduleResult',
      //                 cond: {
      //                   $eq: ['$$this.eventId', '$$j.eventId']
      //                 }
      //               }
      //             }
      //           }
      //         }
      //       }
      //     }
      //   }
      // },
      // {
      //   $set: {
      //     topView: {
      //       $arrayElemAt: [
      //         '$moduleResult',
      //         {
      //           $indexOfArray: [
      //             '$moduleResult.eventVisited',
      //             { $max: '$moduleResult.eventVisited' }
      //           ]
      //         }
      //       ]
      //     }
      //   }
      // },
      {
        $project: {
          date: {
            $toString: '$_id'
          },
          views: 1,
          // moduleResult: 1,
          // topView: 1,
          _id: 0
        }
      },
      {
        $unset: ['_id']
      },
      { $sort: { date: 1 } }
    ]);

    return queryFilter;
  }

  async getPlusFeatureAnalyticByCity(
    role: string,
    userName: string,
    state: string,
    city: string,
    firstDate: string,
    lastDate: string,
    moduleId: string,
    platform: string,
    oemId?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    Logger.debug(`${firstDate} ${lastDate} datateee`);
    // const c_Date = new Date();
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);

    query = {
      createdAt: {
        $gte: firstDay,
        $lte: nextDate
      },
      'userInformation.state': state,
      'userInformation.city': city,
      platform: platform,
      moduleInformation: moduleId
      // oemUserName: role
    };
    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    if (!platform) {
      delete query['platform'];
    }
    if (!moduleId) {
      delete query['moduleInformation'];
    }
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    const queryFilter: any = await PlusFeatureAnalyticModel.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: '$userInformation.city',
          users: {
            $sum: 1
          },
          state: {
            $first: '$userInformation.state'
          }
        }
      },
      {
        $project: {
          city: {
            $toString: '$_id'
          },
          users: 1,
          state: 1,
          _id: 0
        }
      },
      { $sort: { users: -1 } },
      {
        $limit: 15
      }
    ]);
    return queryFilter;
  }

  async getCategoriesAnalytic(
    role: string,
    userName: string,
    state: string,
    city: string,
    firstDate: string,
    lastDate: string,
    moduleId: string,
    platform: string,
    oemId?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    Logger.debug(`${firstDate} ${lastDate} datateee`);
    // const c_Date = new Date();
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);

    query = {
      createdAt: {
        $gte: firstDay,
        $lte: nextDate
      },
      'userInformation.state': state,
      'userInformation.city': city,
      platform: platform,
      module: 'CATEGORIES',
      moduleInformation: moduleId
      // oemUserName: role
    };
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    if (!platform) {
      delete query['platform'];
    }
    if (!moduleId) {
      delete query['moduleInformation'];
    }
    const queryFilter: any = await EventAnalyticModel.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: {
            moduleInformation: '$moduleInformation',
            event: '$event'
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id.moduleInformation',
          event: '$_id.event',
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);
    return queryFilter;
  }

  async getPlusFeatureAnalyticTypes(
    userName: string,
    role: string,
    state: string,
    city: string,
    firstDate: string,
    lastDate: string,
    module: string,
    platform: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    Logger.debug(`${firstDate} ${lastDate} datateee`);
    // const c_Date = new Date();
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);

    query = {
      createdAt: {
        $gte: firstDay,
        $lte: nextDate
      },
      'userInformation.state': state,
      'userInformation.city': city,
      platform: platform,
      module: module
      // oemUserName: role
    };

    const moduleType =
      module === 'EVENT'
        ? 'events'
        : module === 'OFFERS'
          ? 'offers'
          : module === 'BUSINESS_OPPORTUNITIES'
            ? 'businesses'
            : '';

    const moduleId =
      module === 'EVENT'
        ? 'eventId'
        : module === 'OFFERS'
          ? 'offerId'
          : module === 'BUSINESS_OPPORTUNITIES'
            ? 'businessId'
            : '';

    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    if (!platform) {
      delete query['platform'];
    }
    if (!module) {
      delete query['module'];
    }
    const queryFilter: any = await PlusFeatureAnalyticModel.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: moduleType,
          localField: 'moduleInformation',
          foreignField: moduleId,
          as: 'result'
        }
      },
      { $unwind: { path: '$result' } },
      {
        $group: {
          _id: '$moduleInformation',
          count: {
            $sum: 1
          },
          moduleInfo: {
            $first: '$result'
          }
        }
      },
      {
        $project: {
          moduleId: {
            $toString: '$_id'
          },
          count: 1,
          moduleInfo: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);
    return queryFilter;
  }

  async getStoreImpressoin(userName: string, role: string) {
    Logger.info(
      '<Service>:<AnalyticService>:<Get all analytic service initiated>'
    );
    const query: any = {};
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }
    const storeEvent = await EventAnalyticModel.countDocuments({
      ...query
    });
    const bannerEvent = await PlusFeatureAnalyticModel.countDocuments();
    return {
      totalStoreImpression: storeEvent,
      totalBannerImpression: bannerEvent
    };
  }

  async createPartnerAnalytic(requestData: any): Promise<any> {
    const eventResult = requestData;

    if (requestData.event === 'ONLINE' || requestData.event === 'OFFLINE') {
      const jsonResult = {
        event: requestData.event,
        startTime: requestData.startTime,
        endTime: requestData.endTime,
        platform: requestData.platform,
        phoneNumber: requestData.phoneNumber,
        moduleInformation: requestData.moduleInformation
      };

      if (requestData.event === 'ONLINE') {
        delete jsonResult['endTime'];
      }

      const eventData = await PartnerAnalyticModel.findOne(jsonResult);
      if (!_.isEmpty(eventData)) {
        throw new Error('Event is already created');
      }
    }

    eventResult.userId = requestData?.userId || '';
    eventResult.phoneNumber = requestData.phoneNumber || '';
    eventResult.moduleInformation = requestData?.moduleInformation;

    Logger.info(
      '<Service>:<AnalyticService>:<Create analytic service initiated>'
    );
    let newAnalytic: any = [];
    if (!_.isEmpty(eventResult)) {
      newAnalytic = await PartnerAnalyticModel.create(eventResult);
    }
    Logger.info('<Service>:<AnalyticService>:<analytic created successfully>');
    return newAnalytic;
  }

  async getPartnerAnalytic(
    role: string,
    userName: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    storeId: string,
    platform: string,
    oemId?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    // const currentDate = new Date(lastDay);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);
    query = {
      'userInformation.state': state,
      'userInformation.city': city,
      createdAt: {
        $gte: firstDay,
        $lte: nextDate
      },
      platform: platform,
      module: 'SCREEN_MODE',
      event: 'ONLINE',
      moduleInformation: storeId
    };

    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    if (!platform) {
      delete query['platform'];
    }
    if (!storeId) {
      delete query['moduleInformation'];
    }
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    Logger.debug(`${JSON.stringify(query)} ${role} ${userName} datateee`);
    // const c_Date = new Date();

    const queryFilter: any = await PartnerAnalyticModel.aggregate([
      {
        $match: query
      },
      {
        $project: {
          createdAt: 1,
          groupId: {
            $dateFromParts: {
              year: {
                $year: '$createdAt'
              },
              month: {
                $month: '$createdAt'
              },
              day: {
                $dayOfMonth: '$createdAt'
              },
              hour: {
                $cond: [
                  {
                    $gte: [
                      {
                        $dateDiff: {
                          startDate: firstDay,
                          endDate: lastDay,
                          unit: 'day'
                        }
                      },
                      1
                    ]
                  },
                  0,
                  {
                    $hour: '$createdAt'
                  }
                ]
              }
            }
          },
          moduleInformation: 1
        }
      },
      {
        $group: {
          _id: {
            createdAt: '$createdAt',
            groupId: '$groupId',
            phoneNumber: '$phoneNumber'
          }
        }
      },
      {
        $group: {
          _id: '$_id.groupId',
          views: {
            $sum: 1
          }
        }
      },
      {
        $project: {
          date: {
            $toString: '$_id'
          },
          views: 1,
          _id: 0
        }
      },
      {
        $unset: ['_id']
      },
      { $sort: { date: 1 } }
    ]);

    return queryFilter;
  }

  async getActivePartnerUsers(
    role: string,
    userName: string,
    currentDate: any
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    Logger.debug(`${role} ${userName} getTrafficAnalaytic getTrafficAnalaytic`);
    const tday = new Date(currentDate);
    // tday.setDate(tday.getDate() - 1);

    query = {
      createdAt: {
        $gte: tday
      },
      module: 'SCREEN_MODE'
    };

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    const queryFilter: any = await PartnerAnalyticModel.aggregate([
      {
        $match: query
      },
      // {
      //   $group: {
      //     _id: {
      //       phoneNumber: '$phoneNumber',
      //       event: '$event',
      //       platform: '$platform',
      //       moduleInformation: '$moduleInformation',
      //       startTime: '$startTime',
      //       endTime: '$endTime',
      //       totalTimeDuration: '$totalTimeDuration',
      //       createdAt: '$createdAt'
      //     }
      //   }
      // },
      {
        $group: {
          _id: '$moduleInformation',
          screenView: {
            $sum: 1
          },
          userResult: { $push: '$$ROOT' }
          // userResult: {
          //   $push: {
          //     event: '$_id.event',
          //     platform: '$_id.platform',
          //     moduleInformation: '$_id.moduleInformation',
          //     startTime: '$_id.startTime',
          //     endTime: '$_id.endTime',
          //     totalTimeDuration: '$_id.totalTimeDuration'
          //   }
          // }
          // createdAt: {
          //   $first: '$_id.createdAt'
          // }
        }
      },
      {
        $set: {
          userData: { $size: '$userResult' }
        }
      },
      // {
      //   $set: {
      //     screenMode: {
      //       $cond: [
      //         { $eq: [{ $mod: ['$userData', 2] }, 0] },
      //         'OFFLINE',
      //         'ONLINE'
      //       ]
      //     }
      //   }
      // },
      {
        $project: {
          storeUser: {
            $toString: '$_id'
          },
          screenView: 1,
          // userResult: 1,
          screenMode: {
            $arrayElemAt: ['$userResult', -1]
          },
          // createdAt: 1,
          timeSpend: { $sum: '$userResult.totalTimeDuration' },
          _id: 0
        }
      }
    ]);

    const finalResult = {
      avgTimeSpend:
        queryFilter
          ?.map((val: any) => val?.timeSpend)
          .reduce((num1: number, num2: number) => num1 + num2, 0) /
        queryFilter?.length,
      TodayPartnerUers: queryFilter,
      currentPartnerUers: queryFilter?.filter(
        (val: any) => val?.screenMode?.event === 'ONLINE'
      )
    };
    return finalResult;
  }

  async getOverallPartnerUsers(
    role: string,
    userName: string,
    firstDate: any,
    lastDate: any
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    Logger.debug(`${role} ${userName} getTrafficAnalaytic getTrafficAnalaytic`);
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);

    query = {
      createdAt: {
        $gte: firstDay,
        $lte: nextDate
      },
      module: 'SCREEN_MODE'
      // event: 'OFFLINE'
    };

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    const queryFilter: any = await PartnerAnalyticModel.aggregate([
      {
        $match: query
      },
      {
        $project: {
          _id: 1,
          platform: 1,
          module: 1,
          event: 1,
          totalTimeDuration: 1
        }
      }
    ]);
    return queryFilter;
  }

  /// buysell vehicle analytic creation api start ===========================
  ///======================================================================//

  async createVehicleAnalytic(requestData: any): Promise<any> {
    const userData: any = {};
    const eventResult = requestData;

    userData.userId = requestData.userId || '';
    userData.phoneNumber = requestData.phoneNumber || '';
    userData.geoLocation = {
      type: 'Point',
      coordinates: requestData?.coordinates
    };
    userData.state = requestData?.state || '';
    userData.city = requestData?.city || '';

    eventResult.userInformation = userData;

    Logger.info(
      '<Service>:<CategoryService>:<Create analytic service initiated>'
    );
    let newAnalytic: any = [];
    if (!_.isEmpty(eventResult)) {
      newAnalytic = await VehicleAnalyticModel.create(eventResult);
    }
    Logger.info('<Service>:<CategoryService>:<analytic created successfully>');
    return newAnalytic;
  }

  async getVehicleAnalytic(
    role: string,
    oemUserName: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    storeId: string,
    platform: string,
    oemId?: string,
    brandName?: any,
    userName?: string,
    vehicleType?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);

    const query: any = {
      createdAt: {
        $gte: firstDay,
        $lte: nextDate
      },
      event: 'IMPRESSION_COUNT',
      oemUserName: userName
    };

    if (platform === 'PARTNER' || platform === 'CUSTOMER') {
      const platformPrefix =
        platform === 'PARTNER' ? 'PARTNER_APP' : 'CUSTOMER_APP';
      query.platform = {
        $in: [`${platformPrefix}_ANDROID`, `${platformPrefix}_IOS`]
      };
    }
    if (!userName) {
      delete query['oemUserName'];
    }
    if (role === AdminRole.OEM) {
      query.oemUserName = oemUserName;
    }
    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }
    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }

    const statusQuery: any = {};
    if (storeId) statusQuery['vehicleDetails.storeDetails.storeId'] = storeId;
    if (vehicleType) statusQuery['vehicleDetails.vehType'] = vehicleType;
    if (brandName?.catalogName)
      statusQuery['vehicleDetails.brandName'] = brandName.catalogName;
    if (state) {
      statusQuery.$or = [
        { 'vehicleDetails.sellerDetails.contactInfo.state': state },
        { 'vehicleDetails.storeDetails.contactInfo.state': state }
      ];
    }
    if (city) {
      statusQuery.$or = [
        { 'vehicleDetails.sellerDetails.contactInfo.city': city },
        { 'vehicleDetails.storeDetails.contactInfo.city': city }
      ];
    }

    const queryFilter: any = await VehicleAnalyticModel.aggregate([
      { $match: query },
      { $set: { vehicle: { $toObjectId: '$moduleInformation' } } },
      {
        $lookup: {
          from: 'buysells',
          localField: 'vehicle',
          foreignField: '_id',
          as: 'vehicleDetails'
        }
      },
      { $match: statusQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
            hour: {
              $cond: [
                {
                  $gte: [
                    {
                      $dateDiff: {
                        startDate: firstDay,
                        endDate: lastDay,
                        unit: 'day'
                      }
                    },
                    1
                  ]
                },
                0,
                { $hour: '$createdAt' }
              ]
            }
          },
          views: { $sum: 1 }
        }
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: '%Y-%m-%dT%H:%M:%S.%LZ',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day',
                  hour: '$_id.hour'
                }
              }
            }
          },
          views: 1,
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    return queryFilter;
  }

  async getVehicleAnalyticByYear(
    role: string,
    oemUserName: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    storeId: string,
    platform: string,
    oemId?: string,
    brandName?: any,
    userName?: string,
    vehicleType?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const startDate = new Date(firstDay);
    const nextDate = new Date(lastDay);
    startDate.setDate(firstDay.getDate() + 1);
    nextDate.setDate(lastDay.getDate() + 1);
    query = {
      // 'userInformation.state': state,
      // 'userInformation.city': city,
      createdAt: {
        $gte: startDate,
        $lte: nextDate
      },
      // platform: platform,
      event: 'IMPRESSION_COUNT',
      // moduleInformation: storeId,
      oemUserName: userName
    };

    if (platform === 'PARTNER' || platform === 'CUSTOMER') {
      const platformPrefix =
        platform === 'PARTNER' ? 'PARTNER_APP' : 'CUSTOMER_APP';
      query.$or = [
        { platform: `${platformPrefix}_ANDROID` },
        { platform: `${platformPrefix}_IOS` }
      ];
    }
    if (!userName) {
      delete query['oemUserName'];
    }
    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    if (!platform) {
      delete query['platform'];
    }
    if (role === AdminRole.OEM) {
      query.oemUserName = oemUserName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    Logger.debug(`${JSON.stringify(query)} ${role} ${oemUserName} datateee`);
    // const c_Date = new Date();

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    const statusQuery: any = {};

    if (storeId)
      statusQuery['vehicleDetails.storeDetails.storeId'] = { $in: [storeId] };
    if (vehicleType) statusQuery['vehicleDetails.vehType'] = vehicleType;
    if (brandName?.catalogName)
      statusQuery['vehicleDetails.brandName'] = brandName?.catalogName;
    if (state) {
      statusQuery.$or = [
        // { 'userInformation.state': state },
        { 'vehicleDetails.sellerDetails.contactInfo.state': state },
        {
          'vehicleDetails.storeDetails.contactInfo.state': state
        }
      ];
    }
    if (city) {
      statusQuery.$or = [
        // { 'userInformation.city': city },
        { 'vehicleDetails.sellerDetails.contactInfo.city': city },
        {
          'vehicleDetails.storeDetails.contactInfo.city': city
        }
      ];
    }

    const queryFilter: any = await VehicleAnalyticModel.aggregate([
      {
        $match: query
      },
      { $set: { vehicle: { $toObjectId: '$moduleInformation' } } },
      {
        $lookup: {
          from: 'buysells',
          localField: 'vehicle',
          foreignField: '_id',
          as: 'vehicleDetails'
        }
      },
      { $match: statusQuery },
      { $project: { vehicleDetails: 0 } },
      {
        $project: {
          createdAt: 1,
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' },
          moduleInformation: 1
        }
      },
      {
        $group: {
          _id: { month: '$month', year: '$year' },
          views: { $sum: 1 }
        }
      },
      {
        $project: {
          date: {
            $let: {
              vars: {
                monthNames: monthNames
              },
              in: {
                $concat: [
                  {
                    $arrayElemAt: [
                      '$$monthNames',
                      { $subtract: ['$_id.month', 1] }
                    ]
                  },
                  ' ',
                  { $toString: '$_id.year' }
                ]
              }
            }
          },
          views: 1,
          _id: 0
        }
      }
    ]);

    const allMonths = monthNames.map((month) => ({
      [`${month}`]: 0,
      date: month
    }));

    const resultWithAllMonths = allMonths.map((month) => {
      const monthName = Object.keys(month)[0];
      const aggregatedData = queryFilter.find(
        (item: any) => item.date === `${monthName} ${new Date().getFullYear()}`
      );

      if (aggregatedData) {
        return { [`${monthName}`]: aggregatedData.views, date: month.date };
      }

      return { [`${monthName}`]: 0, date: month.date };
    });

    resultWithAllMonths.sort((a, b) => {
      const monthIndexA = monthNames.indexOf(a.date);
      const monthIndexB = monthNames.indexOf(b.date);

      return monthIndexA - monthIndexB;
    });

    return resultWithAllMonths;
  }

  async getBuyVehicleAll(
    role: string,
    oemUserName: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    storeId: string,
    platform: string,
    oemId?: string,
    brandName?: any,
    userName?: string,
    vehicleType?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    Logger.debug(`${role} ${oemUserName} getTrafficAnalaytic`);
    // const c_Date = new Date();
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);
    const tday = new Date();

    query = {
      // 'userInformation.state': state,
      // 'userInformation.city': city,
      // createdAt: {
      //   $gte: firstDay,
      //   $lte: nextDate
      // },
      // event: { $ne: 'IMPRESSION_COUNT' },
      // moduleInformation: storeId,
      // platform: platform,
      oemUserName: userName
    };

    if (platform === 'PARTNER' || platform === 'CUSTOMER') {
      const platformPrefix =
        platform === 'PARTNER' ? 'PARTNER_APP' : 'CUSTOMER_APP';
      query.$or = [
        { platform: `${platformPrefix}_ANDROID` },
        { platform: `${platformPrefix}_IOS` }
      ];
    }

    if (!userName) {
      delete query['oemUserName'];
    }
    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    if (!platform) {
      delete query['platform'];
    }

    if (role === AdminRole.OEM) {
      query.oemUserName = oemUserName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }

    const statusQuery: any = {};

    if (storeId)
      statusQuery['vehicleDetails.storeDetails.storeId'] = { $in: [storeId] };
    if (vehicleType) statusQuery['vehicleDetails.vehType'] = vehicleType;
    if (brandName?.catalogName)
      statusQuery['vehicleDetails.brandName'] = brandName?.catalogName;
    if (state) {
      statusQuery.$or = [
        // { 'userInformation.state': state },
        { 'vehicleDetails.sellerDetails.contactInfo.state': state },
        {
          'vehicleDetails.storeDetails.contactInfo.state': state
        }
      ];
    }
    if (city) {
      statusQuery.$or = [
        // { 'userInformation.city': city },
        { 'vehicleDetails.sellerDetails.contactInfo.city': city },
        {
          'vehicleDetails.storeDetails.contactInfo.city': city
        }
      ];
    }

    const combinedResult = await VehicleAnalyticModel.aggregate([
      {
        $match: query
      },
      { $set: { vehicle: { $toObjectId: '$moduleInformation' } } },
      {
        $lookup: {
          from: 'buysells',
          localField: 'vehicle',
          foreignField: '_id',
          as: 'vehicleDetails'
        }
      },
      { $match: statusQuery },
      { $project: { vehicleDetails: 0 } },
      {
        $group: {
          _id: '$event',
          initialCount: { $sum: 1 },
          queryCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$createdAt', firstDay] },
                    { $lte: ['$createdAt', nextDate] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          name: '$_id',
          count: '$queryCount',
          total: '$initialCount',
          _id: 0
        }
      }
    ]);
    return combinedResult;
  }

  async getBuyVehicleStore(
    role: string,
    oemUserName: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    storeId: string,
    platform: string,
    oemId?: string,
    brandName?: any,
    userName?: string,
    vehicleType?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    let query2: any = {};
    Logger.debug(`${role} ${oemUserName} getTrafficAnalaytic`);
    // const c_Date = new Date();
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);
    const tday = new Date();

    query = {
      category: 'Buy/Sell',
      module: 'STORE',
      oemUserName: userName,
      'userInformation.state': state,
      'userInformation.city': city
    };

    if (platform === 'PARTNER' || platform === 'CUSTOMER') {
      const platformPrefix =
        platform === 'PARTNER' ? 'PARTNER_APP' : 'CUSTOMER_APP';
      query.$or = [
        { platform: `${platformPrefix}_ANDROID` },
        { platform: `${platformPrefix}_IOS` }
      ];
    }

    if (!userName) {
      delete query['oemUserName'];
    }
    if (!platform) {
      delete query['platform'];
    }

    if (role === AdminRole.OEM) {
      query.oemUserName = oemUserName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }

    if (storeId) query['moduleInformation'] = storeId;
    // if (vehicleType) query['vehicleDetails.vehType'] = vehicleType;
    // if (brandName?.catalogName)
    //   query['vehicleDetails.brandName'] = brandName?.catalogName;
    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }

    const combinedResult = await EventAnalyticModel.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: '$event',
          initialCount: { $sum: 1 },
          queryCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$createdAt', firstDay] },
                    { $lte: ['$createdAt', nextDate] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          name: '$_id',
          count: '$queryCount',
          total: '$initialCount',
          _id: 0
        }
      }
    ]);

    delete query['module'];
    delete query['category'];

    query2 = {
      ...query,
      createdAt: {
        $gte: firstDay,
        $lte: nextDate
      },
      module: 'CATEGORIES',
      event: 'CATEGORY_CLICK',
      moduleInformation: 'Buy/Sell'
    };
    const combinedResult2 = await EventAnalyticModel.countDocuments(query2);
    delete query['createdAt'];
    const combinedResult3 = await EventAnalyticModel.countDocuments(query2);

    const finalVal = [
      ...combinedResult,
      { name: 'Buy/Sell', count: combinedResult2, total: combinedResult3 }
    ];
    return finalVal;
  }

  /// buysell vehicle analytic creation api end ===========================
  ///======================================================================//

  /// New vehicle analytic creation api start ===========================
  ///======================================================================//

  async createNewVehicle(requestData: any): Promise<any> {
    const userData: any = {};
    const eventResult = requestData;

    userData.userId = requestData.userId || '';
    userData.phoneNumber = requestData.phoneNumber || '';
    userData.geoLocation = {
      type: 'Point',
      coordinates: requestData?.coordinates
    };
    userData.state = requestData?.state || '';
    userData.city = requestData?.city || '';

    eventResult.userInformation = userData;

    Logger.info(
      '<Service>:<CategoryService>:<Create analytic service initiated>'
    );
    let newAnalytic: any = [];
    if (!_.isEmpty(eventResult)) {
      newAnalytic = await NewVehicleAnalyticModel.create(eventResult);
    }
    Logger.info('<Service>:<CategoryService>:<analytic created successfully>');
    return newAnalytic;
  }

  async getNewVehicleImpression(
    role: string,
    userName: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    storeId: string,
    platform: string,
    oemId?: string,
    adminFilterOemId?: string,
    brandName?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    // const currentDate = new Date(lastDay);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);
    query = {
      'userInformation.state': state,
      'userInformation.city': city,
      createdAt: {
        $gte: firstDay,
        $lte: nextDate
      },
      platform: platform,
      event: 'IMPRESSION_COUNT',
      moduleInformation: storeId,
      oemUserName: adminFilterOemId
    };
    if (!adminFilterOemId) {
      delete query['oemUserName'];
    }
    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    if (!platform) {
      delete query['platform'];
    }
    if (!storeId) {
      delete query['moduleInformation'];
    }
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    Logger.debug(`${JSON.stringify(query)} ${role} ${userName} datateee`);
    // const c_Date = new Date();

    const queryFilter: any = await NewVehicleAnalyticModel.aggregate([
      {
        $match: query
      },
      {
        $project: {
          createdAt: 1,
          groupId: {
            $dateFromParts: {
              year: {
                $year: '$createdAt'
              },
              month: {
                $month: '$createdAt'
              },
              day: {
                $dayOfMonth: '$createdAt'
              },
              hour: {
                $cond: [
                  {
                    $gte: [
                      {
                        $dateDiff: {
                          startDate: firstDay,
                          endDate: lastDay,
                          unit: 'day'
                        }
                      },
                      1
                    ]
                  },
                  0,
                  {
                    $hour: '$createdAt'
                  }
                ]
              }
            }
          },
          moduleInformation: 1
        }
      },
      {
        $group: {
          _id: {
            createdAt: '$createdAt',
            groupId: '$groupId',
            store: '$moduleInformation'
          }
        }
      },
      {
        $group: {
          _id: '$_id.groupId',
          views: {
            $sum: 1
          }
        }
      },
      {
        $project: {
          date: {
            $toString: '$_id'
          },
          views: 1,
          // stores: 1,
          // topViewStore: 1,
          _id: 0
        }
      },
      {
        $unset: ['_id']
      },
      { $sort: { date: 1 } }
    ]);

    return queryFilter;
  }

  async getNewVehicleAll(
    role: string,
    userName: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    storeId: string,
    platform: string,
    oemId?: string,
    adminFilterOemId?: string,
    brandName?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    Logger.debug(`${role} ${userName} getTrafficAnalaytic getTrafficAnalaytic`);
    // const c_Date = new Date();
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);
    const tday = new Date();

    query = {
      'userInformation.state': state,
      'userInformation.city': city,
      // createdAt: {
      //   $gte: firstDay,
      //   $lte: nextDate
      // },
      // event: { $ne: 'IMPRESSION_COUNT' },
      moduleInformation: storeId,
      platform: platform,
      oemUserName: adminFilterOemId
    };
    if (!adminFilterOemId) {
      delete query['oemUserName'];
    }

    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    if (!platform) {
      delete query['platform'];
    }
    if (!storeId) {
      delete query['moduleInformation'];
    }

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }

    const combinedResult = await NewVehicleAnalyticModel.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: '$event',
          initialCount: { $sum: 1 },
          queryCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$createdAt', firstDay] },
                    { $lte: ['$createdAt', nextDate] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          name: '$_id',
          count: '$queryCount',
          total: '$initialCount',
          _id: 0
        }
      }
    ]);
    return combinedResult;
  }

  /// New vehicle analytic creation api end ===========================
  ///======================================================================//

  /// Marketing video analytic creation api start ===========================
  ///======================================================================//

  async createMarketingAnalytic(requestData: any): Promise<any> {
    const eventResult = requestData;
    Logger.info(
      '<Service>:<AnalyticService>:<Create analytic service initiated>'
    );
    let newAnalytic: any = [];
    if (!_.isEmpty(eventResult)) {
      newAnalytic = await MarketingAnalyticModel.create(eventResult);
    }
    Logger.info('<Service>:<AnalyticService>:<analytic created successfully>');
    return newAnalytic;
  }

  async getMarketingAnalytic(
    role: string,
    oemUserName: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    storeId: string,
    platform: string,
    oemId?: string,
    userName?: string,
    status?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);

    const query: any = {
      createdAt: {
        $gte: firstDay,
        $lte: nextDate
      },
      event: 'IMPRESSION_COUNT',
      'userInformation.state': state,
      'userInformation.city': city
      // oemUserName: userName
    };

    if (!state) delete query['userInformation.state'];
    if (!city) delete query['userInformation.city'];

    if (platform === 'PARTNER' || platform === 'CUSTOMER') {
      const platformPrefix =
        platform === 'PARTNER' ? 'PARTNER_APP' : 'CUSTOMER_APP';
      query.platform = {
        $in: [`${platformPrefix}_ANDROID`, `${platformPrefix}_IOS`]
      };
    }
    // if (!userName) {
    //   delete query['oemUserName'];
    // }
    // if (role === AdminRole.OEM) {
    //   query.employeeUserName = oemUserName;
    // }
    // if (role === AdminRole.EMPLOYEE) {
    //   query.employeeUserName = oemId;
    // }
    // if (oemId === 'SERVICEPLUG') {
    //   delete query['employeeUserName'];
    // }

    const statusQuery: any = {};
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (storeId) statusQuery['marketingDetails.storeId'] = storeId;
    if (userName) statusQuery['marketingDetails.oemUserName'] = userName;
    if (status) statusQuery['marketingDetails.status'] = status;

    if (role === AdminRole.OEM) {
      statusQuery.$or = [
        { 'marketingDetails.employeeUserName': oemUserName },
        { 'marketingDetails.oemUserName': oemUserName }
      ];
    }

    const queryFilter: any = await MarketingAnalyticModel.aggregate([
      { $match: query },
      { $set: { marketingKey: { $toObjectId: '$marketingId' } } },
      {
        $lookup: {
          from: 'marketings',
          localField: 'marketingKey',
          foreignField: '_id',
          as: 'marketingDetails'
        }
      },
      { $unwind: { path: '$marketingDetails' } },
      {
        $addFields: {
          'marketingDetails.status': {
            $cond: {
              if: { $eq: ['$marketingDetails.endDate', currentDate] },
              then: 'ENABLED',
              else: {
                $cond: {
                  if: { $lt: ['$marketingDetails.endDate', currentDate] },
                  then: 'DISABLED',
                  else: 'ENABLED'
                }
              }
            }
          }
        }
      },
      { $match: statusQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
            hour: {
              $cond: [
                {
                  $gte: [
                    {
                      $dateDiff: {
                        startDate: firstDay,
                        endDate: lastDay,
                        unit: 'day'
                      }
                    },
                    1
                  ]
                },
                0,
                { $hour: '$createdAt' }
              ]
            }
          },
          views: { $sum: 1 }
        }
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: '%Y-%m-%dT%H:%M:%S.%LZ',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day',
                  hour: '$_id.hour'
                }
              }
            }
          },
          views: 1,
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    return queryFilter;
  }

  async getMarketingImpressionByYear(
    role: string,
    oemUserName: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    storeId: string,
    platform: string,
    oemId?: string,
    userName?: string,
    status?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const startDate = new Date(firstDay);
    const nextDate = new Date(lastDay);
    startDate.setDate(firstDay.getDate() + 1);
    nextDate.setDate(lastDay.getDate() + 1);
    query = {
      createdAt: {
        $gte: startDate,
        $lte: nextDate
      },
      event: 'IMPRESSION_COUNT',
      'userInformation.state': state,
      'userInformation.city': city
    };

    if (platform === 'PARTNER' || platform === 'CUSTOMER') {
      const platformPrefix =
        platform === 'PARTNER' ? 'PARTNER_APP' : 'CUSTOMER_APP';
      query.$or = [
        { platform: `${platformPrefix}_ANDROID` },
        { platform: `${platformPrefix}_IOS` }
      ];
    }
    if (!userName) {
      delete query['oemUserName'];
    }
    if (!state) delete query['userInformation.state'];
    if (!city) delete query['userInformation.city'];
    if (!platform) {
      delete query['platform'];
    }
    // if (role === AdminRole.OEM) {
    //   query.oemUserName = oemUserName;
    // }

    // if (role === AdminRole.EMPLOYEE) {
    //   query.oemUserName = oemId;
    // }

    // if (oemId === 'SERVICEPLUG') {
    //   delete query['oemUserName'];
    // }
    Logger.debug(`${JSON.stringify(query)} ${role} ${oemUserName} datateee`);
    // const c_Date = new Date();

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    const statusQuery: any = {};
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (storeId) statusQuery['marketingDetails.storeId'] = storeId;
    if (userName) statusQuery['marketingDetails.oemUserName'] = userName;
    if (status) statusQuery['marketingDetails.status'] = status;

    if (role === AdminRole.OEM) {
      statusQuery.$or = [
        { 'marketingDetails.employeeUserName': oemUserName },
        { 'marketingDetails.oemUserName': oemUserName }
      ];
    }

    const queryFilter: any = await MarketingAnalyticModel.aggregate([
      {
        $match: query
      },
      { $set: { marketingKey: { $toObjectId: '$marketingId' } } },
      {
        $lookup: {
          from: 'marketings',
          localField: 'marketingKey',
          foreignField: '_id',
          as: 'marketingDetails'
        }
      },
      { $unwind: { path: '$marketingDetails' } },
      {
        $addFields: {
          'marketingDetails.status': {
            $cond: {
              if: { $eq: ['$marketingDetails.endDate', currentDate] },
              then: 'ENABLED',
              else: {
                $cond: {
                  if: { $lt: ['$marketingDetails.endDate', currentDate] },
                  then: 'DISABLED',
                  else: 'ENABLED'
                }
              }
            }
          }
        }
      },
      { $match: statusQuery },
      { $project: { marketingDetails: 0 } },
      {
        $project: {
          createdAt: 1,
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' },
          moduleInformation: 1
        }
      },
      {
        $group: {
          _id: { month: '$month', year: '$year' },
          views: { $sum: 1 }
        }
      },
      {
        $project: {
          date: {
            $let: {
              vars: {
                monthNames: monthNames
              },
              in: {
                $concat: [
                  {
                    $arrayElemAt: [
                      '$$monthNames',
                      { $subtract: ['$_id.month', 1] }
                    ]
                  },
                  ' ',
                  { $toString: '$_id.year' }
                ]
              }
            }
          },
          views: 1,
          _id: 0
        }
      }
    ]);

    const allMonths = monthNames.map((month) => ({
      [`${month}`]: 0,
      date: month
    }));

    const resultWithAllMonths = allMonths.map((month) => {
      const monthName = Object.keys(month)[0];
      const aggregatedData = queryFilter.find(
        (item: any) => item.date === `${monthName} ${new Date().getFullYear()}`
      );

      if (aggregatedData) {
        return { [`${monthName}`]: aggregatedData.views, date: month.date };
      }

      return { [`${monthName}`]: 0, date: month.date };
    });

    resultWithAllMonths.sort((a, b) => {
      const monthIndexA = monthNames.indexOf(a.date);
      const monthIndexB = monthNames.indexOf(b.date);

      return monthIndexA - monthIndexB;
    });

    return resultWithAllMonths;
  }

  async getMarketingAll(
    role: string,
    oemUserName: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    storeId: string,
    platform: string,
    oemId?: string,
    userName?: string,
    status?: string,
    oemUserId?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    Logger.debug(`${role} ${oemUserName} getTrafficAnalaytic`);
    const firstDay = firstDate
      ? new Date(
          Date.UTC(
            new Date(firstDate).getUTCFullYear(),
            new Date(firstDate).getUTCMonth(),
            new Date(firstDate).getUTCDate(),
            0,
            0,
            0,
            0
          )
        )
      : null;
    const nextDate = lastDate
      ? new Date(
          Date.UTC(
            new Date(lastDate).getUTCFullYear(),
            new Date(lastDate).getUTCMonth(),
            new Date(lastDate).getUTCDate(),
            23,
            59,
            59,
            999
          )
        )
      : null;
    // nextDate.setDate(lastDay.getDate() + 1);
    const tday = new Date();

    query = {
      'userInformation.state': state,
      'userInformation.city': city
    };

    if (platform === 'PARTNER' || platform === 'CUSTOMER') {
      const platformPrefix =
        platform === 'PARTNER' ? 'PARTNER_APP' : 'CUSTOMER_APP';
      query.$or = [
        { platform: `${platformPrefix}_ANDROID` },
        { platform: `${platformPrefix}_IOS` }
      ];
    }

    if (!userName) {
      delete query['oemUserName'];
    }
    if (!state) delete query['userInformation.state'];
    if (!city) delete query['userInformation.city'];
    if (!platform) {
      delete query['platform'];
    }

    if (role === AdminRole.EMPLOYEE && oemId !== 'SERVICEPLUG') {
      query.oemUserName = oemId;
    }

    const statusQuery: any = {};
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (storeId) statusQuery['marketingDetails.storeId'] = storeId;
    if (userName) statusQuery['marketingDetails.oemUserName'] = userName;
    if (oemUserId) statusQuery['marketingDetails.oemUserName'] = oemUserId;
    if (status) statusQuery['marketingDetails.status'] = status;
    if (role === AdminRole.OEM) {
      statusQuery.$or = [
        { 'marketingDetails.employeeUserName': oemUserName },
        { 'marketingDetails.oemUserName': oemUserName }
      ];
    }

    const aggregateMarketingAnalytic = async (
      query: any,
      statusQuery: any,
      groupByField: string,
      firstDay: Date,
      nextDate: Date
    ) => {
      return MarketingAnalyticModel.aggregate([
        { $match: query },
        { $set: { marketingKey: { $toObjectId: '$marketingId' } } },
        {
          $lookup: {
            from: 'marketings',
            localField: 'marketingKey',
            foreignField: '_id',
            as: 'marketingDetails'
          }
        },
        { $unwind: { path: '$marketingDetails' } },
        {
          $addFields: {
            'marketingDetails.status': {
              $cond: {
                if: { $eq: ['$marketingDetails.endDate', currentDate] },
                then: 'ENABLED',
                else: {
                  $cond: {
                    if: { $lt: ['$marketingDetails.endDate', currentDate] },
                    then: 'DISABLED',
                    else: 'ENABLED'
                  }
                }
              }
            }
          }
        },
        { $match: statusQuery },
        { $project: { marketingDetails: 0 } },
        {
          $group: {
            _id: `$${groupByField}`,
            initialCount: { $sum: 1 },
            queryCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$createdAt', firstDay] },
                      { $lte: ['$createdAt', nextDate] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            name: '$_id',
            count: '$queryCount',
            total: '$initialCount',
            _id: 0
          }
        }
      ]);
    };

    const getCombinedAnalytics = async (
      query: any,
      statusQuery: any,
      firstDay: Date,
      nextDate: Date
    ) => {
      const eventBasedResults = await aggregateMarketingAnalytic(
        query,
        statusQuery,
        'event',
        firstDay,
        nextDate
      );

      const phoneBasedResults = await aggregateMarketingAnalytic(
        query,
        statusQuery,
        'userInformation.phoneNumber',
        firstDay,
        nextDate
      );

      return [
        ...eventBasedResults,
        {
          name: 'phoneNumber',
          total: phoneBasedResults.filter((item) => item.total !== 0)?.length,
          count: phoneBasedResults.filter((item) => item.count !== 0)?.length
        }
      ];
    };

    const combinedResult = await getCombinedAnalytics(
      query,
      statusQuery,
      firstDay,
      nextDate
    );
    return combinedResult;
  }

  async marketingPaginatedAll(req: any, userName?: string, role?: string) {
    Logger.info('<Service>:<AnalyticService>:<Get all AnalyticService>');

    const {
      state,
      city,
      firstDate,
      lastDate,
      storeId,
      platform,
      oemUsername,
      pageNo = 0,
      pageSize = 10,
      oemId,
      status
    } = req || {};

    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);

    const query: any = {
      'marketingAnalytics.createdAt': {
        $gte: firstDay,
        $lte: nextDate
      },
      'marketingAnalytics.userInformation.state': state,
      'marketingAnalytics.userInformation.city': city
    };

    if (!state) delete query['marketingAnalytics.userInformation.state'];
    if (!city) delete query['marketingAnalytics.userInformation.city'];

    if (platform === 'PARTNER' || platform === 'CUSTOMER') {
      const platformPrefix =
        platform === 'PARTNER' ? 'PARTNER_APP' : 'CUSTOMER_APP';
      query['marketingAnalytics.platform'] = {
        $in: [`${platformPrefix}_ANDROID`, `${platformPrefix}_IOS`]
      };
    }

    const statusQuery: any = {};
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (storeId) statusQuery['storeId'] = storeId;
    if (oemUsername) statusQuery['oemUserName'] = oemUsername;
    if (status) statusQuery['status'] = status;

    if (role === AdminRole.OEM) {
      statusQuery.$or = [
        { employeeUserName: userName },
        { oemUserName: userName }
      ];
    }

    const response = await Marketing.aggregate([
      {
        $addFields: {
          status: {
            $cond: {
              if: { $eq: ['$endDate', currentDate] },
              then: 'ENABLED',
              else: {
                $cond: {
                  if: { $lt: ['$endDate', currentDate] },
                  then: 'DISABLED',
                  else: 'ENABLED'
                }
              }
            }
          }
        }
      },
      { $match: statusQuery },
      { $set: { marketingKey: { $toString: '$_id' } } },
      {
        $lookup: {
          from: 'marketinganalytics',
          localField: 'marketingKey',
          foreignField: 'marketingId',
          as: 'marketingAnalytics'
        }
      },

      {
        $set: {
          impressionCount: {
            $size: {
              $filter: {
                input: '$marketingAnalytics',
                as: 'item',
                cond: { $eq: ['$$item.event', 'IMPRESSION_COUNT'] }
              }
            }
          },
          enquiryCount: {
            $size: {
              $filter: {
                input: '$marketingAnalytics',
                as: 'item',
                cond: { $eq: ['$$item.event', 'ENQUIRY_SUBMISSION'] }
              }
            }
          },
          shareCount: {
            $size: {
              $filter: {
                input: '$marketingAnalytics',
                as: 'item',
                cond: { $eq: ['$$item.event', 'SHARE_INFORMATION'] }
              }
            }
          },
          viewStoreCount: {
            $size: {
              $filter: {
                input: '$marketingAnalytics',
                as: 'item',
                cond: { $eq: ['$$item.event', 'VIEW_STORE'] }
              }
            }
          },
          uniqueVisits: {
            $size: {
              $setUnion: [
                {
                  $map: {
                    input: '$marketingAnalytics',
                    as: 'item',
                    in: {
                      phoneNumber: '$$item.userInformation.phoneNumber',
                      marketingId: '$$item.marketingId'
                    }
                  }
                },
                []
              ]
            }
          }
        }
      },
      { $match: query },
      { $sort: { impressionCount: -1 } },
      {
        $facet: {
          paginatedResults: [
            { $skip: pageNo * pageSize },
            { $limit: pageSize },
            { $project: { marketingAnalytics: 0 } }
          ],
          totalCount: [{ $count: 'totalCount' }]
        }
      }
    ]);

    const marketingResponse = response[0]?.paginatedResults || [];
    const totalCount = response[0]?.totalCount[0]?.totalCount || 0;

    return {
      marketingResponse,
      totalCount
    };
  }

  async getAtiveUsersByHour(
    currentDate: any,
    lastDaysStart: any,
    platform: any
  ) {
    const firstDate: any = new Date(currentDate);
    const lastDate: any = new Date(lastDaysStart);
    const dateDifference = (firstDate - lastDate) / (1000 * 3600 * 24);

    const query: any = {
      createdAt: {
        $gte: lastDate,
        $lt: firstDate
      }
    };

    if (platform === 'PARTNER' || platform === 'CUSTOMER') {
      const platformPrefix =
        platform === 'PARTNER' ? 'PARTNER_APP' : 'CUSTOMER_APP';
      query.$or = [
        { platform: `${platformPrefix}_ANDROID` },
        { platform: `${platformPrefix}_IOS` }
      ];
    }

    const aggregateStages: any = [
      {
        $match: query
      },
      {
        $project: {
          phoneNumber: '$userInformation.phoneNumber',
          day: { $dayOfMonth: '$createdAt' },
          month: { $month: '$createdAt' },
          hourStr: {
            $dateToString: {
              format: '%H',
              date: '$createdAt',
              timezone: 'Asia/Kolkata'
            }
          }
        }
      },
      {
        $project: {
          phoneNumber: 1,
          day: 1,
          month: 1,
          hour: { $toInt: '$hourStr' }
        }
      }
    ];

    if (dateDifference <= 15) {
      aggregateStages.push(
        {
          $group: {
            _id: {
              day: '$day',
              hour: '$hour',
              month: '$month',
              phoneNumber: '$phoneNumber'
            }
          }
        },
        {
          $group: {
            _id: { day: '$_id.day', hour: '$_id.hour', month: '$_id.month' },
            uniqueUsers: { $sum: 1 }
          }
        }
      );
    } else {
      aggregateStages.push(
        {
          $group: {
            _id: {
              month: '$month',
              hour: '$hour',
              phoneNumber: '$phoneNumber'
            }
          }
        },
        {
          $group: {
            _id: { month: '$_id.month', hour: '$_id.hour' },
            uniqueUsers: { $sum: 1 }
          }
        }
      );
    }

    aggregateStages.push({
      $sort: { '_id.month': 1, '_id.hour': 1 }
    });

    const result = await MarketingAnalyticModel.aggregate(aggregateStages);

    const data = [];
    const hourMap: any = {};

    if (dateDifference <= 15) {
      let currentDate = new Date(lastDate);
      let firstDateTime = firstDate.getTime();

      while (currentDate.getTime() <= firstDateTime) {
        for (let hour = 0; hour < 24; hour++) {
          const hourData = result.find(
            (r) => r._id.day === currentDate.getDate() && r._id.hour === hour
          );
          hourMap[`${currentDate.getDate()}-${hour}`] = hourData
            ? hourData.uniqueUsers
            : 0;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      currentDate = new Date(lastDate);
      while (currentDate.getTime() <= firstDateTime) {
        for (let hour = 0; hour < 24; hour += 2) {
          const hour1 = `${currentDate.getDate()}-${hour}`;
          const hour2 = `${currentDate.getDate()}-${hour + 1}`;

          const uniqueUsersInFirstHour = hourMap[hour1] || 0;
          const uniqueUsersInSecondHour = hourMap[hour2] || 0;

          const totalUniqueUsers =
            uniqueUsersInFirstHour + uniqueUsersInSecondHour;

          data.push({
            day: currentDate.getDate(),
            month: result.find((r) => r._id.day === currentDate.getDate())
              ? result.find((r) => r._id.day === currentDate.getDate())._id
                  .month
              : firstDate.getMonth() + 1,
            x: `${hour}-${hour + 2}`,
            y: totalUniqueUsers
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      const monthMap: any = {};

      for (const item of result) {
        const month = item._id.month;
        const hour = item._id.hour;
        const day = item._id.day;
        const uniqueUsers = item.uniqueUsers;

        if (!monthMap[month]) {
          monthMap[month] = {};
        }

        const hourSlotStart = Math.floor(hour / 2) * 2;
        const hourSlotEnd = hourSlotStart + 2;
        const hourRange = `${hourSlotStart}-${hourSlotEnd}`;

        if (!monthMap[month][day]) {
          monthMap[month][day] = {};
        }

        if (!monthMap[month][day][hourRange]) {
          monthMap[month][day][hourRange] = 0;
        }

        monthMap[month][day][hourRange] += uniqueUsers;
      }

      Object.keys(monthMap).forEach((month) => {
        const days = monthMap[month];

        Object.keys(days).forEach((day) => {
          for (let hour = 0; hour < 24; hour += 2) {
            const hourSlotStart = hour;
            const hourSlotEnd = hour + 2;
            const hourRange = `${hourSlotStart}-${hourSlotEnd}`;

            const totalUniqueUsers = days[day][hourRange] || 0;

            data.push({
              day: parseInt(month),
              month: parseInt(month),
              x: hourRange,
              y: totalUniqueUsers
            });
          }
        });
      });
    }

    return data;
  }

  async getMarketingUserByArea(
    role: string,
    userName: string,
    state: string,
    city: string,
    firstDate: string,
    lastDate: string,
    storeId: string,
    platform: string,
    oemId?: string,
    adminFilterOemId?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    Logger.debug(`${firstDate} ${lastDate} datateee`);
    // const c_Date = new Date();
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);

    query = {
      createdAt: {
        $gte: firstDay,
        $lte: nextDate
      },
      'userInformation.state': state,
      'userInformation.city': city,
      // event: 'LOCATION_CHANGE',
      // platform: platform,
      // moduleInformation: storeId
      // oemUserName: role
      oemUserName: adminFilterOemId
    };
    if (!adminFilterOemId) {
      delete query['oemUserName'];
    }
    if (!firstDate || !lastDate) {
      delete query['createdAt'];
    }
    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    // if (!platform) {
    //   delete query['platform'];
    // }
    if (platform === 'PARTNER' || platform === 'CUSTOMER') {
      const platformPrefix =
        platform === 'PARTNER' ? 'PARTNER_APP' : 'CUSTOMER_APP';
      query['platform'] = {
        $in: [`${platformPrefix}_ANDROID`, `${platformPrefix}_IOS`]
      };
    }
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }

    const queryFilter: any = await MarketingAnalyticModel.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: '$userInformation.geoLocation.coordinates',
          users: {
            $sum: 1
          },
          state: {
            $first: '$userInformation.state'
          },
          city: {
            $first: '$userInformation.city'
          },
          geoLocation: {
            $first: '$userInformation.geoLocation'
          }
        }
      },
      {
        $project: {
          geoLocation: 1,
          users: 1,
          state: 1,
          city: 1,
          _id: 0
        }
      },
      { $sort: { users: -1 } }
      // { $limit: 1000 }
    ]);
    return queryFilter;
  }

  /// Marketing video analytic creation api end ===========================
  ///======================================================================//
}
