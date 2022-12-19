import { Router } from 'express';
import multer from 'multer';

import { ProductController } from '../../controllers';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../../routes/middleware/rbac';
import { ACL } from '../../enum/rbac.enum';

const storage = multer.memoryStorage();
const uploadFiles = multer({ storage: storage });

const router: Router = Router();
const productController = container.get<ProductController>(
  TYPES.ProductController
);

router.post(
  '/',
  roleAuth(ACL.STORE_CREATE),
  productController.validate('createProduct'),
  productController.createProduct
);

router.post(
  '/uploadProductImages',
  uploadFiles.array('files'),
  roleAuth(ACL.STORE_CREATE),
  productController.uploadProductImages
);

router.get(
  '/getAll',
  roleAuth(ACL.ADMIN_USER_CREATE),
  productController.getAll
);

router.get(
  '/:storeId',
  roleAuth(ACL.STORE_CREATE),
  productController.getAllProductsByStoreId
);
router.get(
  '/product-detail/:productId',
  roleAuth(ACL.STORE_CREATE),
  productController.getProductByProductId
);
router.put(
  '/:productId',
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
