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

    const getEventAnalytic = await EventAnalyticModel.findOne({
      'userInformation.userId': userResult?._id || requestData.userId,
      moduleInformation: requestData?.moduleInformation
    });
    Logger.debug(`${JSON.stringify(getEventAnalytic)}, getEventAnalytic`);
    if (!_.isEmpty(getEventAnalytic)) {
      return 'the impression is already created this store';
      // throw new Error('User does not exist');
    }
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
    storeId: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    if (role === AdminRole.OEM) {
      query.userName = userName;
    }

    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    query = {
      'userInformation.state': state,
      'userInformation.city': city,
      createdAt: {
        $gte: firstDay,
        $lte: lastDay
      },
      event: 'IMPRESSION_COUNT',
      moduleInformation: storeId
    };

    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    if (!storeId) {
      delete query['moduleInformation'];
    }
    Logger.debug(`${JSON.stringify(query)} ${role} ${userName} datateee`);
    // const c_Date = new Date();

    const storeResult = await Store.find({ oemUserName: role });

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

    // if (queryFilter && Array.isArray(queryFilter)) {
    //   queryFilter = await Promise.all(
    //     queryFilter.map(async (queryFilter) => {
    //     const storeData = storeResult.find((val : any) => )
    //     })
    //   );
    // }
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
    if (role === AdminRole.OEM) {
      query.userName = userName;
    }
    Logger.debug(`${firstDate} ${lastDate} datateee`);
    // const c_Date = new Date();
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const tday = new Date();

    query = {
      'userInformation.state': state,
      'userInformation.city': city,
      createdAt: {
        $gte: firstDay,
        $lte: lastDay
      },
      event: 'LOGIN_OTP_VERIFY',
      moduleInformation: storeId
    };

    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    if (!storeId) {
      delete query['moduleInformation'];
    }

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
    storeId: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    if (role === AdminRole.OEM) {
      query.userName = userName;
    }
    Logger.debug(`${firstDate} ${lastDate} datateee`);
    // const c_Date = new Date();
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);

    query = {
      createdAt: {
        $gte: firstDay,
        $lte: lastDay
      },
      'userInformation.state': state,
      'userInformation.city': city,
      event: 'LOGIN_OTP_VERIFY',
      moduleInformation: storeId
    };
    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    if (!storeId) {
      delete query['moduleInformation'];
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
        $limit: 10
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
    storeId: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    if (role === AdminRole.OEM) {
      query.userName = userName;
    }
    Logger.debug(`${firstDate} ${lastDate} datateee`);
    // const c_Date = new Date();
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const tday = new Date();

    query = {
      'userInformation.state': state,
      'userInformation.city': city,
      createdAt: {
        $gte: firstDay,
        $lte: lastDay
      },
      // event: 'LOGIN_OTP_VERIFY',
      moduleInformation: storeId
    };

    if (!state) {
      delete query['userInformation.state'];
    }
    if (!city) {
      delete query['userInformation.city'];
    }
    if (!storeId) {
      delete query['moduleInformation'];
    }

    const queryFilter: any = await EventAnalyticModel.aggregate([
      {
        $match: query
      },
      // {
      //   $project: {
      //     createdAt: 1,
      //     moduleInformation: 1,
      //     mapView: {
      //       $cond: [{ $eq: ['$event', 'MAP_VIEW'] }, 1, 0]
      //     },
      //     phoneNumberClick: {
      //       $cond: [{ $eq: ['$event', 'PHONE_NUMBER_CLICK'] }, 1, 0]
      //     }
      //   }
      // },
      // {
      //   $group: {
      //     _id: '$moduleInformation',
      //     mapResult: { $sum: '$mapView' },
      //     phoneResult: { $sum: '$phoneNumberClick' }
      //   }
      // }
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
          // totalEvent: {
          //   $push: {
          //     createdAt: '$_id.createdAt',
          //     moduleInformation: '$_id.moduleInformation'
          //   }
          // },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          _id: 0,
          count: 1
          // totalEvent: 1
        }
      }
    ]);
    return queryFilter;
  }
}
