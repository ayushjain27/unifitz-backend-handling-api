import { Router } from 'express';
import multer from 'multer';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../../routes/middleware/rbac';
import { ACL } from '../../enum/rbac.enum';
import { EventController, SPEmployeeController } from '../../controllers';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const spEmployeeController = container.get<SPEmployeeController>(
  TYPES.SPEmployeeController
);

router.post(
  '/',
  roleAuth(ACL.STORE_CREATE),
  // spEmployeeController.validate('createEmployee'),
  spEmployeeController.createEmployee
);

router.post(
  '/uploadEmployeeImage',
  uploadFile.single('file'),
  spEmployeeController.uploadEmployeeImage
);

router.get(
  '/allEmployeesByUserName',
  // roleAuth(ACL.STORE_GET_ALL),
  spEmployeeController.getAllEmployeesByUserName
);

router.get(
  '/',
  // roleAuth(ACL.STORE_GET_SINGLE),
  spEmployeeController.getEmployeeByEmployeeId
);

router.put('/', spEmployeeController.updateEmployee);

router.delete(
  '/',
  spEmployeeController.deleteEmployee
);

export default router;
