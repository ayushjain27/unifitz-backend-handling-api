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
  '/createPrelistProduct',
  roleAuth(ACL.STORE_CREATE),
  productController.validate('createPrelistProduct'),
  productController.createPrelistProduct
);

router.put(
  '/createPrelistProduct/:productId',
  roleAuth(ACL.STORE_CREATE),
  productController.validate('createPrelistProduct'),

  productController.updatePrelistProduct
);

router.put(
  '/:productId',
  roleAuth(ACL.STORE_CREATE),
  productController.validate('createProduct'),

  productController.updateProduct
);

router.post(
  '/uploadProductImages',
  uploadFiles.array('files'),
  roleAuth(ACL.STORE_CREATE),
  productController.uploadProductImages
);

router.get('/getAll', roleAuth(ACL.STORE_GET_ALL), productController.getAll);

router.post(
  '/searchPrelistProduct_paginated',
  // roleAuth(ACL.STORE_GET_ALL),
  productController.searchPrelistProductPaginated
);

router.get(
  '/store/:storeId',
  // roleAuth(ACL.STORE_GET_ALL),
  productController.getAllProductsByStoreId
);

router.get(
  '/product-detail/:productId',
  // roleAuth(ACL.STORE_GET_ALL),
  productController.getProductByProductId
);

router.get(
  '/prelistProduct-detail/:productId',
  // roleAuth(ACL.STORE_GET_ALL),
  productController.getPrelistProductByProductId
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

router.delete(
  '/createPrelistProduct/:productId',
  roleAuth(ACL.STORE_CREATE),
  productController.prelistProductDelete
);

router.post(
  '/delete/multi',
  roleAuth(ACL.STORE_CREATE),
  productController.multiDelete
);

router.post(
  '/review',
  roleAuth(ACL.STORE_REVIEW_CREATE),
  productController.validate('reviewProduct'),
  productController.addProductReview
);
router.get(
  '/reviews',
  // roleAuth(ACL.STORE_REVIEW_CREATE),
  productController.validate('getReviews'),
  productController.getProductReviews
);

router.post(
  '/duplicateProductToStores',
  roleAuth(ACL.STORE_CREATE),
  productController.validate('duplicateProductToStores'),
  productController.duplicateProductToStores
);

export default router;
