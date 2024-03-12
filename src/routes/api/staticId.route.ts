import { Router } from 'express';
import multer from 'multer';

// import container from '../../config/inversify.container';
// import { TYPES } from '../../config/inversify.types';
// import { roleAuth } from '../../routes/middleware/rbac';
// import { ACL } from '../../enum/rbac.enum';
// import { EmployeeController } from '../../controllers';
import { StaticIdController } from '../../controllers';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../middleware/rbac';
import { ACL } from '../../enum/rbac.enum';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const staticIdController = container.get<StaticIdController>(
  TYPES.StaticIdController
);

router.post(
  '/',
  // roleAuth(ACL.STORE_CREATE),
  staticIdController.createStaticId
);

// router.post(
//   '/uploadEmployeeImage',
//   uploadFile.single('file'),
//   roleAuth(ACL.STORE_CREATE),
//   employeeController.uploadEmployeeImage
// );

// router.get(
//   '/:storeId',
//   roleAuth(ACL.STORE_CREATE),
//   employeeController.getEmployeesByStoreId
// );

// router.put(
//   '/:employeeId',
//   roleAuth(ACL.STORE_CREATE),
//   employeeController.validate('createEmployee'),
//   employeeController.update
// );

// router.get(
//   '/employeeDetail/:employeeId',
//   roleAuth(ACL.STORE_CREATE),
//   employeeController.getEmployeesByEmployeeId
// );

export default router;
