import { Router } from 'express';
import multer from 'multer';
import { ACL } from '../../enum/rbac.enum';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { RazorPayController } from '../../controllers';
import { roleAuth } from '../middleware/rbac';
import { validationHandler } from '../middleware/auth';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const razorPayController = container.get<RazorPayController>(
  TYPES.RazorPayController
);

router.post(
    '/createSubscription',
    roleAuth(ACL.STORE_GET_ALL),
    razorPayController.createRazorPaySubscription
  )

export default router;
