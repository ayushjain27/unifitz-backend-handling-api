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
  '/uploadBannerImage',
  uploadFile.single('file'),
  // roleAuth(ACL.ADVERTISEMENT_CREATE),
  adController.uploadBannerImage
);

router.post(
  '/uploadBanner',
  uploadFile.single('file'),
  roleAuth(ACL.STORE_GET_ALL),
  // roleAuth(ACL.ADVERTISEMENT_CREATE),
  adController.validate('uploadBanner'),
  adController.uploadBanner
);

router.post(
  '/getAllBanner',
  // roleAuth(ACL.STORE_CREATE),
  adController.getAllBanner
);

router.get(
  '/getBannerById',
  // roleAuth(ACL.ADVERTISEMENT_CREATE),
  adController.getBannerById
);

router.get(
  '/getCustBanners',
  roleAuth(ACL.ADVERTISEMENT_GET_CUSTOMER),
  adController.getAllBannerForCustomer
);

router.post(
  '/updateBannerStatus',
  // roleAuth(ACL.ADVERTISEMENT_CREATE),
  adController.validate('updateBannerStatus'),
  adController.updateBannerStatus
);

router.put(
  '/updateBannerDetails/:bannerId',
  // roleAuth(ACL.ADVERTISEMENT_CREATE),
  adController.updateBannerDetails
);

router.delete(
  '/deleteBanner',
  // roleAuth(ACL.ADVERTISEMENT_CREATE),
  adController.validate('deleteBanner'),
  adController.deleteBanner
);

router.post(
  '/bannerAnalytic',
  // roleAuth(ACL.ADVERTISEMENT_CREATE),
  adController.bannerAnalytic
);

export default router;
