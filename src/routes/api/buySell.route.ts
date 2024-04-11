import { Router } from 'express';
import { ACL } from '../../enum/rbac.enum';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../middleware/rbac';
import { BuySellController } from './../../controllers/buySell.controller';

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

router.get(
  '/getAllBuyVehicle',
  roleAuth(ACL.ADD_VEHICLE),
  buySellController.getAllBuyVehicle
);

router.post('/getBuyVehicle', buySellController.getBuyVehicle);

router.get('/getBuySellAggregation', buySellController.getBuySellAggregation);
router.post(
  '/addBuySellVehicleImageList',
  buySellController.addBuySellVehicleImageList
);

export default router;
