import { Router } from 'express';
import { ACL } from '../../enum/rbac.enum';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../middleware/rbac';
import { FavouriteStoreController } from './../../controllers/favouriteStore.controller';

const router: Router = Router();
const favouriteStoreController = container.get<FavouriteStoreController>(
  TYPES.FavouriteStoreController
);

router.post(
  '/addToFavourite',
  roleAuth(ACL.CUSTOMER_CREATE),
  favouriteStoreController.validate('addToFavourite'),
  favouriteStoreController.addToFavourite
);

router.delete(
  '/removeFromFavourite',
  roleAuth(ACL.CUSTOMER_CREATE),
  favouriteStoreController.removeFromFavourite
);

router.post(
  '/checkFavStore',
  roleAuth(ACL.CUSTOMER_CREATE),
  favouriteStoreController.checkFavStore
);

export default router;
