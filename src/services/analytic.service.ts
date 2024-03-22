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
import EventAnalyticModel, { IEventAnalytic } from '../models/EventAnalytic';

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
    }
    // if (!_.isEmpty(requestData?.coordinates)) {
    const userLocation: any = {};
    // await fetch(
    //   `https://nominatim.openstreetmap.org/reverse?lat=${requestData?.coordinates[1]}&lon=${requestData?.coordinates[0]}&format=json`
    // );

    // }
    userData.userId = userResult?._id || requestData.userId;
    userData.fullName = userResult?.fullName || requestData.fullName;
    userData.phoneNumber = userResult?.phoneNumber || requestData.phoneNumber;
    userData.geoLocation = {
      type: 'Point',
      coordinates: requestData?.coordinates
    };
    userData.address = userLocation?.address?.suburb || '';
    userData.state = userLocation?.address?.state || '';
    userData.city = userLocation?.address?.state_district || '';
    userData.pincode = userLocation?.address?.postcode || '';
    Logger.debug(`${JSON.stringify(userData?.geoLocation)}sssss`);

    eventResult.userInformation = userData;

    Logger.info(
      '<Service>:<CategoryService>:<Create analytic service initiated>'
    );
    const newAnalytic = await EventAnalyticModel.create(eventResult);
    Logger.info('<Service>:<CategoryService>:<analytic created successfully>');
    return newAnalytic;
  }

  async getEventAnalytic(userName: string, role: string) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    const query: any = {};
    if (role === AdminRole.OEM) {
      query.userName = userName;
    }
    const queryFilter: any = await EventAnalyticModel.find(query, {
      'verificationDetails.verifyObj': 0
    }).lean();
    return queryFilter;
  }
}
