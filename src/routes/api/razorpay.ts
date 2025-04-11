import { Router } from 'express';
import multer from 'multer';
import { ACL } from '../../enum/rbac.enum';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { RazorPayController } from '../../controllers';
import { roleAuth } from '../middleware/rbac';
import { validationHandler } from '../middleware/auth';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const razorPayController = container.get<RazorPayController>(
  TYPES.RazorPayController
);

router.post(
  '/createSubscription',
  roleAuth(ACL.STORE_GET_ALL),
  razorPayController.createRazorPaySubscription
);

router.post(
  '/createPayment',
  roleAuth(ACL.STORE_GET_ALL),
  razorPayController.validate('createPayment'),
  validationHandler(),
  razorPayController.createPayment
);

router.post(
  '/create-order',
  roleAuth(ACL.STORE_GET_ALL),
  razorPayController.createOrder
);

router.post(
  '/updatePaymentStatus',
  roleAuth(ACL.STORE_GET_ALL),
  razorPayController.validate('updatePaymentStatus'),
  validationHandler(),
  razorPayController.updatePaymentStatus
);

router.get(
  '/getPaymentDetails',
  roleAuth(ACL.STORE_GET_ALL),
  razorPayController.getPaymentDetails
);

// router.post(
//   '/createSubscriptionData',
//   roleAuth(ACL.STORE_GET_ALL),
//   razorPayController.validate('createSubscriptionData'),
//   validationHandler(),
//   razorPayController.createSubscriptionData
// )

export default router;
