import { body } from 'express-validator';
import { Response } from 'express';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { AnalyticService } from '../services';
import Logger from '../config/winston';
import _ from 'lodash';
import Request from '../types/request';
// import { TYPES } from '../config/inversify.types';
import { TYPES } from '../config/inversify.types';

@injectable()
export class AnalyticController {
  private analyticService: AnalyticService;
  constructor(@inject(TYPES.AnalyticService) analyticService: AnalyticService) {
    this.analyticService = analyticService;
  }
  getTotalCustomers = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<AnalyticController>:<Get All customers request controller initiated>'
    );
    try {
      const result = await this.analyticService.getTotalCustomers();
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getTotalUsers = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<AnalyticController>:<Get All users request controller initiated>'
    );
    try {
      const result = await this.analyticService.getTotalUsers();
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getTotalStores = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<AnalyticController>:<Get All users request controller initiated>'
    );
    try {
      const result = await this.analyticService.getTotalStores(req);
      if (result?.isFilterEmpty) {
        res.send({
          result
        });
      } else {
        if (!_.isEmpty(req.body.category) || !_.isEmpty(req.body.subCategory)) {
          const filterStores = await this.filterStoresByCatSubCat(result, req);
          res.send({
            ...filterStores,
            totalStores: filterStores?.stores?.length
          });
        } else {
          res.send({ ...result, totalStores: result?.stores?.length });
        }
      }
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  public filterStoresByCatSubCat = async (list: any, query: any) => {
    let res = 0;
    const resData: any[] = [];
    list?.stores.map((data: any) => {
      let isCatMatched = false;
      data.basicInfo?.category.map((cat: any) => {
        if (
          cat?.name === query?.body?.category &&
          !_.isEmpty(query?.body?.subCategory)
        ) {
          isCatMatched = true;
        } else if (cat?.name === query?.body?.category) {
          res = res + 1;
          resData.push(data);
        }
      });
      if (isCatMatched) {
        data.basicInfo?.subCategory.map((subCat: any) => {
          if (subCat?.name === query.body.subCategory) {
            res = res + 1;
            resData.push(data);
          }
        });
      }
    });
    return { totalStores: res, stores: resData };
  };

  // getAllCategories = async (req: Request, res: Response) => {
  //   Logger.info(
  //     '<Controller>:<CategoryController>:<Get All categories request controller initiated>'
  //   );
  //   try {
  //     const result: CategoryResponse[] = await this.categoryService.getAll();
  //     res.send({
  //       result
  //     });
  //   } catch (err) {
  //     Logger.error(err.message);
  //     res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
  //   }
  // };
  // getAllRootCategories = async (req: Request, res: Response) => {
  //   Logger.info(
  //     '<Controller>:<CategoryController>:<Get All root categories request controller initiated>'
  //   );
  //   try {
  //     const result: CategoryResponse[] =
  //       await this.categoryService.getAllRootCategories();
  //     res.send({
  //       result
  //     });
  //   } catch (err) {
  //     Logger.error(err.message);
  //     res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
  //   }
  // };

  // getCategoryByCategoryId = async (req: Request, res: Response) => {
  //   Logger.info(
  //     '<Controller>:<CategoryController>:<Get category request controller initiated>'
  //   );
  //   try {
  //     const categoryId = req.params.categoryId;
  //     const result = await this.categoryService.getCategoryByCategoryId(
  //       categoryId as string
  //     );
  //     res.send({
  //       result
  //     });
  //   } catch (err) {
  //     Logger.error(err.message);
  //     res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
  //   }
  // };

  // deleteCategory = async (req: Request, res: Response) => {
  //   try {
  //     const categoryId = req.params.categoryId;
  //     Logger.info(
  //       '<Controller>:<CategoryController>:<Delete category request controller initiated>'
  //     );
  //     if (!categoryId) {
  //       throw new Error(` ${categoryId} categoryId required`);
  //     } else {
  //       await this.categoryService.deleteCategory(categoryId);
  //     }
  //     res.send({
  //       status: 'in-active',
  //       deleted: true
  //     });
  //   } catch (err) {
  //     Logger.error(err.message);
  //     res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
  //   }
  // };

  // createCategories = async (req: Request, res: Response) => {
  //   try {
  //     Logger.info(
  //       '<Controller>:<CategoryController>:<Delete category request controller initiated>'
  //     );
  //     const result = await this.categoryService.createCategories(req.body);
  //     res.send({
  //       res: result,
  //       created: 'successful'
  //     });
  //   } catch (err) {
  //     Logger.error(err.message);
  //     res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
  //   }
  // };

  // updateCategories = async (req: Request, res: Response) => {
  //   try {
  //     Logger.info(
  //       '<Controller>:<CategoryController>:<edit category request controller initiated>'
  //     );
  //     const result = await this.categoryService.updateCategories(req.body);
  //     res.send({
  //       res: result,
  //       updated: 'successful'
  //     });
  //   } catch (err) {
  //     Logger.error(err.message);
  //     res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
  //   }
  // };

  // getBrands = async (req: Request, res: Response) => {
  //   Logger.info(
  //     '<Controller>:<CategoryController>:<Get All brands request controller initiated>'
  //   );
  //   try {
  //     const result: CategoryResponse[] = await this.categoryService.getBrands();
  //     res.send({
  //       result
  //     });
  //   } catch (err) {
  //     Logger.error(err.message);
  //     res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
  //   }
  // };

  // uploadCategoryImages = async (req: Request, res: Response) => {
  //   const { categoryId } = req.body;
  //   Logger.info(
  //     '<Controller>:<VehicleInfoController>:<Upload Vehicle request initiated>'
  //   );
  //   try {
  //     const result = await this.categoryService.uploadCategoryImages(
  //       categoryId,
  //       req
  //     );
  //     res.send({
  //       result
  //     });
  //   } catch (err) {
  //     Logger.error(err.message);
  //     res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
  // }
}
