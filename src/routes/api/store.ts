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
router.post(
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
router.put(
  '/:reviewId',
  roleAuth(ACL.STORE_CREATE),
  storeController.updateStoreReview
);
router.get('/:storeId/ratings', storeController.getOverallStoreRatings);
router.get('/:storeId/reviews', storeController.getStoreReviews);
router.post(
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
  '/approve-business-verify',
  roleAuth(ACL.STORE_CREATE),
  storeController.validate('approveBusinessVerification'),
  validationHandler(),
  storeController.approveBusinessVerification
);

router.post(
  '/verify-aadhar-otp',
  roleAuth(ACL.STORE_CREATE),
  storeController.validate('verifyAadhar'),
  validationHandler(),
  storeController.verifyAadhar
);

router.get(
  '/allReviews',
  roleAuth(ACL.STORE_CREATE),
  storeController.getAllReviews
);

router.post(
  '/fastestOnboarding',
  roleAuth(ACL.STORE_CREATE),
  storeController.createStoreFastestOnboarding
);

router.post(
  '/getStoresByCity',
  roleAuth(ACL.STORE_CREATE),
  storeController.getStoresByCity
);

router.post(
  '/admin-store-paginated',
  roleAuth(ACL.STORE_CREATE),
  storeController.getAllStorePaginaed
);

router.get(
  '/countAllStores',
  roleAuth(ACL.STORE_CREATE),
  storeController.getTotalStoresCount
);

router.post(
  '/getNearestStore',
  // roleAuth(ACL.STORE_GET_ALL),
  storeController.getNearestStore
);
router.post(
  '/getNearestDealer',
  // roleAuth(ACL.STORE_GET_ALL),
  storeController.getNearestDealer
);

router.post(
  '/createHistory',
  roleAuth(ACL.STORE_CREATE),
  storeController.createHistory
);

router.post(
  '/getHistory',
  // roleAuth(ACL.STORE_GET_ALL),
  storeController.getHistory
);

router.post(
  '/sponsoredStorepaginated',
  roleAuth(ACL.STORE_GET_ALL),
  storeController.getSponsoredStorePaginatedAll
);

router.get(
  '/countAllSponsoredStores',
  roleAuth(ACL.STORE_GET_ALL),
  storeController.countAllSponsoredStores
);

router.post(
  '/getSponsoredStorePaymentAnalytics',
  roleAuth(ACL.STORE_GET_ALL),
  storeController.getSponsoredStorePaymentAnalytics
)

router.get(
  '/getOverallPaymentDetails',
  roleAuth(ACL.STORE_GET_ALL),
  storeController.getOverallPaymentDetails
)

router.post(
  '/updateSponsoredPaymentDetails',
  roleAuth(ACL.STORE_GET_ALL),
  storeController.updateSponsoredPaymentDetails
)

router.get(
  '/totalNumberOfUsersPerCategoryPerMonth',
  roleAuth(ACL.STORE_GET_ALL),
  storeController.totalNumberOfUsersPerCategoryPerMonth
)

router.get(
  '/totalNumberOfUsersPerCategory',
  roleAuth(ACL.STORE_GET_ALL),
  storeController.totalNumberOfUsersPerCategory
)

// router.get(
//   '/getStoreByUserId',
//   // roleAuth(ACL.STORE_GET_SINGLE),
//   storeController.getStoreByUserId
// );
export default router;
