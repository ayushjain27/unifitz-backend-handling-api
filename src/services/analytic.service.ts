import { body } from 'express-validator';
import { injectable } from 'inversify';
import Logger from '../config/winston';
import { AdminRole } from './../models/Admin';
import { StoreResponse } from '../interfaces';
// import {
//   CategoryResponse,
//   CategoryRequest
// } from '../interfaces/category.interface';
import _ from 'lodash';
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
import OfferModel from './../models/Offers';
import SchoolOfAutoModel from '../models/SchoolOfAuto';
import BusinessModel from '../models/Business';
import EventAnalyticModel, {
  IEventAnalytic
} from '../models/CustomerEventAnalytic';
import PartnerAnalyticModel from '../models/PartnerAnalytic';
import PlusFeatureAnalyticModel from '../models/PlusFeaturesAnalytic';

@injectable()
export class AnalyticService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async getTotalCustomers() {
    Logger.info(
      '<Service>:<CategoryService>:<Get all Category service initiated>'
    );
    const result = await Customer.find({ companyType: 'Manufacturer' });
    return { total: result };
  }

  async getVerifiedStores(userName: string, role: string, oemId?: string) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all Category service initiated>'
    );
    const query: any = {};
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    const gstVerStores = await Store.count({
      'verificationDetails.documentType': 'GST',
      profileStatus: 'ONBOARDED',
      ...query
    });
    const aadharVerStores = await Store.count({
      'verificationDetails.documentType': 'AADHAR',
      profileStatus: 'ONBOARDED',
      ...query
    });
    return { gstVerified: gstVerStores, aadharVerified: aadharVerStores };
  }

  async getTotalUsers(userName: string, role: string) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all users service initiated>'
    );
    const query: any = {};
    if (role === AdminRole.OEM) {
      query.userName = userName;
    }
    const queryFilter: any = await Admin.find(query, {
      'verificationDetails.verifyObj': 0
    }).lean();
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
      // 'contactInfo.geoLocation': {
      //   $near: {
      //     $geometry: { type: 'Point', coordinates: searchReqBody.coordinates }
      //   }
      // },
      'basicInfo.category.name': { $in: searchReqBody.category },
      'basicInfo.subCategory.name': { $in: searchReqBody.subCategory },
      'basicInfo.brand.name': { $in: searchReqBody.brandName },
      'contactInfo.state': { $in: searchReqBody.state },
      'contactInfo.city': { $in: searchReqBody.city },
      createdAt: { $gte: startDate, $lt: endDate },
      profileStatus: 'ONBOARDED',
      storeId: searchReqBody.storeId,
      oemUserName: searchReqBody.oemUserId
    };
    if (!searchReqBody.storeId) {
      delete query['storeId'];
    }
    if (!searchReqBody.oemUserId) {
      delete query['oemUserName'];
    }
    if (!searchReqBody.category) {
      delete query['basicInfo.category.name'];
    }
    if (!searchReqBody.subCategory || searchReqBody.subCategory.length === 0) {
      delete query['basicInfo.subCategory.name'];
    }
    if (!searchReqBody.brandName) {
      delete query['basicInfo.brand.name'];
    }
    if (!searchReqBody.state) {
      delete query['contactInfo.state'];
    }
    if (!searchReqBody.city) {
      delete query['contactInfo.city'];
    }
    if (!startDate && !endDate) {
      delete query.createdAt;
    }
    Logger.debug(query);

    let res: any[] = [];
    if (searchReqBody.role === AdminRole.OEM) {
      query.oemUserName = searchReqBody.userName;
    }

    if (searchReqBody.role === AdminRole.EMPLOYEE) {
      query.oemUserName = searchReqBody.oemId;
    }

    if (searchReqBody.oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    res = await Store.find(query, {
      'verificationDetails.verifyObj': 0
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
      })?.lean();

      if (_.isEmpty(userResult)) {
        throw new Error('User does not exist');
      }
    }

    const customerResponse = await Customer.findOne({
      phoneNumber: `+91${userResult.phoneNumber.slice(-10)}`
    }).lean();

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
        $addFields: {
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        }
      },
      {
        $group: {
          _id: {
            day: '$day',
            month: '$month'
          },
          views: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.day',
          viewsByMonth: {
            $push: {
              month: '$_id.month',
              views: '$views'
            }
          }
        }
      },
      {
        $project: {
          date: '$_id',
          views: {
            $arrayToObject: {
              $map: {
                input: '$viewsByMonth',
                as: 'item',
                in: {
                  k: {
                    $switch: {
                      branches: [
                        { case: { $eq: ['$$item.month', 1] }, then: 'Jan' },
                        { case: { $eq: ['$$item.month', 2] }, then: 'Feb' },
                        { case: { $eq: ['$$item.month', 3] }, then: 'Mar' },
                        { case: { $eq: ['$$item.month', 4] }, then: 'Apr' },
                        { case: { $eq: ['$$item.month', 5] }, then: 'May' },
                        { case: { $eq: ['$$item.month', 6] }, then: 'Jun' },
                        { case: { $eq: ['$$item.month', 7] }, then: 'Jul' },
                        { case: { $eq: ['$$item.month', 8] }, then: 'Aug' },
                        { case: { $eq: ['$$item.month', 9] }, then: 'Sep' },
                        { case: { $eq: ['$$item.month', 10] }, then: 'Oct' },
                        { case: { $eq: ['$$item.month', 11] }, then: 'Nov' },
                        { case: { $eq: ['$$item.month', 12] }, then: 'Dec' }
                      ],
                      default: 'Unknown'
                    }
                  },
                  v: '$$item.views'
                }
              }
            }
          }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    const formattedResults = queryFilter.map((item) => ({
      ...item.views,
      date: item.date
    }));

    return formattedResults;
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
      { $sort: { users: -1 } },
      { $limit: 1000 }
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
      event: { $ne: 'IMPRESSION_COUNT' },
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

    return combinedResult;
  }

  async createPlusFeatures(requestData: any): Promise<any> {
    let userResult: any = {};
    const userData: any = {};
    const eventResult = requestData;
    let customerResponse: any = {};

    userResult = await User.findOne({
      _id: new Types.ObjectId(requestData.userId)
    })?.lean();

    if (requestData?.phoneNumber || !_.isEmpty(userResult)) {
      customerResponse = await Customer.findOne({
        phoneNumber: `+91${userResult.phoneNumber.slice(-10)}`
      }).lean();
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
    const storeEvent = await EventAnalyticModel.count({
      ...query
    });
    const bannerEvent = await PlusFeatureAnalyticModel.count();
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
    // console.log(query, 'queryquery');

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
    const combinedResult2 = await EventAnalyticModel.count(query2);
    delete query['createdAt'];
    const combinedResult3 = await EventAnalyticModel.count(query2);

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
    userName?: string
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
    //   query.oemUserName = oemUserName;
    // }
    // if (role === AdminRole.EMPLOYEE) {
    //   query.oemUserName = oemId;
    // }
    // if (oemId === 'SERVICEPLUG') {
    //   delete query['oemUserName'];
    // }

    const statusQuery: any = {};
    if (storeId) statusQuery['marketingDetails.storeId'] = storeId;
    if (userName) statusQuery['marketingDetails.oemUserName'] = userName;

    const queryFilter: any = await MarketingAnalyticModel.aggregate([
      { $match: query },
      { $set: { marketingID: { $toObjectId: '$marketingId' } } },
      {
        $lookup: {
          from: 'marketing',
          localField: 'marketingID',
          foreignField: '_id',
          as: 'marketingDetails'
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
    userName?: string
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

    if (storeId) statusQuery['marketingDetails.storeId'] = storeId;
    if (userName) statusQuery['marketingDetails.oemUserName'] = userName;

    const queryFilter: any = await MarketingAnalyticModel.aggregate([
      {
        $match: query
      },
      { $set: { marketingID: { $toObjectId: '$marketingId' } } },
      {
        $lookup: {
          from: 'marketing',
          localField: 'marketingID',
          foreignField: '_id',
          as: 'marketingDetails'
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
    userName?: string
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

    const statusQuery: any = {};

    if (storeId) statusQuery['marketingDetails.storeId'] = storeId;
    if (userName) statusQuery['marketingDetails.oemUserName'] = userName;

    const aggregateMarketingAnalytic = async (
      query: any,
      statusQuery: any,
      groupByField: string,
      firstDay: Date,
      nextDate: Date
    ) => {
      return MarketingAnalyticModel.aggregate([
        { $match: query },
        { $set: { marketingID: { $toObjectId: '$marketingId' } } },
        {
          $lookup: {
            from: 'marketing',
            localField: 'marketingID',
            foreignField: '_id',
            as: 'marketingDetails'
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

  /// Marketing video analytic creation api end ===========================
  ///======================================================================//
}
