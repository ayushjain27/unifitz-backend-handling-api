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

  async searchAndFilterStoreData(searchReqBody: {
    startDate: string;
    endDate: string;
    subCategory: string;
    category: string;
    state: string;
    city: string;
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

    const query = {
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
    res = await Store.find(query, {
      'verificationDetails.verifyObj': 0
    });
    return res;
  }
}
