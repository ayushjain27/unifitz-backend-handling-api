import { Response } from 'express';
import Request from '../types/request';
import { body, validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { BuySellService } from './../services/buySell.services';

@injectable()
export class BuySellController {
  private buySellService: BuySellService;

  constructor(
    @inject(TYPES.BuySellService)
    buySellService: BuySellService
  ) {
    this.buySellService = buySellService;
  }

  addSellVehicle = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    // const buySellRequest = req.body;
    Logger.info(
      '<Controller>:<BuySellController>:<Create Buy/Sell vehicle controller initiated>'
    );
    try {
      const result = await this.buySellService.addSellVehicle(req.body);
      res.send({
        message: 'Buy/Sell Vehicle Creation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllSellVehicleByUser = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    const getVehicleRequest: { userId: string } = req.body;
    Logger.info(
      '<Controller>:<BuySellController>:<Get All vehicle by user request initiated>'
    );
    try {
      const result = await this.buySellService.getAllSellVehicleByUser(
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

  updateSellVehicle = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    // const addVehicleInfoRequest: IVehiclesInfo = req.body;
    Logger.info(
      '<Controller>:<BuySellController>:<Update sell vehicle info request initiated>'
    );
    try {
      const result = await this.buySellService.updateSellVehicle(req.body);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getBuyVehicle = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }

    Logger.info(
      '<Controller>:<BuySellController>:<Product getting Buy Vehicle controller initiated>'
    );
    // const userId: string = req.query.userId as string;
    const { pageNo, pageSize, status, userType } = req.body;

    try {
      const result = await this.buySellService.getBuyVehicle(
        // productId,
        pageNo,
        pageSize,
        status,
        userType
      );
      res.send({
        message: 'Buy Vehicle Fetched Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  validate = (method: string) => {
    switch (method) {
      case 'addorGetSellVehicle':
        return [body('userId', 'User Id does not exist').exists().isString()];
    }
  };
}
