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
  '/addVehicle',
  roleAuth(ACL.ADD_VEHICLE),
  vehicleInfoController.validate('addVehicle'),
  vehicleInfoController.addVehicle
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

router.put(
  '/:vehicleId',
  roleAuth(ACL.ADD_VEHICLE),
  vehicleInfoController.validate('addVehicle'),
  vehicleInfoController.updateVehicle
);

router.post(
  '/vehicleDetailsFromRC',
  roleAuth(ACL.ADD_VEHICLE),
  vehicleInfoController.validate('vehicleDetailsFromRC'),
  vehicleInfoController.vehicleDetailsFromRC
);

router.post('/all', roleAuth(ACL.ADD_VEHICLE), vehicleInfoController.getAll);

router.get(
  '/paginated',
  roleAuth(ACL.ADD_VEHICLE),
  vehicleInfoController.getVehiclePaginated
);

router.post(
  '/count',
  roleAuth(ACL.ADD_VEHICLE),
  vehicleInfoController.getAllCount
);

router.get(
  '/getAllOwnedVehicles',
  roleAuth(ACL.GET_VEHICLE),
  vehicleInfoController.getAllOwnedVehicles
)

router.post(
  '/createParkAssistVehicle',
  vehicleInfoController.createParkAssistVehicle
)

router.post(
  '/uploadParkAssistVehicleImages',
  uploadFiles.array('files'),
  vehicleInfoController.uploadParkAssistVehicleImages
);

router.put(
  '/parkAssistVehicle/:vehicleId',
  vehicleInfoController.updateParkAssistVehicle
);

router.get(
  '/parkAssistVehicle/vehicle-detail/:vehicleId',
  // roleAuth(ACL.STORE_GET_ALL),
  vehicleInfoController.getParkAssistVehicleByVehicleId
);

router.get(
  '/parkAssistVehicle/getAllVehiclesByUserId',
  // roleAuth(ACL.STORE_GET_ALL),
  vehicleInfoController.getAllParkAsistVehiclesById
);

router.delete(
  '/parkAsistVehicle/:vehicleId',
  // roleAuth(ACL.STORE_GET_ALL),
  vehicleInfoController.deleteParkAssistVehicle
);

export default router;
