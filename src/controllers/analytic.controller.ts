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

  getVerifiedStores = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<AnalyticController>:<Get All verified stores controller initiated>'
    );
    try {
      const result = await this.analyticService.getVerifiedStores();
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

  // getVerifiedStores = async (req: Request, res: Response) => {
  //   Logger.info(
  //     '<Controller>:<AnalyticController>:<Get All users request controller initiated>'
  //   );
  //   const gstVerStores = await Store.count({
  //     'verificationDetails.documentType': 'GST'
  //   });
  //   const aadharVerStores = await Store.count({
  //     'verificationDetails.documentType': 'AADHAR'
  //   });
  //   try {
  //     const result = await this.analyticService.getVerifiedStores();
  //     res.send({
  //       result
  //     });
  //   } catch (err) {
  //     Logger.error(err.message);
  //     res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
  //   }
  // };

  getTotalStores = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<AnalyticController>:<Get All users request controller initiated>'
    );
    try {
      const queryParams = req.body;
      const result = await this.analyticService.getTotalStores(queryParams);
      if (result?.isFilterEmpty) {
        res.send({
          ...result
        });
      } else {
        if (!_.isEmpty(req.body.category) || !_.isEmpty(req.body.subCategory)) {
          const filterStores = await this.filterStoresByCatSubCat(result, req);
          res.send({
            ...filterStores,
            totalStores: filterStores?.stores?.length
          });
        } else {
          res.send({
            ...result,
            totalStores: result?.stores?.length
          });
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
}
