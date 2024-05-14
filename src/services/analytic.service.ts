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
import OfferModel from './../models/Offers';
import SchoolOfAutoModel from '../models/SchoolOfAuto';
import BusinessModel from '../models/Business';
import EventAnalyticModel, {
  IEventAnalytic
} from '../models/CustomerEventAnalytic';
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

  async getVerifiedStores(userName: string, role: string) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all Category service initiated>'
    );
    const query: any = {};
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
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
      'contactInfo.state': { $in: searchReqBody.state },
      'contactInfo.city': { $in: searchReqBody.city },
      createdAt: { $gte: startDate, $lt: endDate },
      profileStatus: 'ONBOARDED'
    };
    if (!searchReqBody.category) {
      delete query['basicInfo.category.name'];
    }
    if (!searchReqBody.subCategory || searchReqBody.subCategory.length === 0) {
      delete query['basicInfo.subCategory.name'];
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

    // if (requestData.event === 'IMPRESSION_COUNT') {
    //   const getEventAnalytic = await EventAnalyticModel.findOne({
    //     'userInformation.userId': userResult?._id || requestData.userId,
    //     moduleInformation: requestData?.moduleInformation,
    //     platform: requestData?.platform
    //   });
    //   Logger.debug(`${JSON.stringify(getEventAnalytic)}, getEventAnalytic`);
    //   if (!_.isEmpty(getEventAnalytic)) {
    //     return 'the impression is already created this store';
    //   }
    // }
    const customerResponse = await Customer.findOne({
      phoneNumber: `+91${userResult.phoneNumber.slice(-10)}`
    }).lean();

    userData.userId = userResult?._id || requestData.userId;
    userData.fullName = customerResponse?.fullName || '';
    userData.email = customerResponse?.email || '';
    userData.phoneNumber = userResult?.phoneNumber || requestData.phoneNumber;
    userData.geoLocation = {
      type: 'Point',
      coordinates: requestData?.coordinates
    };
    userData.address = requestData?.address || '';
    userData.state = requestData?.state || '';
    userData.city = requestData?.city || '';
    userData.pincode = requestData?.pincode || '';

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
    userName: string,
    role: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    storeId: string,
    platform: string
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
      oemUserName: role
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
    if (userName !== AdminRole.OEM) {
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
          },
          stores: {
            $push: {
              store: '$_id.store'
            }
          }
        }
      },
      {
        $addFields: {
          stores: {
            $map: {
              input: {
                $setUnion: '$stores'
              },
              as: 'j',
              in: {
                storeName: '$$j.store',
                storeVisited: {
                  $size: {
                    $filter: {
                      input: '$stores',
                      cond: {
                        $eq: ['$$this.store', '$$j.store']
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        $set: {
          topViewStore: {
            $arrayElemAt: [
              '$stores',
              {
                $indexOfArray: [
                  '$stores.storeVisited',
                  { $max: '$stores.storeVisited' }
                ]
              }
            ]
          }
        }
      },
      {
        $project: {
          date: {
            $toString: '$_id'
          },
          views: 1,
          stores: 1,
          topViewStore: 1,
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
    userName: string,
    role: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    storeId: string
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
      event: 'LOCATION_CHANGE'
      // moduleInformation: storeId
      // oemUserName: role
    };

    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
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
          _id: {
            createdAt: '$createdAt',
            platform: '$platform',
            phoneNumber: '$userInformation.phoneNumber'
          }
        }
      },
      {
        $group: {
          _id: '$_id.platform',
          activeUsers: {
            $push: {
              createdAt: '$_id.createdAt',
              phoneNumber: '$_id.phoneNumber'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          _id: 0,
          count: 1,
          activeUsers: 1
        }
      }
    ]);
    return queryFilter;
  }

  async getUsersByState(
    userName: string,
    role: string,
    state: string,
    city: string,
    firstDate: string,
    lastDate: string,
    storeId: string,
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
      event: 'LOCATION_CHANGE',
      platform: platform
      // moduleInformation: storeId
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
    const queryFilter: any = await EventAnalyticModel.aggregate([
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

  async getTrafficAnalaytic(
    userName: string,
    role: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    storeId: string,
    platform: string
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
      moduleInformation: storeId,
      platform: platform,
      oemUserName: role
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
    if (userName !== AdminRole.OEM) {
      delete query['oemUserName'];
    }

    const queryFilter: any = await EventAnalyticModel.aggregate([
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
    return queryFilter;
  }

  async createPlusFeatures(requestData: any): Promise<any> {
    let userResult: any = {};
    const userData: any = {};
    const eventResult = requestData;
    userResult = await User.findOne({
      _id: new Types.ObjectId(requestData.userId)
    })?.lean();

    if (_.isEmpty(userResult)) {
      throw new Error('User does not exist');
    }

    // if (requestData.event === 'IMPRESSION_COUNT') {
    //   const getPlusFeatureAnalytic = await PlusFeatureAnalyticModel.findOne({
    //     'userInformation.userId': userResult?._id || requestData.userId,
    //     moduleInformation: requestData?.moduleInformation
    //   });
    //   Logger.debug(
    //     `${JSON.stringify(getPlusFeatureAnalytic)}, getPlusFeatureAnalytic`
    //   );
    //   if (!_.isEmpty(getPlusFeatureAnalytic)) {
    //     return 'the impression is already created';
    //   }
    // }
    const customerResponse = await Customer.findOne({
      phoneNumber: `+91${userResult.phoneNumber.slice(-10)}`
    }).lean();

    userData.userId = userResult?._id || requestData.userId;
    userData.fullName = customerResponse?.fullName || '';
    userData.email = customerResponse?.email || '';
    userData.phoneNumber = userResult?.phoneNumber || requestData.phoneNumber;
    userData.geoLocation = {
      type: 'Point',
      coordinates: requestData?.coordinates
    };
    userData.address = requestData?.address || '';
    userData.state = requestData?.state || '';
    userData.city = requestData?.city || '';
    userData.pincode = requestData?.pincode || '';

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
    userName: string,
    role: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    moduleId: string,
    platform: string
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
      platform: platform,
      oemUserName: role
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
    if (userName !== AdminRole.OEM) {
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
    return queryFilter;
  }

  async getAdvertisementAnalytic(
    userName: string,
    role: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string,
    moduleId: string,
    platform: string
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
      platform: platform,
      oemUserName: role
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
    if (userName !== AdminRole.OEM) {
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
          },
          moduleResult: {
            $push: {
              eventId: '$_id.eventId',
              moduleName: '$_id.moduleName',
              eventName: '$_id.eventName'
            }
          }
        }
      },
      {
        $addFields: {
          moduleResult: {
            $map: {
              input: {
                $setUnion: '$moduleResult'
              },
              as: 'j',
              in: {
                eventId: '$$j.eventId',
                moduleName: '$$j.moduleName',
                eventName: '$$j.eventName',
                eventVisited: {
                  $size: {
                    $filter: {
                      input: '$moduleResult',
                      cond: {
                        $eq: ['$$this.eventId', '$$j.eventId']
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        $set: {
          topView: {
            $arrayElemAt: [
              '$moduleResult',
              {
                $indexOfArray: [
                  '$moduleResult.eventVisited',
                  { $max: '$moduleResult.eventVisited' }
                ]
              }
            ]
          }
        }
      },
      {
        $project: {
          date: {
            $toString: '$_id'
          },
          views: 1,
          moduleResult: 1,
          topView: 1,
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
    userName: string,
    role: string,
    state: string,
    city: string,
    firstDate: string,
    lastDate: string,
    moduleId: string,
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
}
