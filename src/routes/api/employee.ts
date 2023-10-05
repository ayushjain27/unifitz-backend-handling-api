import { Router } from 'express';
import multer from 'multer';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../../routes/middleware/rbac';
import { ACL } from '../../enum/rbac.enum';
import { EmployeeController } from '../../controllers';

const storage = multer.memoryStorage();
const uploadFiles = multer({ storage: storage });

const router: Router = Router();
const employeeController = container.get<EmployeeController>(
  TYPES.EmployeeController
);

router.post(
  '/',
  roleAuth(ACL.STORE_CREATE),
  employeeController.validate('createEmployee'),
  employeeController.createEmployee
);

router.get(
  '/:storeId',
  // roleAuth(ACL.STORE_GET_ALL)
  employeeController.getEmployeesByStoreId
);

export default router;
