import { body } from 'express-validator';
import { injectable } from 'inversify';
import Logger from '../config/winston';
// import { AdminRole } from './../models/Admin';
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

  async getVerifiedStores() {
    Logger.info(
      '<Service>:<CategoryService>:<Get all Category service initiated>'
    );
    const gstVerStores = await Store.count({
      'verificationDetails.documentType': 'GST'
    });
    const aadharVerStores = await Store.count({
      'verificationDetails.documentType': 'AADHAR'
    });
    return { gstVerified: gstVerStores, aadharVerified: aadharVerStores };
  }

  async getTotalUsers() {
    Logger.info(
      '<Service>:<CategoryService>:<Get all users service initiated>'
    );
    const totalManu = await Admin.count({ companyType: 'Manufacturer' });
    const totalDist = await Admin.count({ companyType: 'Distributer' });
    return { totalManufacturer: totalManu, totalDistributers: totalDist };
  }

  async getTotalStores(queryParams: any) {
    Logger.info(
      '<Service>:<AnalyticService>:<Get all store service initiated>'
    );
    const query = queryParams;
    let isFilterEmpty = true;
    if (_.isEmpty(query)) {
      const res = await Store.count();
      const resData = await Store.find();
      return {
        totalStores: res,
        stores: resData,
        isFilterEmpty
      };
    } else {
      isFilterEmpty = false;
      let resData: any[] = [];
      if ((query?.from || query?.to) && query?.state) {
        resData = await this.getStoreFilterByDateState(query);
      } else if ((query?.from || query?.to) && _.isEmpty(query?.state)) {
        resData = await this.getStoreFilterByDate(query);
      } else {
        resData = await Store.find({
          'contactInfo.state': { $in: query?.state }
        });
      }
      return {
        stores: resData,
        isFilterEmpty
      };
    }
  }

  getStoreFilterByDateState = async (query: any) => {
    let res: any[] = [];
    if (!_.isEmpty(query?.from) && !_.isEmpty(query?.to)) {
      res = await Store.find({
        $and: [
          { createdAt: { $gte: query?.from, $lte: query?.to } },
          { 'contactInfo.state': { $in: query?.state } }
        ]
      });
    } else if (_.isEmpty(query?.from) && !_.isEmpty(query?.to)) {
      res = await Store.find({
        $and: [
          { createdAt: { $lte: query?.to } },
          { 'contactInfo.state': { $in: query?.state } }
        ]
      });
    } else {
      res = await Store.find({
        $and: [
          {
            createdAt: { $gte: query?.from }
          },
          { 'contactInfo.state': { $in: query?.state } }
        ]
      });
    }
    return res;
  };

  getStoreFilterByDate = async (query: any) => {
    let res: any[] = [];
    if (!_.isEmpty(query?.from) && !_.isEmpty(query?.to)) {
      res = await Store.find({
        createdAt: { $gte: query?.from, $lte: query?.to }
      });
    } else if (_.isEmpty(query?.from) && !_.isEmpty(query?.to)) {
      res = await Store.find({
        createdAt: { $lte: query?.to }
      });
    } else {
      res = await Store.find({
        createdAt: { $gte: query?.from }
      });
    }
    return res;
  };
}
