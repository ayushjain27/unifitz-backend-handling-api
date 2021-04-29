import { Router } from 'express';
import { StoreController } from '../../controllers';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../../routes/middleware/rbac';
import { ACL } from '../../enum/rbac.enum';

const router: Router = Router();
const storeController = container.get<StoreController>(TYPES.StoreController);
// @route   POST v1/store/
// @desc    Onboard store
// @access  Private
router.post('/', roleAuth(ACL.STORE_CREATE),storeController.createStore);

export default router;
