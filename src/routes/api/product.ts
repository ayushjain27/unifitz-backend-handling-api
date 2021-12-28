import { Router } from 'express';
import multer from 'multer';

import { ProductController } from '../../controllers';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../../routes/middleware/rbac';
import { ACL } from '../../enum/rbac.enum';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const productController = container.get<ProductController>(
  TYPES.ProductController
);

router.post(
  '/',
  uploadFile.single('file'),
  roleAuth(ACL.STORE_CREATE),
  productController.validate('createProduct'),
  productController.createProduct
);

router.get(
  '/:storeId',
  roleAuth(ACL.STORE_GET_OWNER),
  productController.getAllProductsByStoreId
);

router.put(
  '/:productId',
  uploadFile.single('file'),
  roleAuth(ACL.STORE_CREATE),
  productController.validate('createProduct'),
  productController.updateProduct
);

router.delete(
  '/:productId',
  roleAuth(ACL.STORE_CREATE),
  productController.delete
);

export default router;
