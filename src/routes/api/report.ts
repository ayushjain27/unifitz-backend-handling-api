import { Router } from 'express';
import multer from 'multer';

import { ProductController } from './../../controllers/product.controller';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../../routes/middleware/rbac';
import { ACL } from '../../enum/rbac.enum';
import { ReportController } from './../../controllers/report.controller';

const storage = multer.memoryStorage();
const uploadFiles = multer({ storage: storage });

const router: Router = Router();
const reportController = container.get<ReportController>(
  TYPES.ReportController
);

router.post(
  '/',
  roleAuth(ACL.STORE_GET_ALL),
  reportController.validate('createReport'),
  reportController.createReport
);

router.put(
  '/updateReportStatus',
  roleAuth(ACL.STORE_CREATE),
  reportController.updateReportStatus
);

router.put(
  '/:reportId',
  roleAuth(ACL.STORE_GET_ALL),
  // reportController.validate('createProduct'),
  reportController.updateReport
);

router.get('/getAll', reportController.getAll);

router.get(
  '/:reportId',
  // roleAuth(ACL.STORE_GET_ALL),
  reportController.getAllReportsByReportId
);

router.post(
  '/createNotes',
  roleAuth(ACL.STORE_GET_ALL),
  reportController.createNotes
);

export default router;
