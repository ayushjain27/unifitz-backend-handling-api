import { Response } from 'express';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { AnalyticService } from '../services';
import Logger from '../config/winston';
import _ from 'lodash';
import Request from '../types/request';
import { body, validationResult, query } from 'express-validator';
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
    const userName = req?.userId;
    const role = req?.role;
    const oemId = req?.query?.oemId;
    try {
      const result = await this.analyticService.getVerifiedStores(
        userName,
        role,
        oemId as string
      );
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
    const userName = req?.userId;
    const role = req?.role;
    try {
      const result = await this.analyticService.getTotalUsers(userName, role);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAnalyticsMapsData = async (req: Request, res: Response) => {
    const {
      startDate,
      endDate,
      category,
      subCategory,
      state,
      city,
      oemId,
      oemUserId,
      brandName,
      storeId
    }: {
      startDate: string;
      endDate: string;
      category: string;
      subCategory: string;
      state: string;
      city: string;
      oemId: string;
      oemUserId: string;
      brandName: string;
      storeId: string;
    } = req.body;
    const role = req?.role;
    const userName = req?.userId;
    Logger.info(
      '<Controller>:<StoreController>:<Search and Filter Stores pagination request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<StoreController>:<Search and Filter Stores pagination request controller initiated>'
      );
      const result = await this.analyticService.searchAndFilterStoreData({
        startDate,
        endDate,
        category,
        subCategory,
        state,
        city,
        role,
        userName,
        oemId,
        oemUserId,
        brandName,
        storeId
      });
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getPlusFeatureData = async (req: Request, res: Response) => {
    const {
      startDate,
      endDate,
      category,
      subCategory,
      state,
      city,
      oemId
    }: {
      startDate: string;
      endDate: string;
      category: string;
      subCategory: string;
      state: string;
      city: string;
      oemId?: string;
    } = req.body;
    const role = req?.role;
    const userName = req?.userId;
    Logger.info(
      '<Controller>:<StoreController>:<Search and Filter Stores pagination request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<StoreController>:<Search and Filter Stores pagination request controller initiated>'
      );
      const result = await this.analyticService.getPlusFeatureData({
        startDate,
        endDate,
        category,
        subCategory,
        state,
        city,
        role,
        userName,
        oemId
      });
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  createEventAnalytic = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const requestData = req.body;
    Logger.info(
      '<Controller>:<StoreController>:<Create  analytic controller initiated>'
    );
    try {
      const result = await this.analyticService.createEventAnalytic(
        requestData
      );
      res.send({
        message: 'OK !!!!'
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getEventAnalytic = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const {
      firstDate,
      lastDate,
      state,
      city,
      storeId,
      platform,
      oemId,
      adminFilterOemId,
      brandName
    } = req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getEventAnalytic(
        role,
        userName,
        firstDate,
        lastDate,
        state,
        city,
        storeId,
        platform,
        oemId,
        adminFilterOemId,
        brandName
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getCustomerEventAnalytic = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const {
      firstDate,
      lastDate,
      state,
      city,
      storeId,
      platform,
      oemId,
      adminFilterOemId,
      brandName
    } = req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getCustomerEventAnalytic(
        role,
        userName,
        firstDate,
        lastDate,
        state,
        city,
        storeId,
        platform,
        oemId,
        adminFilterOemId,
        brandName
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getActiveUser = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const {
      firstDate,
      lastDate,
      state,
      city,
      storeId,
      oemId,
      adminFilterOemId,
      brandName
    } = req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getActiveUser(
        role,
        userName,
        firstDate,
        lastDate,
        state,
        city,
        storeId,
        oemId,
        adminFilterOemId,
        brandName
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getUsersByState = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const {
      firstDate,
      lastDate,
      state,
      city,
      storeId,
      platform,
      oemId,
      adminFilterOemId,
      brandName
    } = req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getUsersByState(
        role,
        userName,
        state,
        city,
        firstDate,
        lastDate,
        storeId,
        platform,
        oemId,
        adminFilterOemId,
        brandName
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getUsersByArea = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const {
      firstDate,
      lastDate,
      state,
      city,
      storeId,
      platform,
      oemId,
      adminFilterOemId,
      brandName
    } = req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getUsersByArea(
        role,
        userName,
        state,
        city,
        firstDate,
        lastDate,
        storeId,
        platform,
        oemId,
        adminFilterOemId,
        brandName
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getTrafficAnalaytic = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const {
      firstDate,
      lastDate,
      state,
      city,
      storeId,
      platform,
      oemId,
      adminFilterOemId,
      brandName
    } = req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getTrafficAnalaytic(
        role,
        userName,
        firstDate,
        lastDate,
        state,
        city,
        storeId,
        platform,
        oemId,
        adminFilterOemId,
        brandName
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  createPlusFeatures = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const requestData = req.body;
    Logger.info(
      '<Controller>:<AnalyticController>:<Create  analytic controller initiated>'
    );
    try {
      const result = await this.analyticService.createPlusFeatures(requestData);
      res.send({
        message: 'OK !!!!'
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getPlusFeatureAnalytic = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const { firstDate, lastDate, state, city, moduleId, platform, oemId } =
      req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getPlusFeatureAnalytic(
        role,
        userName,
        firstDate,
        lastDate,
        state,
        city,
        moduleId,
        platform,
        oemId
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getAdvertisementAnalytic = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const { firstDate, lastDate, state, city, moduleId, platform, oemId } =
      req.body;
    try {
      Logger.info(
        '<Controller>:<AnalyticController>:<get analytic request initiated>'
      );
      const result = await this.analyticService.getAdvertisementAnalytic(
        role,
        userName,
        firstDate,
        lastDate,
        state,
        city,
        moduleId,
        platform,
        oemId
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getPlusFeatureAnalyticByCity = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const { firstDate, lastDate, state, city, moduleId, platform, oemId } =
      req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getPlusFeatureAnalyticByCity(
        role,
        userName,
        state,
        city,
        firstDate,
        lastDate,
        moduleId,
        platform,
        oemId
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getCategoriesAnalytic = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const { firstDate, lastDate, state, city, moduleId, platform, oemId } =
      req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getCategoriesAnalytic(
        role,
        userName,
        state,
        city,
        firstDate,
        lastDate,
        moduleId,
        platform,
        oemId
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getPlusFeatureAnalyticTypes = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const { firstDate, lastDate, state, city, platform, module } = req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getPlusFeatureAnalyticTypes(
        role,
        userName,
        state,
        city,
        firstDate,
        lastDate,
        module,
        platform
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getStoreImpressoin = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<AnalyticController>:<Get All verified stores controller initiated>'
    );
    const userName = req?.userId;
    const role = req?.role;
    try {
      const result = await this.analyticService.getStoreImpressoin(
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

  createPartnerAnalytic = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const requestData = req.body;
    Logger.info(
      '<Controller>:<StoreController>:<Create  analytic controller initiated>'
    );
    try {
      const result = await this.analyticService.createPartnerAnalytic(
        requestData
      );
      res.send({
        message: 'OK !!!!'
        // result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getPartnerAnalytic = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const { firstDate, lastDate, state, city, storeId, platform, oemId } =
      req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getPartnerAnalytic(
        role,
        userName,
        firstDate,
        lastDate,
        state,
        city,
        storeId,
        platform,
        oemId
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getActivePartnerUsers = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const { currentDate } = req.body;
    // const { firstDate, lastDate, state, city, storeId, platform, oemId } =
    //   req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getActivePartnerUsers(
        role,
        userName,
        currentDate
        // firstDate,
        // lastDate,
        // state,
        // city,
        // storeId,
        // platform,
        // oemId
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getOverallPartnerUsers = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const { firstDate, lastDate } = req.body;
    // const { firstDate, lastDate, state, city, storeId, platform, oemId } =
    //   req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getOverallPartnerUsers(
        role,
        userName,
        firstDate,
        lastDate
        // state,
        // city,
        // storeId,
        // platform,
        // oemId
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };
  /// buysell vehicle analytic creation api start ===========================
  ///======================================================================//

  createVehicleAnalytic = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const requestData = req.body;
    Logger.info(
      '<Controller>:<StoreController>:<Create  analytic controller initiated>'
    );
    try {
      const result = await this.analyticService.createVehicleAnalytic(
        requestData
      );
      res.send({
        message: 'OK !!!!'
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getVehicleAnalytic = async (req: Request, res: Response) => {
    const role = req?.role;
    const oemUserName = req?.userId;
    const {
      firstDate,
      lastDate,
      state,
      city,
      storeId,
      platform,
      oemId,
      brandName,
      userName,
      vehicleType
    } = req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getVehicleAnalytic(
        role,
        oemUserName,
        firstDate,
        lastDate,
        state,
        city,
        storeId,
        platform,
        oemId,
        brandName,
        userName,
        vehicleType
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getVehicleAnalyticByYear = async (req: Request, res: Response) => {
    const role = req?.role;
    const oemUserName = req?.userId;
    const {
      firstDate,
      lastDate,
      state,
      city,
      storeId,
      platform,
      oemId,
      brandName,
      userName,
      vehicleType
    } = req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getVehicleAnalyticByYear(
        role,
        oemUserName,
        firstDate,
        lastDate,
        state,
        city,
        storeId,
        platform,
        oemId,
        brandName,
        userName,
        vehicleType
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getBuyVehicleAll = async (req: Request, res: Response) => {
    const role = req?.role;
    const oemUserName = req?.userId;
    const {
      firstDate,
      lastDate,
      state,
      city,
      storeId,
      platform,
      oemId,
      brandName,
      userName,
      vehicleType
    } = req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getBuyVehicleAll(
        role,
        oemUserName,
        firstDate,
        lastDate,
        state,
        city,
        storeId,
        platform,
        oemId,
        brandName,
        userName,
        vehicleType
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getBuyVehicleStore = async (req: Request, res: Response) => {
    const role = req?.role;
    const oemUserName = req?.userId;
    const {
      firstDate,
      lastDate,
      state,
      city,
      storeId,
      platform,
      oemId,
      brandName,
      userName,
      vehicleType
    } = req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getBuyVehicleStore(
        role,
        oemUserName,
        firstDate,
        lastDate,
        state,
        city,
        storeId,
        platform,
        oemId,
        brandName,
        userName,
        vehicleType
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  /// buysell vehicle analytic creation api end ===========================
  ///======================================================================//

  /// New vehicle analytic creation api start===========================
  ///======================================================================//

  createNewVehicle = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const requestData = req.body;
    Logger.info(
      '<Controller>:<Vehiclecontroller>:<Create  analytic controller initiated>'
    );
    try {
      const result = await this.analyticService.createNewVehicle(requestData);
      res.send({
        message: 'OK !!!!',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getNewVehicleImpression = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const {
      firstDate,
      lastDate,
      state,
      city,
      storeId,
      platform,
      oemId,
      adminFilterOemId,
      brandName
    } = req.body;
    try {
      Logger.info(
        '<Controller>:<Vehiclecontroller>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getNewVehicleImpression(
        role,
        userName,
        firstDate,
        lastDate,
        state,
        city,
        storeId,
        platform,
        oemId,
        adminFilterOemId,
        brandName
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getNewVehicleAll = async (req: Request, res: Response) => {
    const role = req?.role;
    const userName = req?.userId;
    const {
      firstDate,
      lastDate,
      state,
      city,
      storeId,
      platform,
      oemId,
      adminFilterOemId,
      brandName
    } = req.body;
    try {
      Logger.info(
        '<Controller>:<Vehiclecontroller>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getNewVehicleAll(
        role,
        userName,
        firstDate,
        lastDate,
        state,
        city,
        storeId,
        platform,
        oemId,
        adminFilterOemId,
        brandName
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  /// New vehicle analytic creation api end===========================
  ///======================================================================//

  /// Marketing Video analytic creation api start===========================
  ///======================================================================//

  createMarketingAnalytic = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const requestData = req.body;
    Logger.info(
      '<Controller>:<Vehiclecontroller>:<Create  analytic controller initiated>'
    );
    try {
      const result = await this.analyticService.createMarketingAnalytic(
        requestData
      );
      res.send({
        message: 'OK !!!!',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getMarketingAnalytic = async (req: Request, res: Response) => {
    const role = req?.role;
    const oemUserName = req?.userId;
    const {
      firstDate,
      lastDate,
      state,
      city,
      storeId,
      platform,
      oemId,
      userName
    } = req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getMarketingAnalytic(
        role,
        oemUserName,
        firstDate,
        lastDate,
        state,
        city,
        storeId,
        platform,
        oemId,
        userName
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getMarketingImpressionByYear = async (req: Request, res: Response) => {
    const role = req?.role;
    const oemUserName = req?.userId;
    const {
      firstDate,
      lastDate,
      state,
      city,
      storeId,
      platform,
      oemId,
      userName
    } = req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getMarketingImpressionByYear(
        role,
        oemUserName,
        firstDate,
        lastDate,
        state,
        city,
        storeId,
        platform,
        oemId,
        userName
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getMarketingAll = async (req: Request, res: Response) => {
    const role = req?.role;
    const oemUserName = req?.userId;
    const {
      firstDate,
      lastDate,
      state,
      city,
      storeId,
      platform,
      oemId,
      userName
    } = req.body;
    try {
      Logger.info(
        '<Controller>:<StoreController>:<get analytic request controller initiated>'
      );
      const result = await this.analyticService.getMarketingAll(
        role,
        oemUserName,
        firstDate,
        lastDate,
        state,
        city,
        storeId,
        platform,
        oemId,
        userName
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  marketingPaginatedAll = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<AnalyticController>:<Get all marketing request controller initiated>'
    );
    const userName = req?.userId;
    const role = req?.role;
    try {
      const result = await this.analyticService.marketingPaginatedAll(
        req.body,
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

  /// Marketing Video analytic creation api end===========================
  ///======================================================================//
}
