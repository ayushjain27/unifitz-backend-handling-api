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
  roleAuth(ACL.CUSTOMER_CREATE),
  buySellController.validate('addorGetSellVehicle'),
  buySellController.addSellVehicle
);

router.post(
  '/getAllSellVehicleByUser',
  roleAuth(ACL.CUSTOMER_CREATE),
  buySellController.validate('addorGetSellVehicle'),
  buySellController.getAllSellVehicleByUser
);

router.post(
  '/updateSellVehicle',
  roleAuth(ACL.CUSTOMER_CREATE),
  buySellController.updateSellVehicle
);

export default router;
