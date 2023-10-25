import { IVehiclesInfo } from '../models/Vehicle';
import { Response } from 'express';
import Request from '../types/request';
import { body, validationResult, query } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { VehicleInfoService } from '../services/vehicle.service';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';

@injectable()
export class VehicleInfoController {
  private vehicleInfoService: VehicleInfoService;
  constructor(
    @inject(TYPES.VehicleInfoService)
    vehicleInfoService: VehicleInfoService
  ) {
    this.vehicleInfoService = vehicleInfoService;
  }

  addOrUpdateVehicle = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    const addVehicleInfoRequest: IVehiclesInfo = req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Add vehicle info request initiated>'
    );
    try {
      const result = await this.vehicleInfoService.addOrUpdateVehicle(
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
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    const getVehicleRequest: { userId: string; purpose: string } = req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Get All vehicle by user request initiated>'
    );
    try {
      const result = await this.vehicleInfoService.getAllVehicleByUser(
        getVehicleRequest
      );
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
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    const { vehicleId } = req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Upload Vehicle request initiated>'
    );
    try {
      const result = await this.vehicleInfoService.uploadVehicleImages(
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

  updateOrDeleteVehicleImage = async (req: Request, res: Response) => {
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Update or Delete Vehicle Image Vehicle request initiated>'
    );
    try {
      const result = await this.vehicleInfoService.updateOrDeleteVehicleImage(
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

  validate = (method: string) => {
    switch (method) {
      case 'addVehicle':
        return [body('userId', 'User Id does not exist').exists().isString()];

      case 'getVehicle':
        return [
          body('userId', 'User Id does not exist').exists().isString(),
          body('purpose', 'type does not exist').exists().isString()
        ];

      case 'uploadImages':
        return [
          body('vehicleId', 'VehicleId does not exist').exists().isString()
        ];

      case 'updateOrDeleteVehicleImage':
        return [
          body('vehicleId', 'VehicleId does not exist').exists().isString(),
          body('vehicleImageKey', 'Old Vehicle key does not exist')
            .exists()
            .isString()
        ];
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
      const result = await this.vehicleInfoService.getVehicleByVehicleId(
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
}
