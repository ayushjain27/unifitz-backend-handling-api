import { Router } from 'express';
import { ACL } from '../../enum/rbac.enum';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { NotificationController } from '../../controllers';
import { roleAuth } from '../middleware/rbac';
import { validationHandler } from '../middleware/auth';

const router: Router = Router();
const notificationController = container.get<NotificationController>(
  TYPES.NotificationController
);
// @route   POST api/customer
// @access  Private
router.get(
  '/send',
  // roleAuth(ACL.NOTIFICATION_SEND),
  notificationController.sendNotification
);

router.post(
  '/createNotification',
  notificationController.validate('createNotification'),
  validationHandler(),
  notificationController.createNotification
);

router.post(
  '/updateNotificationStatus',
  validationHandler(),
  notificationController.updateNotificationStatus
);

router.get(
  '/countTotalNotification',
  notificationController.countTotalNotification
);

router.post(
  '/get-all-notifications',
  validationHandler(),
  notificationController.getUserAllNotificationsPaginated
);

export default router;
