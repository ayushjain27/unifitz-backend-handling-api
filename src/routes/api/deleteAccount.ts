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
  '/delete-request',
  roleAuth(ACL.STORE_GET_ALL),
  deleteAccountController.validate('createRequest'),
  validationHandler(),
  deleteAccountController.createDeleteRequestAccount
);

router.get(
  '/delete-request',
  roleAuth(ACL.STORE_GET_ALL),
  deleteAccountController.getDeleteRequest
);

router.delete(
  '/delete-request',
  roleAuth(ACL.STORE_GET_ALL),
  deleteAccountController.getRestoreRequest
);

export default router;
