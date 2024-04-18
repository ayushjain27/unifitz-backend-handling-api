import { Router } from 'express';
import multer from 'multer';

import { CreateInvoiceController, JobCardController } from '../../controllers';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../../routes/middleware/rbac';
import { ACL } from '../../enum/rbac.enum';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const createInvoiceController = container.get<CreateInvoiceController>(
  TYPES.CreateInvoiceController
);

router.post(
  '/createInvoice',
  roleAuth(ACL.STORE_CREATE),
  createInvoiceController.createAdditionalItems
);

router.get(
  '/invoiceDetail/:id',
  createInvoiceController.getInvoiceById
);

router.get(
  '/invoiceDetails/:storeId',
  roleAuth(ACL.STORE_CREATE),
  createInvoiceController.getInvoiceByStoreId
);

router.get(
  '/invoiceEmail',
  roleAuth(ACL.STORE_CREATE),
  createInvoiceController.invoiceEmail
);

export default router;
