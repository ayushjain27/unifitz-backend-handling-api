import { Router } from 'express';
import multer from 'multer';

import { roleAuth } from '../middleware/rbac';
import { TYPES } from '../../config/inversify.types';
import { ACL } from '../../enum/rbac.enum';
import container from '../../config/inversify.container';
import { VehicleInfoController } from '../../controllers/vehicleInfo.controller';

const storage = multer.memoryStorage();
const uploadFiles = multer({ storage: storage });

const router: Router = Router();
const vehicleInfoController = container.get<VehicleInfoController>(
  TYPES.VehicleInfoController
);

router.post(
  '/addOrUpdateVehicle',
  roleAuth(ACL.ADD_VEHICLE),
  vehicleInfoController.validate('addVehicle'),
  vehicleInfoController.addOrUpdateVehicle
);

router.post(
  '/getAllVehicleByUser',
  roleAuth(ACL.ADD_VEHICLE),
  vehicleInfoController.validate('getVehicle'),
  vehicleInfoController.getAllVehicleByUser
);

router.post(
  '/uploadVehicleImages',
  uploadFiles.array('files'),
  roleAuth(ACL.ADD_VEHICLE),
  vehicleInfoController.validate('uploadImages'),
  vehicleInfoController.uploadVehicleImages
);

router.post(
  '/deleteVehicleImage',
  uploadFiles.single('file'),
  roleAuth(ACL.ADD_VEHICLE),
  vehicleInfoController.validate('deleteVehicleImage'),
  vehicleInfoController.deleteVehicleImage
);

router.get(
  '/vehicle-detail/:vehicleId',
  // roleAuth(ACL.STORE_GET_ALL),
  vehicleInfoController.getVehicleByVehicleId
);

export default router;
