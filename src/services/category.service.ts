import { injectable } from 'inversify';
import Logger from '../config/winston';
import Category from '../models/Category';
import { CategoryResponse } from '../interfaces/category.interface';
import Catalog, { ICatalog } from '../models/Catalog';

// import Customer, { ICustomer } from './../models/Customer';

@injectable()
export class CategoryService {
  async getAll(userName?: string, role?: string) {
    Logger.info(
      '<Service>:<StoreService>:<Get all Category service initiated>'
    );
    const query: any = {};
    const category: CategoryResponse[] = await Category.find(query).lean();
    return category;
  }
}
