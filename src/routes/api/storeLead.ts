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
router.get(
  '/search',
  roleAuth(ACL.STORE_GET_ALL),
  storeLeadController.searchStores
);

router.post(
  '/search_paginated',
  // roleAuth(ACL.STORE_GET_ALL),
  storeLeadController.searchStoresPaginated
);

router.get(
  '/owner/:userId',
  roleAuth(ACL.STORE_GET_OWNER),
  storeLeadController.getStoresByOwner
);
// router.post(
//   '/uploadFile',
//   uploadFile.single('file'),
//   roleAuth(ACL.STORE_CREATE),
//   storeLeadController.uploadFile
// );
router.post(
  '/review',
  roleAuth(ACL.STORE_REVIEW_CREATE),
  storeLeadController.addStoreReview
);
router.put(
  '/:reviewId',
  roleAuth(ACL.STORE_CREATE),
  storeLeadController.updateStoreReview
);
router.get('/:storeId/ratings', storeLeadController.getOverallStoreRatings);
router.get('/:storeId/reviews', storeLeadController.getStoreReviews);
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

router.get(
  '/allReviews',
  roleAuth(ACL.STORE_CREATE),
  storeLeadController.getAllReviews
);

router.post(
  '/fastestOnboarding',
  roleAuth(ACL.STORE_CREATE),
  storeLeadController.createStoreFastestOnboarding
);

router.post(
  '/getStoresByCity',
  roleAuth(ACL.STORE_CREATE),
  storeLeadController.getStoresByCity
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

router.post(
  '/getNearestStore',
  // roleAuth(ACL.STORE_GET_ALL),
  storeLeadController.getNearestStore
);
router.post(
  '/getNearestDealer',
  // roleAuth(ACL.STORE_GET_ALL),
  storeLeadController.getNearestDealer
);

router.post(
  '/createHistory',
  roleAuth(ACL.STORE_CREATE),
  storeLeadController.createHistory
);
router.post(
  '/getHistory',
  // roleAuth(ACL.STORE_GET_ALL),
  storeLeadController.getHistory
);

// router.get(
//   '/getStoreByUserId',
//   // roleAuth(ACL.STORE_GET_SINGLE),
//   storeLeadController.getStoreByUserId
// );
export default router;
