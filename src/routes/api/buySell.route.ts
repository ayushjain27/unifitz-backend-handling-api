import { Router } from 'express';
import multer from 'multer';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../middleware/rbac';
import { ACL } from '../../enum/rbac.enum';
import { BuySellController } from './../../controllers/buySell.controller';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const buySellController = container.get<BuySellController>(
  TYPES.BuySellController
);

router.post(
  '/addToSellVehicle',
  roleAuth(ACL.ADD_VEHICLE),
  buySellController.validate('addorGetSellVehicle'),
  buySellController.addSellVehicle
);

router.post(
  '/getAllSellVehicleByUser',
  roleAuth(ACL.ADD_VEHICLE),
  // buySellController.validate('addorGetSellVehicle'),
  buySellController.getAllSellVehicleByUser
);

router.post(
  '/getBuySellVehicleById',
  roleAuth(ACL.ADD_VEHICLE),
  // buySellController.validate('addorGetSellVehicle'),
  buySellController.getBuyVehicleById
);

router.post(
  '/updateSellVehicle',
  roleAuth(ACL.ADD_VEHICLE),
  buySellController.updateSellVehicle
);

router.post(
  '/getAllBuyVehicle',
  roleAuth(ACL.ADD_VEHICLE),
  buySellController.getAllBuyVehicle
);

router.post('/getBuyVehicle', buySellController.getBuyVehicle);
router.post(
  '/vehicleExistanceCheckApi',
  buySellController.checkVehicleExistance
);
router.get('/getBuySellAggregation', buySellController.getOwnStoreDetails);
router.post(
  '/addBuySellVehicleImageList',
  uploadFile.array('files'),
  buySellController.addBuySellVehicleImageList
);

router.post('/updateStatus', buySellController.updateBuySellVehicleStatus);

router.post('/all', roleAuth(ACL.ADD_VEHICLE), buySellController.getAll);

router.get(
  '/getBuySellDetailsByVehicleId',
  roleAuth(ACL.ADD_VEHICLE),
  buySellController.getBuySellDetailsByVehicleId
);

export default router;
