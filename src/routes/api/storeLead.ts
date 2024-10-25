import { Router } from 'express';
import multer from 'multer';

import { StoreLeadController } from '../../controllers';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../../routes/middleware/rbac';
import { ACL } from '../../enum/rbac.enum';
import { validationHandler } from '../middleware/auth';

const storage = multer.memoryStorage();
const uploadFiles = multer({ storage: storage });

const router: Router = Router();
const storeLeadController = container.get<StoreLeadController>(
  TYPES.StoreLeadController
);
// @route   POST v1/store/
// @desc    Onboard store
// @access  Private
router.post('/', roleAuth(ACL.STORE_CREATE), storeLeadController.createStore);
router.put('/', roleAuth(ACL.STORE_CREATE), storeLeadController.updateStore);
router.post(
  '/uploadStoreImages',
  uploadFiles.array('files'),
  roleAuth(ACL.STORE_CREATE),
  storeLeadController.uploadStoreImages
);
router.get(
  '/',
  // roleAuth(ACL.STORE_GET_SINGLE),
  storeLeadController.getStoreByStoreId
);
router.delete(
  '/:storeId',
  roleAuth(ACL.STORE_CREATE),
  storeLeadController.deleteStore
);
router.post(
  '/allStores',
  roleAuth(ACL.STORE_GET_ALL),
  storeLeadController.getAllStores
);

router.post(
  '/updateStatus',
  roleAuth(ACL.STORE_CREATE),
  storeLeadController.updateStoreStatus
);

router.post(
  '/initiate-business-verify',
  roleAuth(ACL.STORE_CREATE),
  storeLeadController.validate('initiateBusinessVerification'),
  validationHandler(),
  storeLeadController.initiateBusinessVerification
);

router.post(
  '/approve-business-verify',
  roleAuth(ACL.STORE_CREATE),
  storeLeadController.validate('approveBusinessVerification'),
  validationHandler(),
  storeLeadController.approveBusinessVerification
);

router.post(
  '/verify-aadhar-otp',
  roleAuth(ACL.STORE_CREATE),
  storeLeadController.validate('verifyAadhar'),
  validationHandler(),
  storeLeadController.verifyAadhar
);

router.post(
  '/admin-store-paginated',
  roleAuth(ACL.STORE_CREATE),
  storeLeadController.getAllStorePaginaed
);

router.get(
  '/countAllStores',
  roleAuth(ACL.STORE_CREATE),
  storeLeadController.getTotalStoresCount
);

export default router;
