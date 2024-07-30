import { Router } from 'express';
import multer from 'multer';
import { ACL } from '../../enum/rbac.enum';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { CustomerController } from '../../controllers';
import { roleAuth } from '../middleware/rbac';
import { validationHandler } from '../middleware/auth';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const customerController = container.get<CustomerController>(
  TYPES.CustomerController
);
// @route   POST api/customer
// @access  Private
router.post('/', roleAuth(ACL.CUSTOMER_CREATE), customerController.create);
router.put(
  '/:customerId',
  roleAuth(ACL.CUSTOMER_CREATE),
  customerController.update
);

router.post(
  '/uploadCustomerImage',
  uploadFile.single('file'),
  roleAuth(ACL.CUSTOMER_CREATE),
  customerController.uploadCustomerImage
);

router.post(
  '/customerByPhoneNo',
  roleAuth(ACL.CUSTOMER_CREATE),
  customerController.getCustomerByPhoneNo
);

router.post(
  '/initiate-user-verify',
  customerController.validate('initiateUserVerification'),
  validationHandler(),
  customerController.initiateUserVerification
);


router.post(
  '/approve-user-verify',
  customerController.validate('approveUserVerification'),
  validationHandler(),
  customerController.approveUserVerification
);

router.post(
  '/verify-aadhar-otp',
  customerController.validate('verifyAadhar'),
  validationHandler(),
  customerController.verifyAadhar
);

router.get('/all', customerController.getAll);

export default router;
