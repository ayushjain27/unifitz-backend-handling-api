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
  roleAuth(ACL.STORE_GET_ALL),
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

router.get(
  '/getcustomerDetailsByCustomerId',
  customerController.validate('getcustomerDetailsByCustomerId'),
  // validationHandler(),
  customerController.getcustomerDetailsByCustomerId
);

router.get('/paginated/all', customerController.getPaginatedAll);

router.get('/count', customerController.getAllCount);

router.get('/getAllCustomerId', customerController.getAllCustomerId);

router.get('/getAllCustomerReferralsByCustomerId', customerController.getAllCustomerReferralsByCustomerId);

router.post('/inviteUsers', roleAuth(ACL.CUSTOMER_CREATE), customerController.inviteUsers);

router.get(
  '/countAllReferCustomer',
  roleAuth(ACL.STORE_CREATE),
  customerController.countAllReferCustomer
);

router.post(
  '/count-all-refer-customer-paginated',
  roleAuth(ACL.STORE_CREATE),
  customerController.countAllReferCustomerPaginated
);

router.post(
  '/create-rewards',
  customerController.validate('createRewards'),
  // validationHandler(),
  roleAuth(ACL.STORE_CREATE),
  customerController.createRewards
);

router.post(
  '/uploadRewardImage',
  uploadFile.single('file'),
  roleAuth(ACL.STORE_CREATE),
  customerController.uploadRewardImage
);

router.get(
  '/countAllRewards',
  roleAuth(ACL.STORE_CREATE),
  customerController.countAllRewards
);

router.post(
  '/get-rewards-paginated',
  roleAuth(ACL.STORE_CREATE),
  customerController.getAllRewardsPaginated
);

router.post(
  '/update-total-users',
  roleAuth(ACL.STORE_CREATE),
  customerController.updateTotalUsers
);

router.post(
  '/update-reward-status',
  roleAuth(ACL.STORE_CREATE),
  customerController.updateRewardStatus
);

router.get(
  '/inviteUserPerCustomerId',
  roleAuth(ACL.CUSTOMER_CREATE),
  customerController.getInviteUserPerCustomerId
);


export default router;
