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
  roleAuth(ACL.STORE_CREATE),
  // reportController.validate('createProduct'),
  reportController.createReport
);

router.put(
  '/:productId',
  roleAuth(ACL.STORE_CREATE),
  // reportController.validate('createProduct'),
  reportController.updateReport
);

router.get('/getAll', roleAuth(ACL.STORE_GET_ALL), reportController.getAll);

router.get(
  '/:reportId',
  // roleAuth(ACL.STORE_GET_ALL),
  reportController.getAllReportsByReportId
);

export default router;
