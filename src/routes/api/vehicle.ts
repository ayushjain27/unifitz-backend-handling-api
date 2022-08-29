import { Router } from 'express';
import { roleAuth } from '../middleware/rbac';
import { TYPES } from '../../config/inversify.types';
import { ACL } from '../../enum/rbac.enum';
import container from '../../config/inversify.container';
import { VehicleInfoController } from '../../controllers/vehicleInfo.controller';

const router: Router = Router();
const vehicleInfoController = container.get<VehicleInfoController>(
  TYPES.VehicleInfoController
);

router.post(
  '/addVehicle',
  roleAuth(ACL.ADD_VEHICLE),
  vehicleInfoController.validate('addVehicle'),
  vehicleInfoController.addVehicleInfo
);

router.post(
  '/getAllVehicleByUser',
  roleAuth(ACL.ADD_VEHICLE),
  vehicleInfoController.validate('getVehicle'),
  vehicleInfoController.getAllVehicleByUser
);

router.post('')

export default router;
