import { Router } from 'express';
import multer from 'multer';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../middleware/rbac';
import { ACL } from '../../enum/rbac.enum';
import { DeliveryPartnerController } from '../../controllers';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const deliveryPartnerController = container.get<DeliveryPartnerController>(
  TYPES.DeliveryPartnerController
);

router.post(
  '/',
  roleAuth(ACL.STORE_CREATE),
  // spEmployeeController.validate('createEmployee'),
  deliveryPartnerController.createDeliverPartner
);

router.post(
  '/uploadDeliveryPartnerImage',
  uploadFile.single('file'),
  deliveryPartnerController.uploadDeliveryPartnerImage
);

// router.get(
//   '/allEmployeesByUserName',
//   // roleAuth(ACL.STORE_GET_ALL),
//   spEmployeeController.getAllEmployeesByUserName
// );

// router.get(
//   '/',
//   // roleAuth(ACL.STORE_GET_SINGLE),
//   spEmployeeController.getEmployeeByEmployeeId
// );

// router.put('/', spEmployeeController.updateEmployee);

// router.delete('/', spEmployeeController.deleteEmployee);

// router.get('/resetPassword', spEmployeeController.resetPassword);

// router.put('/updatePermission', spEmployeeController.updatePermission);
// router.put('/updateUserPermission', spEmployeeController.updateUserPermission);

export default router;
