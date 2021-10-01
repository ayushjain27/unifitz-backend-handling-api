import { Router } from 'express';
import { ACL } from '../../enum/rbac.enum';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { NotificationController } from '../../controllers';
import { roleAuth } from '../middleware/rbac';

const router: Router = Router();
const notificationController = container.get<NotificationController>(
  TYPES.NotificationController
);
// @route   POST api/customer
// @access  Private
router.post(
  '/send',
  roleAuth(ACL.NOTIFICATION_SEND),
  notificationController.sendNotification
);

export default router;
