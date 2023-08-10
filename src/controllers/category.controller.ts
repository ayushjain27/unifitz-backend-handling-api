import { Response } from 'express';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { CategoryService } from '../services';
import Logger from '../config/winston';
import Request from '../types/request';
// import { TYPES } from '../config/inversify.types';
import { CategoryResponse } from '../interfaces/category.interface';

@injectable()
export class CategoryController {
  private categoryService: CategoryService;
  constructor(@inject('categoryService') categoryService: CategoryService) {
    this.categoryService = categoryService;
  }
  // createStore = async (req: Request, res: Response) => {
  //   const storeRequest: StoreRequest = req.body;
  //   Logger.info(
  //     '<Controller>:<StoreController>:<Onboarding request controller initiated>'
  //   );
  //   try {
  //     if (req?.role === AdminRole.ADMIN || req?.role === AdminRole.OEM) {
  //       const { phoneNumber } = storeRequest;
  //       await User.findOneAndUpdate(
  //         { phoneNumber, role: 'STORE_OWNER' },
  //         { phoneNumber, role: 'STORE_OWNER' },
  //         { upsert: true, new: true }
  //       );
  //     }
  //     const userName = req?.userId;
  //     const role = req?.role;
  //     const result = await this.storeService.create(
  //       storeRequest,
  //       userName,
  //       role
  //     );
  //     res.send({
  //       message: 'Store Onboarding Successful',
  //       result
  //     });
  //   } catch (err) {
  //     Logger.error(err.message);
  //     res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
  //   }
  // };

  // updateStore = async (req: Request, res: Response) => {
  //   const storeRequest: StoreRequest = req.body;
  //   Logger.info(
  //     '<Controller>:<StoreController>:<Onboarding request controller initiated>'
  //   );
  //   try {
  //     const userName = req?.userId;
  //     const role = req?.role;
  //     const result = await this.storeService.update(
  //       storeRequest,
  //       userName,
  //       role
  //     );
  //     res.send({
  //       message: 'Store Updation Successful',
  //       result
  //     });
  //   } catch (err) {
  //     Logger.error(err.message);
  //     res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
  //   }
  // };

  getAllCategories = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<StoreController>:<Get All categories request controller initiated>'
    );
    try {
      const userName = req?.userId;
      const role = req?.role;

      const result: CategoryResponse[] = await this.categoryService.getAll(
        userName,
        role
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
  // searchStores = async (req: Request, res: Response) => {
  //   const { category, brand, storeName } = req.query;
  //   let { subCategory } = req.query;
  //   if (subCategory) {
  //     subCategory = (subCategory as string).split(',');
  //   } else {
  //     subCategory = [];
  //   }
  //   Logger.info(
  //     '<Controller>:<StoreController>:<Search and Filter Stores request controller initiated>'
  //   );
  //   try {
  //     const result: StoreResponse[] = await this.storeService.searchAndFilter(
  //       storeName as string,
  //       category as string,
  //       subCategory as string[],
  //       brand as string
  //     );
  //     res.send({
  //       result
  //     });
  //   } catch (err) {
  //     Logger.error(err.message);
  //     res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
  //   }
  // };
}
