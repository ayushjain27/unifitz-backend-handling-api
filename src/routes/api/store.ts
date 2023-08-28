import { Router } from 'express';
import multer from 'multer';

import { StoreController } from '../../controllers';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../../routes/middleware/rbac';
import { ACL } from '../../enum/rbac.enum';
import { validationHandler } from '../middleware/auth';

const storage = multer.memoryStorage();
const uploadFiles = multer({ storage: storage });

const router: Router = Router();
const storeController = container.get<StoreController>(TYPES.StoreController);
// @route   POST v1/store/
// @desc    Onboard store
// @access  Private
router.post('/', roleAuth(ACL.STORE_CREATE), storeController.createStore);
router.put('/', roleAuth(ACL.STORE_CREATE), storeController.updateStore);
router.post(
  '/uploadStoreImages',
  uploadFiles.array('files'),
  roleAuth(ACL.STORE_CREATE),
  storeController.uploadStoreImages
);
router.get(
  '/',
  // roleAuth(ACL.STORE_GET_SINGLE),
  storeController.getStoreByStoreId
);
router.delete(
  '/:storeId',
  roleAuth(ACL.STORE_CREATE),
  storeController.deleteStore
);
router.get(
  '/allStores',
  roleAuth(ACL.STORE_GET_ALL),
  storeController.getAllStores
);
router.get(
  '/search',
  roleAuth(ACL.STORE_GET_ALL),
  storeController.searchStores
);

router.post(
  '/search_paginated',
  // roleAuth(ACL.STORE_GET_ALL),
  storeController.searchStoresPaginated
);

router.get(
  '/owner/:userId',
  roleAuth(ACL.STORE_GET_OWNER),
  storeController.getStoresByOwner
);
// router.post(
//   '/uploadFile',
//   uploadFile.single('file'),
//   roleAuth(ACL.STORE_CREATE),
//   storeController.uploadFile
// );
router.post(
  '/review',
  roleAuth(ACL.STORE_REVIEW_CREATE),
  storeController.addStoreReview
);
router.get('/:storeId/ratings', storeController.getOverallStoreRatings);
router.get('/:storeId/reviews', storeController.getStoreReviews);
router.put(
  '/updateStatus',
  roleAuth(ACL.STORE_CREATE),
  storeController.updateStoreStatus
);

router.post(
  '/initiate-business-verify',
  roleAuth(ACL.STORE_CREATE),
  storeController.validate('initiateBusinessVerification'),
  validationHandler(),
  storeController.initiateBusinessVerification
);

router.post(
  '/verify-aadhar-otp',
  roleAuth(ACL.STORE_CREATE),
  storeController.validate('verifyAadhar'),
  validationHandler(),
  storeController.verifyAadhar
);
export default router;
