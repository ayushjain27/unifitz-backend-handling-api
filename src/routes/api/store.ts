import { Router } from 'express';
import multer from 'multer';

import { StoreController } from '../../controllers';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../../routes/middleware/rbac';
import { ACL } from '../../enum/rbac.enum';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const storeController = container.get<StoreController>(TYPES.StoreController);
// @route   POST v1/store/
// @desc    Onboard store
// @access  Private
router.post('/', roleAuth(ACL.STORE_CREATE), storeController.createStore);
router.put('/', roleAuth(ACL.STORE_CREATE), storeController.updateStore);
router.get(
  '/',
  roleAuth(ACL.STORE_GET_SINGLE),
  storeController.getStoreByStoreId
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
router.get(
  '/owner/:userId',
  roleAuth(ACL.STORE_GET_OWNER),
  storeController.getStoresByOwner
);
router.post(
  '/uploadFile',
  uploadFile.single('file'),
  roleAuth(ACL.STORE_CREATE),
  storeController.uploadFile
);
router.post(
  '/review',
  roleAuth(ACL.STORE_REVIEW_CREATE),
  storeController.addStoreReview
);
router.get('/:storeId/ratings', storeController.getOverallStoreRatings);
router.get('/:storeId/reviews', storeController.getStoreReviews);
export default router;
