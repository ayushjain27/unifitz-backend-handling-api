/* eslint-disable no-console */
import { IVehiclesInfo } from '../models/Vehicle';
import { Response } from 'express';
import Request from '../types/request';
import { body, validationResult, query } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { VehicleInfoService } from '../services/vehicle.service';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { IParkAssistVehicle } from '../models/ParkAssistVehicles';
import { IEmergencyContactDetails } from '../models/EmergencyContactDetails';

@injectable()
export class VehicleInfoController {
  private vehicleInfoService: VehicleInfoService;
  constructor(
    @inject(TYPES.VehicleInfoService)
    vehicleInfoService: VehicleInfoService
  ) {
    this.vehicleInfoService = vehicleInfoService;
  }

  addVehicle = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const addVehicleInfoRequest: IVehiclesInfo = req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Add vehicle info request initiated>'
    );
    try {
      const result = await this.vehicleInfoService.addVehicle(
        addVehicleInfoRequest
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllVehicleByUser = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const { userId } = req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Get All vehicle by user request initiated>'
    );
    try {
      const result = await this.vehicleInfoService.getAllVehicleByUser(userId);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  uploadVehicleImages = async (req: Request, res: Response) => {
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const { vehicleId } = req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Upload Vehicle request initiated>'
    );
    try {
      const result = await this.vehicleInfoService.updateVehicleImages(
        vehicleId,
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

  deleteVehicleImage = async (req: Request, res: Response) => {
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Update or Delete Vehicle Image Vehicle request initiated>'
    );
    try {
      const result = await this.vehicleInfoService.deleteVehicleImage(
        req.body,
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

  vehicleDetailsFromRC = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Vehicle controller initiated>'
    );
    try {
      const result = await this.vehicleInfoService.vehicleDetailsFromRC(
        req.body
      );
      res.send({
        message: 'Vehicle get information Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateVehicle = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const vehicleId = req.params.vehicleId;
    if (!vehicleId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Vehicle Id is not present' } });
      return;
    }
    const vehRequest = req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Update vehicle controller initiated>'
    );

    try {
      const result = await this.vehicleInfoService.update(
        vehRequest,
        vehicleId
      );
      res.send({
        message: 'Vehicle Update Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getVehicleByVehicleId = async (req: Request, res: Response) => {
    const vehicleId = req.params.vehicleId;

    if (!vehicleId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Vehicle Id is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Get vehicles by vehicle id controller initiated>'
    );
    try {
      const result =
        await this.vehicleInfoService.getVehicleByVehicleId(vehicleId);
      res.send({
        message: 'Vehicle Fetch Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAll = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Get all vehicles request controller initiated>'
    );
    const userName = req?.userId;
    const role = req?.role;
    try {
      const result = await this.vehicleInfoService.getAll(
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

  getAllCount = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Get all vehicles request controller initiated>'
    );
    const userName = req?.userId;
    const role = req?.role;
    try {
      const result = await this.vehicleInfoService.getAllCount(
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
    const searchQuery = req?.query?.searchQuery;

    try {
      const result = await this.vehicleInfoService.getVehiclePaginated(
        userName,
        role,
        oemId as string,
        pageNo,
        pageSize,
        searchQuery as string
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

  getAllOwnedVehicles = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }

    Logger.info(
      '<Controller>:<VehicleController>:<Vehicle controller initiated>'
    );
    const vehicleNumber = req.query.vehicleNumber;

    try {
      const result = await this.vehicleInfoService.getAllOwnedVehicles(
        vehicleNumber as string
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

  createParkAssistVehicle = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const addVehicleInfoRequest: IParkAssistVehicle = req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Add vehicle info request initiated>'
    );
    try {
      const result = await this.vehicleInfoService.createParkAssistVehicle(
        addVehicleInfoRequest
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  uploadParkAssistVehicleImages = async (req: Request, res: Response) => {
    Logger.info('<Service>:<VehicleService>:<Upload Vehicle Images initiated>');
    const { vehicleId } = req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Upload Vehicle request initiated>'
    );
    try {
      const result =
        await this.vehicleInfoService.uploadParkAssistVehicleImages(
          vehicleId,
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

  updateParkAssistVehicle = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const vehicleId = req.params.vehicleId;
    if (!vehicleId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Vehicle Id is not present' } });
      return;
    }
    const vehRequest = req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Update vehicle controller initiated>'
    );

    try {
      const result = await this.vehicleInfoService.updateParkAssistVehicle(
        vehRequest,
        vehicleId
      );
      res.send({
        message: 'Vehicle Update Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getParkAssistVehicleByVehicleId = async (req: Request, res: Response) => {
    const vehicleId = req.params.vehicleId;

    if (!vehicleId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Vehicle Id is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Get vehicles by vehicle id controller initiated>'
    );
    try {
      const result =
        await this.vehicleInfoService.getParkAssistVehicleByVehicleId(
          vehicleId
        );
      res.send({
        message: 'Vehicle Fetch Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllParkAsistVehiclesById = async (req: Request, res: Response) => {
    const userId = req.query.userId;
    const platform = req.query.platform;

    Logger.info(
      '<Controller>:<VehicleInfoController>:<Get vehicles by vehicle id controller initiated>'
    );
    try {
      const result = await this.vehicleInfoService.getAllParkAsistVehiclesById(
        userId as string,
        platform as string
      );
      res.send({
        message: 'Vehicle Fetch Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  deleteParkAssistVehicle = async (req: Request, res: Response) => {
    const vehicleId = req.params.vehicleId;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Delete vehicle by vehicleId request controller initiated>'
    );
    try {
      const result = await this.vehicleInfoService.deleteParkAssistVehicle(
        vehicleId as string
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  createEmergencyContactDetails = async (req: Request, res: Response) => {
    const request: IEmergencyContactDetails = req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Create users emergency contact Details request controller initiated>'
    );
    try {
      const result =
        await this.vehicleInfoService.createEmergencyContactDetails(request);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  deleteEmergencyContactDetail = async (req: Request, res: Response) => {
    const emergencyContactDetailId = req.params.emergencyContactDetailId;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Delete users emergency contact Details request controller initiated>'
    );
    try {
      const result = await this.vehicleInfoService.deleteEmergencyContactDetail(
        emergencyContactDetailId
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllEmergencyDetailsByUserId = async (req: Request, res: Response) => {
    const userId = req.query.userId;
    const platform = req.query.platform;

    Logger.info(
      '<Controller>:<VehicleInfoController>:<Get vehicles by vehicle id controller initiated>'
    );
    try {
      const result =
        await this.vehicleInfoService.getAllEmergencyDetailsByUserId(
          userId as string,
          platform as string
        );
      res.send({
        message: 'Vehicle Fetch Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getTotalVehiclesCount = async (req: Request, res: Response) => {
    const platform = req?.query?.platform;
    const state = req?.query?.state;
    const city = req?.query?.city;
    const searchText = req?.query?.searchText;

    Logger.info(
      '<Controller>:<VehicleInfoController>:<Count Total Vehices Initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<VehicleInfoController>:<Count Total Vehicles request controller initiated>'
      );
      const result = await this.vehicleInfoService.getTotalVehiclesCount(
        platform as string,
        state as string,
        city as string,
        searchText as string
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

  getAllParkAssistVehiclePaginated = async (req: Request, res: Response) => {
    const { status, pageNo, pageSize, platform, state, city, searchText } =
      req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Search and Filter park assist pagination request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<StoreController>:<Search and Filter Stores pagination request controller initiated>'
      );
      const result =
        await this.vehicleInfoService.getAllParkAssistVehiclePaginated(
          status,
          pageNo,
          pageSize,
          platform,
          state,
          city,
          searchText
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

  getParkAssistVehicleDetailsByVehilceNumber = async (
    req: Request,
    res: Response
  ) => {
    const vehicleNumber = req?.query?.vehicleNumber;
    // const employeeId = req?.query?.employeeId;

    Logger.info(
      '<Controller>:<VehicleInfoController>:<Get vehicle Details by vehicle number Initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<VehicleInfoController>:<Get vehicle Details By Vehicle Number request controller initiated>'
      );
      const result =
        await this.vehicleInfoService.getParkAssistVehicleDetailsByVehilceNumber(
          vehicleNumber as string
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

  updateParkAssistVehicleStatus = async (req: Request, res: Response) => {
    const vehicleId = req?.body?.vehicleId;
    const status = req?.body?.status;
    // const employeeId = req?.query?.employeeId;

    Logger.info(
      '<Controller>:<VehicleInfoController>:<Update vehicle Status by vehicle Id Initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<VehicleInfoController>:<Update vehicle Status By Vehicle Id request controller initiated>'
      );
      const result =
        await this.vehicleInfoService.updateParkAssistVehicleStatus(
          vehicleId as string,
          status as string
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

  getTotalEmergencyContactsCount = async (req: Request, res: Response) => {
    const platform = req?.query?.platform;
    const state = req?.query?.state;
    const city = req?.query?.city;
    const serachText = req?.query?.searchText;

    Logger.info(
      '<Controller>:<VehicleInfoController>:<Count Total Emergency Contacts Initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<VehicleInfoController>:<Count Total Emergency Contacts request controller initiated>'
      );
      const result =
        await this.vehicleInfoService.getTotalEmergencyContactsCount(
          platform as string,
          state as string,
          city as string,
          serachText as string
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

  getAllParkAssistEmergencyContactsPaginated = async (
    req: Request,
    res: Response
  ) => {
    const { status, pageNo, pageSize, platform, state, city, searchText } = req.body;
      Logger.info(
        '<Controller>:<VehicleInfoController>:<Search and Filter park assist pagination request controller initiated>'
      );
    try {
      Logger.info(
        '<Controller>:<StoreController>:<Search and Filter Stores pagination request controller initiated>'
      );
      const result =
        await this.vehicleInfoService.getAllParkAssistEmergencyContactsPaginated(
          status,
          pageNo,
          pageSize,
          platform,
          state,
          city,
          searchText
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

  getVehicleAndEmergencyDetailsByVehicleNumber = async (
    req: Request,
    res: Response
  ) => {
    const { vehicleNumber } = req.query;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Get all vehicle and emergency contact details request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<StoreController>:<Get all vehicle and emergency contact details request controller initiated>'
      );
      const result =
        await this.vehicleInfoService.getVehicleAndEmergencyDetailsByVehicleNumber(
          vehicleNumber as string
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

  getVehicleDetailsFromRc = async (
    req: Request,
    res: Response
  ) => {
    const { vehicleNumber } = req.query;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Get all vehicle and emergency contact details request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<StoreController>:<Get all vehicle and emergency contact details request controller initiated>'
      );
      const result =
        await this.vehicleInfoService.getVehicleDetailsFromRc(
          vehicleNumber as string
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

  updateRcDetails = async (
    req: Request,
    res: Response
  ) => {
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Update rc Details request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<StoreController>:<Update rc Details request controller initiated>'
      );
      const result =
        await this.vehicleInfoService.updateRcDetails(
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

  validate = (method: string) => {
    switch (method) {
      case 'addVehicle':
        return [
          body('userId', 'User Id does not exist').exists().isString(),
          body('vehicleNumber', 'User Id does not exist').exists().isString(),
          body('kmsDriven', 'User Id does not exist').exists().isString(),
          body('manufactureYear', 'User Id does not exist').exists().isString(),
          body('modelName', 'User Id does not exist').exists().isString(),
          body('brand', 'User Id does not exist').exists().isString(),
          body('gearType', 'User Id does not exist').exists().isString(),
          body('fuelType', 'User Id does not exist').exists().isString()
        ];

      case 'getVehicle':
        return [
          body('userId', 'User Id does not exist').exists().isString()
          // body('purpose', 'type does not exist').exists().isString()
        ];

      case 'uploadImages':
        return [
          body('vehicleId', 'VehicleId does not exist').exists().isString()
        ];

      case 'deleteVehicleImage':
        return [
          body('vehicleId', 'VehicleId does not exist').exists().isString(),
          body('vehicleImageKey', 'Old Vehicle key does not exist')
            .exists()
            .isString()
        ];

      case 'vehicleDetailsFromRC':
        return [
          body('vehicleNumber', 'VehicleNumber does not exist')
            .exists()
            .isString()
        ];
    }
  };
}
