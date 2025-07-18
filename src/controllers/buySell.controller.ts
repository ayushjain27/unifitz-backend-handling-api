import { Response } from 'express';
import Request from '../types/request';
import { body, validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import { VehicleInfoService } from '../services/vehicle.service';

import Logger from '../config/winston';
import { BuySellService } from './../services/buySell.services';

@injectable()
export class BuySellController {
  private buySellService: BuySellService;
  private vehicleService: VehicleInfoService;

  constructor(
    @inject(TYPES.BuySellService)
    buySellService: BuySellService
  ) {
    this.buySellService = buySellService;
  }

  addSellVehicle = async (req: Request, res: Response) => {
    const errors = validationResult(req.body);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    // const buySellRequest = req.body;
    Logger.info(
      '<Controller>:<BuySellController>:<Create Buy/Sell vehicle controller initiated>'
    );
    try {
      const role = req?.role;
      const result = await this.buySellService.addSellVehicle(req.body, role);
      res.send({
        message: 'Buy/Sell Vehicle Creation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllBuyVehicle = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<BuySellController>:<Get All Buy Sell aggregation request controller initiated>'
    );
    try {
      // const { storeId: string } = req.body;
      const result = await this.buySellService.getAllBuyVehicles(req.body);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllBuyVehiclePaginated = async (req: Request, res: Response) => {
    try {
      Logger.info(
        '<Controller>:<BuySellController>:<Get All Buy Sell aggregation request controller initiated>'
      );
      const result = await this.buySellService.getAllBuyVehiclePaginated(
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

  addBuySellVehicleImageList = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<BuySellController>:<Upload Store Customer Vehicle request initiated>'
    );
    try {
      const vehicleId = req?.body?.vehicleId;
      const files = req?.files;
      const result = await this.vehicleService.updateVehicleImages(
        vehicleId,
        files
      );

      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  // getAllSellVehicleByUser = async (req: Request, res: Response) => {
  //   const errors = validationResult(req);
  //   if (!errors.isEmpty()) {
  //     return res
  //       .status(HttpStatusCodes.BAD_REQUEST)
  //       .json({ errors: errors.array() });
  //   }
  //   const getVehicleRequest: { userId: string } = req.body;
  //   Logger.info(
  //     '<Controller>:<BuySellController>:<Get All vehicle by user request initiated>'
  //   );
  //   try {
  //     const result = await this.buySellService.getAllSellVehicleByUser(
  //       getVehicleRequest
  //     );
  //     res.send({
  //       result
  //     });
  //   } catch (err) {
  //     Logger.error(err.message);
  //     res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
  //   }
  // };

  // getBuyVehicleById = async (req: Request, res: Response) => {
  //   const getVehicleRequest: { vehicleId: string } = req.body;
  //   Logger.info(
  //     '<Controller>:<BuySellController>:<Get Buy vehicle by Id request initiated>'
  //   );
  //   try {
  //     const result = await this.buySellService.getAllBuyVehicleById(
  //       getVehicleRequest
  //     );
  //     res.send({
  //       result
  //     });
  //   } catch (err) {
  //     Logger.error(err.message);
  //     res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
  //   }
  // };

  updateSellVehicle = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    // const addVehicleInfoRequest: IVehiclesInfo = req.body;
    Logger.info(
      '<Controller>:<BuySellController>:<Update sell vehicle info request initiated>'
    );
    try {
      const result = await this.buySellService.updateSellVehicle(req.body);
      res.send({
        message: 'Sell Vehicle Updated Successfully',
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
    const { pageNo, pageSize, status, userType, subCategory, brand } = req.body;

    try {
      const result = await this.buySellService.getBuyVehicle(
        // productId,
        pageNo,
        pageSize,
        status,
        userType,
        subCategory,
        brand
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

  getOwnStoreDetails = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<BuySellController>:<Get All Buy Sell aggregation request controller initiated>'
    );

    try {
      const result = await this.buySellService.getOwnStoreDetails(req.query);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  checkVehicleExistance = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<BuySellController>:<Check Sell vehicle existance initiated>'
    );
    try {
      const { vehicleNumber } = req.body;
      const result = await this.buySellService.checkVehicleExistance(
        vehicleNumber
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateBuySellVehicleStatus = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<BuySellController>:<Update Buy Sell Vehicle Status>'
    );

    try {
      const result = await this.buySellService.updateBuySellVehicleStatus(
        req.body
      );
      Logger.info(
        '<Controller>:<BuySellController>: <Store: Sending notification of updated buySell vehilce>'
      );
      res.send({
        message: 'BuySell vehicle Updation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getAll = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<BuySellController>:<Get all buy sell vehicles request controller initiated>'
    );
    const userName = req?.userId;
    const role = req?.role;
    try {
      const result = await this.buySellService.getAllBuySellVehilce(
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

  getBuySellData = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<BuySellController>:<Get all buy sell vehicles request controller initiated>'
    );
    const userName = req?.userId;
    const role = req?.role;
    try {
      const result = await this.buySellService.getBuySellData(
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

  getAllBuySellVehilceCount = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<BuySellController>:<Get all buy sell vehicles request controller initiated>'
    );
    const userName = req?.userId;
    const role = req?.role;
    try {
      const result = await this.buySellService.getAllBuySellVehilceCount(
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
  getPaginatedAll = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<BuySellController>:<Get all buy sell vehicles request controller initiated>'
    );
    const userName = req?.userId;
    const role = req?.role;
    try {
      const result = await this.buySellService.getPaginatedAll(
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

  getTotalBuySellCount = async (req: Request, res: Response) => {
    const userName = req?.userId;
    const role = req?.role;

    Logger.info(
      '<Controller>:<BuySellController>:<Get all buy sell vehicles request controller initiated>'
    );
    try {
      const result = await this.buySellService.getTotalBuySellCount(
        req.body,
        userName,
        role
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

  getBuySellDetailsByVehicleId = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<BuySellController>:<Get all buy sell vehicles request controller initiated>'
    );
    try {
      const vehicleId = req.query.vehicleId;
      const result = await this.buySellService.getBuySellDetailsByVehicleId(
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

  getBuySellDetailsById = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<BuySellController>:<Get all buy sell vehicles request controller initiated>'
    );
    try {
      const vehicleId = req.query.vehicleId;
      const result = await this.buySellService.getBuySellDetailsById(
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

  deleteVehicle = async (req: Request, res: Response) => {
    const vehicleId = req.params.vehicleId;
    Logger.info(
      '<Controller>:<BuySellController>:<Delete vehicle by vehicleID request controller initiated>'
    );
    try {
      const result = await this.buySellService.deleteVehicle(
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

  updateBuySellVehicleCustomerDetails = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<BuySellController>:<Update Buy Sell Vehicle Customer Details>'
    );

    try {
      const result =
        await this.buySellService.updateBuySellVehicleCustomerDetails(req.body);
      Logger.info(
        '<Controller>:<BuySellController>: <Store: Sending notification of updated buySell vehilce>'
      );
      res.send({
        message: 'BuySell vehicle Updation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  uploadPanAadharImage = async (req: Request, res: Response) => {
    const { customerDetailsId } = req.body;
    Logger.info(
      '<Controller>:<BuySellController>:<Upload Customer Details request initiated>'
    );
    try {
      const result = await this.buySellService.uploadPanAadharImage(
        customerDetailsId,
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

  getBuyVehicleList = async (req: Request, res: Response) => {
    try {
      Logger.info(
        '<Controller>:<BuySellController>:<Get All Buy Sell aggregation request controller initiated>'
      );
      const result = await this.buySellService.getBuyVehicleList(
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

  getVehiclesByStoreId = async (req: Request, res: Response) => {
    try {
      Logger.info(
        '<Controller>:<BuySellController>:<Get All Buy Sell aggregation request controller initiated>'
      );
      const storeId = req?.query?.storeId;
      const result = await this.buySellService.getVehiclesByStoreId(
       storeId
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

  getSimilarBuySellVehicle = async (req: Request, res: Response) => {
    try {
      Logger.info(
        '<Controller>:<BuySellController>:<Get All Buy Sell aggregation request controller initiated>'
      );
      const vehType = req?.body?.vehType;
      const coordinates = req?.body?.coordinates;
      const result = await this.buySellService.getSimilarBuySellVehicle(
        vehType,
       coordinates
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
      case 'addorGetSellVehicle':
        return [
          body('userId', 'User Id does not exist').exists().isString(),
          body('vehicleInfo.vehicleType', 'vehicleType does not exist')
            .exists()
            .isString(),
          body('vehicleInfo.vehicleNumber', 'vehicleNumber does not exist')
            .exists()
            .isString(),
          body('vehicleInfo.brand', 'brand does not exist').exists().isString(),
          body('vehicleInfo.modelName', 'modelName does not exist')
            .exists()
            .isString(),
          // body('vehicleInfo.manufactureYear', 'manufactureYear does not exist')
          //   .exists()
          //   .isString(),
          body('vehicleInfo.ownership', 'ownership does not exist')
            .exists()
            .isString(),
          body('vehicleInfo.gearType', 'gearType does not exist')
            .exists()
            .isString(),
          body('vehicleInfo.fuelType', 'fuelType does not exist')
            .exists()
            .isString(),
          body('vehicleInfo.kmsDriven', 'kmsDriven does not exist')
            .exists()
            .isString(),
          body('vehicleInfo.color', 'color does not exist').exists().isString(),
          body('vehicleInfo.bodyType', 'bodyType does not exist')
            .exists()
            .isString(),
          body(
            'vehicleInfo.fitnessCertificate',
            'fitnessCertificate does not exist'
          )
            .exists()
            .isBoolean(),
          body(
            'vehicleInfo.registrationType',
            'registrationType does not exist'
          )
            .exists()
            .isString(),
          body('vehicleInfo.expectedPrice', 'expectedPrice does not exist')
            .exists()
            .isNumeric(),
          body('vehicleInfo.noOfSeats', 'noOfSeats does not exist')
            .exists()
            .isNumeric(),
          body('isOwner', 'isOwner does not exist').exists().isBoolean(),
          body('isDealer', 'isDealer does not exist').exists().isBoolean(),
          body('isAuthorised', 'isAuthorised does not exist')
            .exists()
            .isBoolean()
        ];
    }
  };
}
