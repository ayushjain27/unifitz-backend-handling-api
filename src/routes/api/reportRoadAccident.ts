import { Router } from 'express';
import multer from 'multer';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { ReportRoadAccidentController } from '../../controllers';
import { roleAuth } from '../middleware/rbac';
import { ACL } from '../../enum/rbac.enum';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const reportRoadAccidentController = container.get<ReportRoadAccidentController>(
  TYPES.ReportRoadAccidentController
);

router.post(
    '/',
    roleAuth(ACL.STORE_GET_ALL),
    reportRoadAccidentController.validate('createReportRoadAccidentUserDetail'),
    reportRoadAccidentController.createReportRoadAccidentUserDetail
  );

export default router;
