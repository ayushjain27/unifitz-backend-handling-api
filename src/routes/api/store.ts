import { Router, Response } from 'express';
import Request from '../../types/request';

import { StoreController } from '../../controllers';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../../routes/middleware/rbac';
import { ACL } from '../../enum/rbac.enum';
import multer from 'multer';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const storeController = container.get<StoreController>(TYPES.StoreController);
// @route   POST v1/store/
// @desc    Onboard store
// @access  Private
router.post('/', roleAuth(ACL.STORE_CREATE), storeController.createStore);
router.put('/', roleAuth(ACL.STORE_CREATE), storeController.updateStore);
router.get('/', storeController.getStores);
router.get('/:userId', storeController.getStoresByOwner);
router.post(
  '/uploadFile',
  uploadFile.single('file'),
  storeController.uploadFile
);

export default router;
