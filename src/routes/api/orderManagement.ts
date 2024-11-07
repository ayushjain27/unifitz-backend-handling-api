import { Router } from 'express';
import multer from 'multer';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../middleware/rbac';
import { ACL } from '../../enum/rbac.enum';
import { validationHandler } from '../middleware/auth';
import { OrderManagementController } from '../../controllers';

const storage = multer.memoryStorage();
const uploadFiles = multer({ storage: storage });

const router: Router = Router();
const orderManagementController = container.get<OrderManagementController>(
  TYPES.OrderManagementController
);

router.post(
  '/create-order',
  roleAuth(ACL.STORE_GET_ALL),
  orderManagementController.validate('createOrder'),
  validationHandler(),
  orderManagementController.createOrder
);

router.get(
  '/get-order/:orderId',
  roleAuth(ACL.STORE_GET_ALL),
  validationHandler(),
  orderManagementController.getOrderById
);

router.post(
  '/get-all-orders',
  roleAuth(ACL.STORE_GET_ALL),
  validationHandler(),
  orderManagementController.getUserAllOrdersPaginated
);



export default router;
