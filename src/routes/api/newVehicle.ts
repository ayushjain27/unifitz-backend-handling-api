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

router.post(
  '/uploadVehicleImages',
  uploadFiles.array('files'),
  newVehicleController.uploadVehicleImages
);

router.post(
  '/getAll',
  roleAuth(ACL.STORE_GET_ALL),
  newVehicleController.getAllVehicle
);

router.get('/getById', newVehicleController.getById);
router.put('/update/:vehicleId', newVehicleController.update);
router.delete('/:vehicleId', newVehicleController.delete);

export default router;
