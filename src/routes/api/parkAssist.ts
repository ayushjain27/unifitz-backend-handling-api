import { Router } from 'express';
import multer from 'multer';
import { ACL } from '../../enum/rbac.enum';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { ParkAssistController, RazorPayController } from '../../controllers';
import { roleAuth } from '../middleware/rbac';
import { validationHandler } from '../middleware/auth';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const parkAssistController = container.get<ParkAssistController>(
  TYPES.ParkAssistController
);

router.post(
  '/createUser',
  roleAuth(ACL.STORE_GET_ALL),
  parkAssistController.validate('createUser'),
  validationHandler(),
  parkAssistController.createUser
);

router.post(
  '/createUserChat',
  roleAuth(ACL.STORE_GET_ALL),
  parkAssistController.validate('createUserChat'),
  validationHandler(),
  parkAssistController.createUserChat
);

router.get(
  '/getUserChatDetails',
  roleAuth(ACL.STORE_GET_ALL),
  parkAssistController.getUserChatDetails
);

router.get(
  '/getUserDetails',
  roleAuth(ACL.STORE_GET_ALL),
  parkAssistController.getUserDetails
);

export default router;
