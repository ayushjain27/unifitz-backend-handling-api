import { Router } from 'express';
import multer from 'multer';

import { JobCardController } from '../../controllers';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../../routes/middleware/rbac';
import { ACL } from '../../enum/rbac.enum';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const jobCardController = container.get<JobCardController>(
  TYPES.JobCardController
);

router.post(
  '/',
  roleAuth(ACL.STORE_CREATE),
  jobCardController.validate('createJobCard'),
  jobCardController.createJobCard
);

router.post(
  '/createLineItems',
  roleAuth(ACL.STORE_CREATE),
  jobCardController.createLineItems
);

router.get(
  '/jobCardDetails/:storeId',
  roleAuth(ACL.STORE_CREATE),
  jobCardController.getJobCardsByStoreId
);

router.get(
  '/jobCardById',
  roleAuth(ACL.STORE_CREATE),
  jobCardController.getJobCardById
);

router.put(
  '/:jobCardId',
  roleAuth(ACL.STORE_CREATE),
  jobCardController.updateJobCard
);

export default router;
