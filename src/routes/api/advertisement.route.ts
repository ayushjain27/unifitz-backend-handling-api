import { Router } from 'express';
import multer from 'multer';
import { ACL } from '../../enum/rbac.enum';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { AdvertisementController } from '../../controllers';
import { roleAuth } from '../middleware/rbac';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const adController = container.get<AdvertisementController>(
  TYPES.AdvertisementController
);

// upload banner API
router.post(
  '/uploadBanner',
  uploadFile.single('file'),
  roleAuth(ACL.ADVERTISEMENT_CREATE),
  adController.validate('uploadBanner'),
  adController.uploadBanner
);

router.get(
  '/getAllBanner',
  roleAuth(ACL.ADVERTISEMENT_CREATE),
  adController.getAllBanner
);
router.get(
  '/getCustBanners',
  roleAuth(ACL.ADVERTISEMENT_GET_CUSTOMER),
  adController.getAllBannerForCustomer
);

router.post(
  '/updateBannerStatus',
  roleAuth(ACL.ADVERTISEMENT_CREATE),
  adController.validate('updateBannerStatus'),
  adController.updateBannerStatus
);

router.delete(
  '/deleteBanner',
  roleAuth(ACL.ADVERTISEMENT_CREATE),
  adController.validate('deleteBanner'),
  adController.deleteBanner
);

export default router;
