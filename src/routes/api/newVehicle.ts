import { Router } from 'express';
import multer from 'multer';

import { roleAuth } from '../middleware/rbac';
import { TYPES } from '../../config/inversify.types';
import { ACL } from '../../enum/rbac.enum';
import container from '../../config/inversify.container';
import { NewVehicleInfoController } from '../../controllers/newVehicle.controller';

const storage = multer.memoryStorage();
const uploadFiles = multer({ storage: storage });

const router: Router = Router();
const newVehicleController = container.get<NewVehicleInfoController>(
  TYPES.NewVehicleInfoContoller
);

router.post(
  '/create',
  roleAuth(ACL.STORE_GET_ALL),
  newVehicleController.create
);

// router.post(
//   '/uploadVehicleImages',
//   uploadFiles.array('files'),
//   newVehicleController.uploadVehicleImages
// );

router.post(
  '/uploadNewVehicleImages',
  uploadFiles.array('files'),
  newVehicleController.uploadNewVehicleImages
);

router.post(
  '/uploadVehicleVideos',
  uploadFiles.array('files'),
  newVehicleController.updateVehicleVideos
);

router.post(
  '/getAll',
  roleAuth(ACL.STORE_GET_ALL),
  newVehicleController.getAllVehicle
);

router.get(
  '/paginated',
  roleAuth(ACL.STORE_GET_ALL),
  newVehicleController.getVehiclePaginated
);

router.get('/getById', newVehicleController.getById);
router.put('/update/:vehicleId', newVehicleController.update);
router.delete('/:vehicleId', newVehicleController.delete);
router.post('/createTestDrive', newVehicleController.createTestDrive);
router.post(
  '/checkAvailabilityUserTestDrive',
  newVehicleController.checkAvailabilityUserTestDrive
);
router.get(
  '/getAllTestDrive',
  roleAuth(ACL.STORE_GET_ALL),
  newVehicleController.getAllTestDrive
);

router.put(
  '/updateNotificationStatus/:vehicleId',
  roleAuth(ACL.STORE_GET_ALL),
  newVehicleController.updateNotificationStatus
);

router.get('/getTestDriveDetailsById', newVehicleController.getTestDriveDetailsById);

export default router;
