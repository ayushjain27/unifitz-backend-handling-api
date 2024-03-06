import { Router } from 'express';
import multer from 'multer';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../../routes/middleware/rbac';
import { ACL } from '../../enum/rbac.enum';
import { StoreCustomerController } from '../../controllers';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const storeCustomerController = container.get<StoreCustomerController>(
  TYPES.StoreCustomerController
);

router.post(
  '/',
  roleAuth(ACL.STORE_CREATE),
  storeCustomerController.validate('createStoreCustomer'),
  storeCustomerController.createStoreCustomer
);

// router.post(
//   '/uploadVehicleImages',
//   uploadFile.array('files'),
//   roleAuth(ACL.STORE_CREATE),
//   storeCustomerController.uploadStoreCustomerVehicleImages
// );

router.get(
  '/storeCustomerDetails/:storeId',
  roleAuth(ACL.STORE_CREATE),
  storeCustomerController.getStoreCustomersByStoreId
);

router.get(
  '/storeCustomerDetailByPhoneNumber',
  roleAuth(ACL.STORE_CREATE),
  storeCustomerController.getStoreCustomerByPhoneNumber
);

router.post(
  '/createStoreCustomerVehicle',
  roleAuth(ACL.STORE_CREATE),
  storeCustomerController.createStoreCustomerVehicle
);

// router.get(
//   '/employeeDetail/:employeeId',
//   roleAuth(ACL.STORE_CREATE),
//   employeeController.getEmployeesByEmployeeId
// );

export default router;
