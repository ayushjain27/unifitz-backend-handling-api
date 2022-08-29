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

  addVehicleInfo = async (req: Request, res: Response) => {
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

  validate = (method: string) => {
    switch (method) {
      case 'addVehicle':
        return [body('userId', 'User Id does not exist').exists().isString()];

      case 'getVehicle':
        return [
          body('userId', 'User Id does not exist').exists().isString(),
          body('purpose', 'type does not exist').exists().isString()
        ];
    }
  };
}
