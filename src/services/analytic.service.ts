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
      ...query
    });
    const aadharVerStores = await Store.count({
      'verificationDetails.documentType': 'AADHAR',
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

  async getTotalStores(queryParams: any) {
    Logger.info(
      '<Service>:<AnalyticService>:<Get all store service initiated>'
    );
    const userName = queryParams?.userId;
    const role = queryParams?.role;
    const filterQuery = queryParams.body;
    let isFilterEmpty = true;
    const query: any = {};
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }
    if (_.isEmpty(filterQuery)) {
      const stores: any = await Store.find(query, {
        'verificationDetails.verifyObj': 0
      }).lean();
      const res = stores.length;
      const resData = stores;
      return {
        totalStores: res,
        stores: resData,
        isFilterEmpty
      };
    } else {
      isFilterEmpty = false;
      let resData: any[] = [];
      if ((filterQuery?.from || filterQuery?.to) && filterQuery?.state) {
        resData = await this.getStoreFilterByDateState(filterQuery, query);
      } else if (
        (filterQuery?.from || filterQuery?.to) &&
        _.isEmpty(filterQuery?.state)
      ) {
        resData = await this.getStoreFilterByDate(filterQuery, query);
      } else {
        resData = await Store.find({
          'contactInfo.state': { $in: filterQuery?.state },
          ...query
        });
      }
      return {
        stores: resData,
        isFilterEmpty
      };
    }
  }

  getStoreFilterByDateState = async (query: any, userQuery: any) => {
    let res: any[] = [];
    if (!_.isEmpty(query?.from) && !_.isEmpty(query?.to)) {
      res = await Store.find({
        $and: [
          { createdAt: { $gte: query?.from, $lte: query?.to } },
          { 'contactInfo.state': { $in: query?.state } },
          { ...userQuery }
        ]
      });
    } else if (_.isEmpty(query?.from) && !_.isEmpty(query?.to)) {
      res = await Store.find({
        $and: [
          { createdAt: { $lte: query?.to } },
          { 'contactInfo.state': { $in: query?.state } },
          { ...userQuery }
        ]
      });
    } else {
      res = await Store.find({
        $and: [
          {
            createdAt: { $gte: query?.from }
          },
          { 'contactInfo.state': { $in: query?.state } },
          { ...userQuery }
        ]
      });
    }
    return res;
  };

  getStoreFilterByDate = async (query: any, userQuery: any) => {
    let res: any[] = [];
    if (!_.isEmpty(query?.from) && !_.isEmpty(query?.to)) {
      res = await Store.find({
        createdAt: { $gte: query?.from, $lte: query?.to },
        ...userQuery
      });
    } else if (_.isEmpty(query?.from) && !_.isEmpty(query?.to)) {
      res = await Store.find({
        createdAt: { $lte: query?.to },
        ...userQuery
      });
    } else {
      res = await Store.find({
        createdAt: { $gte: query?.from },
        ...userQuery
      });
    }
    return res;
  };

  async searchAndFilterStoreData(searchReqBody: {
    startDate: string;
    endDate: string;
    subCategory: string;
    category: string;
    state: string;
  }) {
    Logger.info(
      '<Service>:<StoreService>:<Search and Filter stores service initiated>'
    );

    const startDate = new Date(searchReqBody.startDate.toString());
    const endDate = new Date(searchReqBody.endDate.toString());
    endDate.setDate(endDate.getDate() + 1);

    const query = {
      // 'contactInfo.geoLocation': {
      //   $near: {
      //     $geometry: { type: 'Point', coordinates: searchReqBody.coordinates }
      //   }
      // },
      'basicInfo.category.name': { $in: searchReqBody.category },
      'basicInfo.subCategory.name': { $in: searchReqBody.subCategory },
      'contactInfo.state': { $in: searchReqBody.state },
      createdAt: { $gte: startDate, $lt: endDate }
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
    Logger.debug(query);

    let res: any[] = [];
    res = await Store.find(query, {
      'verificationDetails.verifyObj': 0
    });
    return res;
  }
}
