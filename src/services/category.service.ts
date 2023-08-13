import { injectable } from 'inversify';
import Logger from '../config/winston';
// import { AdminRole } from './../models/Admin';
import Category from '../models/Category';
import {
  CategoryResponse,
  CategoryRequest
} from '../interfaces/category.interface';
// import Catalog, { ICatalog } from '../models/Catalog';
import { Types } from 'mongoose';

// import Customer, { ICustomer } from './../models/Customer';

@injectable()
export class CategoryService {
  async getAll() {
    Logger.info(
      '<Service>:<CategoryService>:<Get all Category service initiated>'
    );
    const query: any = {};
    const result: CategoryResponse[] = await Category.find(query).lean();
    return result;
  }

  async deleteCategory(categoryId?: string) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all Category service initiated>'
    );
    const query: any = {};
    query._id = new Types.ObjectId(categoryId);
    const res = await Category.findOneAndDelete(query);
    return res;
  }

  async createCategories(categoryList?: any) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all Category service initiated>'
    );
    const list: CategoryRequest[] = [];
    categoryList.forEach((categoryItem: any) => {
      list.push(categoryItem);
    });
    const newCategories = new Category(list);
    await newCategories.save();
    return newCategories;
  }
}
