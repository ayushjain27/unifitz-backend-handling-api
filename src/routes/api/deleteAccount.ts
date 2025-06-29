import { Router } from 'express';
import multer from 'multer';
import { ACL } from '../../enum/rbac.enum';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { DeleteAccountController } from '../../controllers';
import { roleAuth } from '../middleware/rbac';
import { validationHandler } from '../middleware/auth';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const deleteAccountController = container.get<DeleteAccountController>(
  TYPES.DeleteAccountController
);

router.post(
  '/signup',
  deleteAccountController.signup
);

router.post(
  '/login',
  deleteAccountController.login
);

router.post(
  '/createStudioInfo',
  deleteAccountController.createStudioInfo
);

router.get(
  '/getAllStudioInfo',
  deleteAccountController.getAllStudioInfo
);

router.post(
  '/createHeroContent',
  deleteAccountController.createHeroContent
);

router.get(
  '/getAllHeroContent',
  deleteAccountController.getAllHeroContent
);

router.post(
  '/aboutContent',
  deleteAccountController.aboutContent
);

router.get(
  '/getAllAboutContent',
  deleteAccountController.getAllAboutContent
);

router.post(
  '/benefits',
  deleteAccountController.benefits
);

router.get(
  '/getAllBenefits',
  deleteAccountController.getAllBenefits
);

router.post(
  '/classes',
  deleteAccountController.classes
);

router.get(
  '/getAllClasses',
  deleteAccountController.getAllClasses
);

router.post(
  '/uploadImage',
  deleteAccountController.uploadImage
);

export default router;
