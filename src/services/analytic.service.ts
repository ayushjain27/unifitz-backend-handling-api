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

  async getTotalUsers() {
    Logger.info(
      '<Service>:<CategoryService>:<Get all users service initiated>'
    );
    const totalManu = await Admin.count({ companyType: 'Manufacturer' });
    const totalDist = await Admin.count({ companyType: 'Distributers' });
    return { totalManufacturer: totalManu, totalDistributers: totalDist };
  }

  async getTotalStores(req: any) {
    Logger.info(
      '<Service>:<AnalyticService>:<Get all store service initiated>'
    );
    const query = req?.body;
    let isFilterEmpty = true;
    if (_.isEmpty(query)) {
      const res = await Store.count();
      const resData = await Store.find();
      return { totalStores: res, stores: resData, isFilterEmpty };
    } else {
      isFilterEmpty = false;
      const res = await Store.find({
        $and: [
          { createdAt: { $gte: query?.from, $lte: query?.to } },
          { 'contactInfo.state': { $in: query?.state } }
        ]
      }).count();
      const resData = await Store.find({
        $and: [
          { createdAt: { $gte: query?.from, $lte: query?.to } },
          { 'contactInfo.state': { $in: query?.state } }
        ]
      });
      return { totalStores: res, stores: resData, isFilterEmpty };
    }
  }
}
