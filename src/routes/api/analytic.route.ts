import { Router } from 'express';
// import multer from 'multer';
import { ACL } from '../../enum/rbac.enum';
import { roleAuth } from '../../routes/middleware/rbac';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { AnalyticController } from '../../controllers';

const router: Router = Router();
const analyticController = container.get<AnalyticController>(
  TYPES.AnalyticController
);

router.get('/getTotalConsumers', analyticController.getTotalCustomers);
router.get(
  '/getTotalUsers',
  roleAuth(ACL.STORE_GET_ALL),
  analyticController.getTotalUsers
);

router.get(
  '/getVerifiedStores',
  roleAuth(ACL.STORE_GET_ALL),
  analyticController.getVerifiedStores
);

router.post(
  '/getAnalyticsMapsData',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getAnalyticsMapsData
);

router.post(
  '/getPlusFeatureData',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getPlusFeatureData
);

router.post('/createEventAnalytic', analyticController.createEventAnalytic);

router.post(
  '/getEventAnalytic',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getEventAnalytic
);

router.post(
  '/getActiveUser',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getActiveUser
);

router.post(
  '/getUsersByState',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getUsersByState
);
// router.get('/getTotalCustomers', analyticController.getTotalCustomers);

export default router;
