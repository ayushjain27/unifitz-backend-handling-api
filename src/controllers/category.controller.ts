import { Response } from 'express';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { CategoryService } from '../services';
import Logger from '../config/winston';
import Request from '../types/request';
// import { TYPES } from '../config/inversify.types';
import { CategoryResponse } from '../interfaces/category.interface';
import { TYPES } from '../config/inversify.types';

@injectable()
export class CategoryController {
  private categoryService: CategoryService;
  constructor(@inject(TYPES.CategoryService) categoryService: CategoryService) {
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
      '<Controller>:<CategoryController>:<Get All categories request controller initiated>'
    );
    try {
      const result: CategoryResponse[] = await this.categoryService.getAll();
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getCategoryByCategoryId = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<CategoryController>:<Get category request controller initiated>'
    );
    try {
      const categoryId = req.params.categoryId;
      const result = await this.categoryService.getCategoryByCategoryId(
        categoryId as string
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  deleteCategory = async (req: Request, res: Response) => {
    try {
      const categoryId = req.params.categoryId;
      Logger.info(
        '<Controller>:<CategoryController>:<Delete category request controller initiated>'
      );
      if (!categoryId) {
        throw new Error(` ${categoryId} categoryId required`);
      } else {
        await this.categoryService.deleteCategory(categoryId);
      }
      res.send({
        status: 'deleted',
        deleted: true
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  createCategories = async (req: Request, res: Response) => {
    try {
      Logger.info(
        '<Controller>:<CategoryController>:<Delete category request controller initiated>'
      );
      const result = await this.categoryService.createCategories(req.body);
      res.send({
        res: result,
        created: 'successful'
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateCategories = async (req: Request, res: Response) => {
    try {
      Logger.info(
        '<Controller>:<CategoryController>:<edit category request controller initiated>'
      );
      const result = await this.categoryService.updateCategories(req.body);
      res.send({
        res: result,
        updated: 'successful'
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getBrands = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<CategoryController>:<Get All brands request controller initiated>'
    );
    try {
      const result: CategoryResponse[] = await this.categoryService.getBrands();
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  uploadCategoryImages = async (req: Request, res: Response) => {
    // Validate the request body
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res
    //     .status(HttpStatusCodes.BAD_REQUEST)
    //     .json({ errors: errors.array() });
    // }
    const { categoryId } = req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Upload Vehicle request initiated>'
    );
    try {
      const result = await this.categoryService.uploadCategoryImages(
        categoryId,
        req
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
