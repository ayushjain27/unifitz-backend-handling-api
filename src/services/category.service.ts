import { injectable } from 'inversify';
import Logger from '../config/winston';
// import { AdminRole } from './../models/Admin';
import {
  CategoryResponse,
  CategoryRequest
} from '../interfaces/category.interface';
import _ from 'lodash';
import Catalog from '../models/Catalog';
import { Types } from 'mongoose';
import container from '../config/inversify.container';
import { S3Service } from './s3.service';
import { TYPES } from '../config/inversify.types';

@injectable()
export class CategoryService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async getAll() {
    Logger.info(
      '<Service>:<CategoryService>:<Get all Category service initiated>'
    );
    const query: any = {};
    const result: CategoryResponse[] = await Catalog.find(query).lean();
    return result;
  }

  async getAllPaginatedCategories(
    pageNo?: number,
    pageSize?: number,
    searchQuery?: string
  ) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all Category service initiated>'
    );
    const query: any = {};
    if (searchQuery) {
      query.$or = [{ catalogName: searchQuery }, { catalogType: searchQuery }];
    }
    const result = await Catalog.aggregate([
      {
        $match: query
      },
      {
        $skip: pageNo * pageSize
      },
      {
        $limit: pageSize
      }
    ]);
    return result;
  }

  async getAllRootCategories() {
    Logger.info(
      '<Service>:<CategoryService>:<Get all root Category service initiated>'
    );
    const query: any = { parent: 'root' };
    const result: CategoryResponse[] = await Catalog.find(query).lean();
    return result;
  }

  async getBrands() {
    Logger.info(
      '<Service>:<CategoryService>:<Get all Brands service initiated>'
    );
    const query: any = {};
    query.catalogType = 'brand';
    const result: CategoryResponse[] = await Catalog.find(query).lean();
    return result;
  }

  async getCategoryByCategoryId(categoryId?: string) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all Category service initiated>'
    );
    const query: any = {};
    query._id = new Types.ObjectId(categoryId);
    const res = await Catalog.find(query);
    return res;
  }

  async deleteCategory(categoryId?: string) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all Category service initiated>'
    );
    const query: any = {};
    query.status = 'INACTIVE';
    const _id = new Types.ObjectId(categoryId);
    const res = await Catalog.findOneAndUpdate(_id, query, {
      returnDocument: 'after'
    });
    return res;
  }

  async createCategories(categoryList?: any) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all Category service initiated>'
    );
    const query: CategoryRequest = categoryList;
    const result = await Catalog.create(query);
    return result;
  }

  async updateCategories(categoryReq?: any) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all Category service initiated>'
    );
    const categoryReqQuery: CategoryRequest = categoryReq;
    const query: any = {};
    query._id = categoryReq._id;
    const updatedCategory = await Catalog.findOneAndUpdate(
      query,
      categoryReqQuery,
      {
        returnDocument: 'after'
      }
    );
    return updatedCategory;
  }

  async uploadCategoryImages(
    categoryId: string,
    req: Request | any
  ): Promise<any> {
    Logger.info('<Service>:<StoreService>:<Upload Vehicles initiated>');
    const category = await Catalog.findOne({ _id: categoryId });
    if (_.isEmpty(category)) {
      throw new Error('Store does not exist');
    }

    const files: Array<any> = req.files;
    if (!files) {
      throw new Error('Files not found');
    }
    const query: any = {};
    for (const file of files) {
      const fileName:
        | 'first'
        | 'second'
        | 'third'
        | 'catalogIcon'
        | 'catalogWebIcon' = file.originalname?.split('.')[0];
      const { key, url } = await this.s3Client.uploadFile(
        categoryId,
        fileName,
        file.buffer
      );
      if (fileName === 'catalogIcon') {
        query.catalogIcon = url;
      } else if (fileName === 'catalogWebIcon') {
        query.catalogWebIcon = url;
      }
      // else {
      //   documents.storeImageList[fileName] = { key, docURL: url };
      // }
    }
    const res = await Catalog.findOneAndUpdate({ _id: categoryId }, query, {
      returnDocument: 'after'
    });
    return res;
  }
}
