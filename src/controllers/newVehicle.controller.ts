/* eslint-disable no-console */
import { INewVehicle } from '../models/NewVehicle';
import { Response } from 'express';
import Request from '../types/request';
import { body, validationResult, query } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
// import { VehicleInfoService } from '../services/vehicle.service';
import { NewVehicleInfoService } from '../services/newVehicle.service';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';

@injectable()
export class NewVehicleInfoController {
  private vehicleInfoService: NewVehicleInfoService;
  constructor(
    @inject(TYPES.NewVehicleInfoService)
    vehicleInfoService: NewVehicleInfoService
  ) {
    this.vehicleInfoService = vehicleInfoService;
  }

  create = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const addVehicleInfoRequest: INewVehicle = req.body;
    const userName = req?.userId;
    const role = req?.role;
    Logger.info(
      '<Controller>:<NewVehicleController>:<Add vehicle info request initiated>'
    );
    try {
      const result = await this.vehicleInfoService.create(
        addVehicleInfoRequest,
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

  // uploadVehicleImages = async (req: Request, res: Response) => {
  //   const { vehicleID } = req.body;
  //   Logger.info(
  //     '<Controller>:<VehicleInfoController>:<Upload Vehicle request initiated>'
  //   );
  //   try {
  //     const result = await this.vehicleInfoService.updateVehicleImages(
  //       vehicleID,
  //       req
  //     );
  //     res.send({
  //       result
  //     });
  //   } catch (err) {
  //     Logger.error(err.message);
  //     res
  //       .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
  //       .json({ message: err.message });
  //   }
  // };

  uploadNewVehicleImages = async (req: Request, res: Response) => {
    const { vehicleID } = req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Upload Vehicle request initiated>'
    );
    try {
      const result = await this.vehicleInfoService.uploadNewVehicleImages(
        vehicleID,
        req
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

  updateVehicleVideos = async (req: Request, res: Response) => {
    const { vehicleID } = req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Upload Vehicle request initiated>'
    );
    try {
      const result = await this.vehicleInfoService.updateVehicleVideos(
        vehicleID,
        req
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

  getAllVehicle = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const userName = req?.userId;
    const role = req?.role;
    const {
      oemId,
      oemUserId,
      vehicleType,
      storeId,
      adminFilterOemId,
      brandName,
      firstDate,
      lastDate
    } = req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Get All vehicle request initiated>'
    );
    try {
      const result = await this.vehicleInfoService.getAllVehicle(
        oemUserId,
        userName,
        role,
        oemId,
        vehicleType,
        storeId,
        adminFilterOemId,
        brandName,
        firstDate,
        lastDate
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllVehiclePaginated = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }

    Logger.info(
      '<Controller>:<VehicleController>:<Vehicle controller initiated>'
    );
    const pageNo = Number(req.query.pageNo);
    const pageSize = Number(req.query.pageSize || 10);
    const userName = req?.userId;
    const role = req?.role;
    const oemId = req.query.oemId;
    const vehicle = req?.query?.vehicleType;
    const brand: any = req?.query?.brandName;
    const storeId = req?.query?.storeId;
    const adminFilterOemId = req?.query?.adminFilterOemId;
    const searchQuery = req.query.searchQuery;
    const firstDate = req.query.firstDate;
    const lastDate = req.query.lastDate;

    try {
      const result = await this.vehicleInfoService.getAllVehiclePaginated(
        userName,
        role,
        oemId as string,
        pageNo,
        pageSize,
        vehicle as string,
        brand,
        storeId as string,
        adminFilterOemId as string,
        searchQuery as string,
        firstDate as string,
        lastDate as string
      );
      res.send({
        message: 'New Vehicles Fetched Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getVehiclePaginated = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }

    Logger.info(
      '<Controller>:<VehicleController>:<Vehicle controller initiated>'
    );
    const pageNo = Number(req.query.pageNo);
    const pageSize = Number(req.query.pageSize || 10);
    const userName = req?.userId;
    const role = req?.role;
    const oemId = req.query.oemId;
    const vehicle = req?.query?.vehicleType;
    const brand = req?.query?.brand;

    try {
      const result = await this.vehicleInfoService.getVehiclePaginated(
        userName,
        role,
        oemId as string,
        pageNo,
        pageSize,
        vehicle as string,
        brand as string
      );
      res.send({
        message: 'New Vehicles Fetched Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getById = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<VehicleController>:<Getting ID>');
    try {
      const vehicleID = req.query.vehicleId;
      const result = await this.vehicleInfoService.getById(vehicleID as string);
      Logger.info('<Controller>:<VehicleController>:<get successfully>');
      res.send({
        message: 'Vehicle obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  update = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<VehicleController>:<Update Vehicle Status>');
    // Validate the request body
    const vehicleId = req.params.vehicleId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    try {
      const result = await this.vehicleInfoService.update(req.body, vehicleId);
      res.send({
        message: 'Vehicle updated successfully'
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  delete = async (req: Request, res: Response) => {
    const vehicleId = req.params.vehicleId;
    const userName = req?.userId;
    const role = req?.role;
    Logger.info(
      '<Controller>:<VehicleController>:<Delete vehicle by vehicleId request controller initiated>'
    );
    try {
      let result;
      if (!vehicleId) {
        throw new Error('vehicleId required');
      } else {
        result = await this.vehicleInfoService.delete(
          vehicleId as string,
          userName,
          role
        );
      }
      res.send({
        message: 'Vehicle deleted successfully'
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  createTestDrive = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const interestRequest = req.body;
    Logger.info(
      '<Controller>:<VehicleController>:<Add vehicle request initiated>'
    );
    try {
      const result = await this.vehicleInfoService.createTestDrive(
        interestRequest
      );
      res.send({
        message: 'Vehicle Test Drive applied successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  checkAvailabilityUserTestDrive = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const interestRequest = req.body;
    Logger.info(
      '<Controller>:<VehicleController>:<Add vehicle request initiated>'
    );
    try {
      const result =
        await this.vehicleInfoService.checkAvailabilityUserTestDrive(
          interestRequest
        );
      res.send({
        message: 'Vehicle Test Drive checked successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllTestDrive = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const userName = req?.userId;
    const role = req?.role;
    const oemId = req.query?.oemId;
    const storeId = req.query?.storeId;
    const enquiryStatus = req.query?.enquiryStatus;
    const oemUser = req.query?.oemUserName;
    const searchValue = req.query?.searchValue;
    const followUpdate = req.query?.followUpdate;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Get All vehicle request initiated>'
    );
    try {
      const result = await this.vehicleInfoService.getAllTestDrive(
        userName,
        role,
        oemId as string,
        storeId as string,
        enquiryStatus as string,
        searchValue as string,
        followUpdate as unknown as Date,
        oemUser as string
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllTestDrivePaginated = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    }
    const userName = req?.userId;
    const role = req?.role;
    const oemId = req.query?.oemId;
    const storeId = req.query?.storeId;
    const enquiryStatus = req.query?.enquiryStatus;
    const oemUser = req.query?.oemUserName;
    const searchValue = req.query?.searchValue;
    const followUpdate = req.query?.followUpdate;
    const pageNo = Number(req.query.pageNo);
    const pageSize = Number(req.query.pageSize || 10);
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Get All vehicle request initiated>'
    );
    try {
      const result = await this.vehicleInfoService.getAllTestDrivePaginated(
        userName,
        role,
        oemId as string,
        storeId as string,
        enquiryStatus as string,
        searchValue as string,
        followUpdate as unknown as Date,
        oemUser as string,
        pageNo,
        pageSize
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllTestDriveCount = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    }
    const userName = req?.userId;
    const role = req?.role;
    const oemId = req.query?.oemId;
    const storeId = req.query?.storeId;
    const enquiryStatus = req.query?.enquiryStatus;
    const oemUser = req.query?.oemUserName;
    const searchValue = req.query?.searchValue;
    const followUpdate = req.query?.followUpdate;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Get All vehicle request initiated>'
    );
    try {
      const result = await this.vehicleInfoService.getAllTestDriveCount(
        userName,
        role,
        oemId as string,
        storeId as string,
        enquiryStatus as string,
        searchValue as string,
        followUpdate as unknown as Date,
        oemUser as string
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateNotificationStatus = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<VehicleController>:<Update Vehicle Status>');
    // Validate the request body
    const vehicleId = req.params.vehicleId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    try {
      const result = await this.vehicleInfoService.updateNotificationStatus(
        req.body,
        vehicleId
      );
      res.send({
        message: 'Vehicle updated successfully'
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getTestDriveDetailsById = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<VehicleController>:<Getting ID>');
    try {
      const id = req.query.id;
      const result = await this.vehicleInfoService.getTestDriveDetailsById(
        id as string
      );
      Logger.info('<Controller>:<VehicleController>:<get successfully>');
      res.send({
        message: 'Enquiry obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getVehicleList = async (req: Request, res: Response) => {
    try {
      Logger.info(
        '<Controller>:<VehicleController>:<Get All aggregation request controller initiated>'
      );
      const result = await this.vehicleInfoService.getVehicleList(
        req.body
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
}
