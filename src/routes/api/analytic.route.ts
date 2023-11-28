import { Router } from 'express';
// import multer from 'multer';
// import { ACL } from '../../enum/rbac.enum';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { AnalyticController } from '../../controllers';

const router: Router = Router();
const analyticController = container.get<AnalyticController>(
  TYPES.AnalyticController
);

router.get('/getTotalConsumers', analyticController.getTotalCustomers);
router.get('/getTotalUsers', analyticController.getTotalUsers);
router.post('/getTotalStores', analyticController.getTotalStores);
// router.get('/getTotalCustomers', analyticController.getTotalCustomers);

export default router;
