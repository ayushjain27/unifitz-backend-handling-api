import { Router } from 'express';
import multer from 'multer';

import { ProductController } from './../../controllers/product.controller';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../../routes/middleware/rbac';
import { ACL } from '../../enum/rbac.enum';
import { validationHandler } from '../middleware/auth';

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
router.get(
  '/getAllCount',
  roleAuth(ACL.STORE_GET_ALL),
  productController.getAllCount
);

router.get(
  '/paginated/getAll',
  roleAuth(ACL.STORE_GET_ALL),
  productController.paginatedProductAll
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

router.post(
  '/delete/multi',
  roleAuth(ACL.STORE_CREATE),
  productController.multiDelete
);

// router.post(
//   '/review',
//   roleAuth(ACL.STORE_CREATE),
//   productController.validate('reviewProduct'),
//   productController.addProductReview
// );
// router.get(
//   '/reviews',
//   // roleAuth(ACL.STORE_REVIEW_CREATE),
//   productController.validate('getReviews'),
//   productController.getProductReviews
// );

router.post(
  '/duplicateProductToStores',
  roleAuth(ACL.STORE_CREATE),
  productController.validate('duplicateProductToStores'),
  productController.duplicateProductToStores
);

router.post(
  '/createPrelistProduct',
  roleAuth(ACL.STORE_CREATE),
  // productController.validate('createPrelistProduct'),
  productController.createPrelistProduct
);

router.post(
  '/searchPrelistProduct_paginated',
  roleAuth(ACL.STORE_GET_ALL),
  productController.searchPrelistProductPaginated
);
router.post(
  '/prelistCount',
  roleAuth(ACL.STORE_GET_ALL),
  productController.getTotalPrelistCount
);

router.get(
  '/prelistProduct-detail/:productId',
  // roleAuth(ACL.STORE_GET_ALL),
  productController.getPrelistProductByProductId
);

router.put(
  '/updatePrelistProduct/:productId',
  productController.updatePrelistProduct
);

router.post('/updateProductStatus', productController.updateProductStatus);

router.delete(
  '/createPrelistProduct/:productId',
  roleAuth(ACL.STORE_CREATE),
  productController.prelistProductDelete
);

router.post(
  '/createProductFromPrelist',
  productController.validate('createProductFromPrelist'),
  roleAuth(ACL.STORE_CREATE),
  productController.createProductFromPrelist
);

router.post(
  '/uploadPrelistProductImages',
  uploadFiles.array('files'),
  roleAuth(ACL.STORE_CREATE),
  productController.uploadPrelistPoductImages
);

router.get(
  '/searchAndFilterProduct',
  // roleAuth(ACL.STORE_GET_ALL),
  productController.searchAndFilterProduct
);

router.post(
  '/oemUserName',
  // roleAuth(ACL.STORE_GET_ALL),
  productController.getProductByOemUserName
);

///////////////// b2b partner product api lists /////////////////////

router.post(
  '/partner',
  roleAuth(ACL.STORE_CREATE),
  productController.createPartnerProduct
);

router.post(
  '/createBulkProducts',
  uploadFiles.single('excelFile'),
  roleAuth(ACL.STORE_CREATE),
  productController.uploadBulkPartnerProducts
);

router.get(
  '/download-template',
  roleAuth(ACL.STORE_CREATE),
  productController.downloadTemplate
)

router.get(
  '/partner/getAll',
  roleAuth(ACL.STORE_GET_ALL),
  productController.partnerProductGetAll
);

router.get(
  '/partner/paginated/getAll',
  roleAuth(ACL.STORE_GET_ALL),
  productController.getAllProductByPaginated
);
router.get(
  '/partner/getAllCount',
  roleAuth(ACL.STORE_GET_ALL),
  productController.getAllPartnerProductCount
);

router.post(
  '/partner/filter',
  roleAuth(ACL.STORE_GET_ALL),
  productController.partnerProductFilter
);

router.post(
  '/partner/paginated',
  roleAuth(ACL.STORE_GET_ALL),
  productController.PaginatedPartnerProduct
);

router.get(
  '/partner/getAllCategoriesAndSubCategories',
  roleAuth(ACL.STORE_GET_ALL),
  productController.getAllCategoriesAndSubCategories
);

router.get(
  '/partner/similar',
  roleAuth(ACL.STORE_GET_ALL),
  productController.similarPartnerProduct
);
router.get(
  '/partner/similarBrand',
  roleAuth(ACL.STORE_GET_ALL),
  productController.allSimilarBrand
);

router.get('/partner/productId', productController.getPartnerProductById);

router.get('/partner/getProductDetailByProductId/productId', productController.getPartnerProductDetailById);

router.put(
  '/partner/update/:partnerProductId',
  productController.updatePartnerProduct
);

router.delete(
  '/partner/delete/:partnerProductId',
  productController.deletePartnerProduct
);

router.post(
  '/partner/updateStatus',
  productController.updatePartnerProductStatus
);

router.post(
  '/partner/updateMany',
  roleAuth(ACL.STORE_GET_ALL),
  productController.updateManyProduct
);

router.post(
  '/partner/uploadImages',
  uploadFiles.array('files'),
  productController.updatePartnerProductImages
);

router.post(
  '/partner/review',
  roleAuth(ACL.STORE_CREATE),
  productController.validate('reviewProduct'),
  productController.addProductReview
);

router.get(
  '/:partnerProductId/ratings',
  productController.getOverallPartnerProductRatings
);

router.get(
  '/partner/reviews',
  // roleAuth(ACL.STORE_REVIEW_CREATE),
  productController.validate('getReviews'),
  productController.getProductReviews
);

router.post(
  '/partner/addToCart',
  roleAuth(ACL.STORE_CREATE),
  productController.addToCart
);

router.get('/partner/getCartList', productController.getCartList);

router.put('/partner/cart/update/:cartId', productController.updateCartProduct);

router.delete(
  '/partner/cart/delete/:cartId',
  productController.deleteCartProduct
);

router.post(
  '/partner/product-order-address',
  roleAuth(ACL.STORE_GET_ALL),
  productController.validate('createNewAddress'),
  // validationHandler(),
  productController.createNewAddress
);

router.put(
  '/partner/product-order-address/:addressId',
  roleAuth(ACL.STORE_CREATE),
  productController.validate('createNewAddress'),
  productController.updateProductAddress
);

router.get(
  '/partner/product-order-address',
  roleAuth(ACL.STORE_GET_ALL),
  productController.getProductOrderAddressRequest
);

router.get(
  '/partner/product-order-address-detail',
  roleAuth(ACL.STORE_GET_ALL),
  productController.getProductOrderAddressRequestByAddressId
);

router.delete(
  '/partner/delete-address',
  roleAuth(ACL.STORE_GET_ALL),
  productController.deleteAddressById
);

router.post(
  '/partner/update-status',
  roleAuth(ACL.STORE_GET_ALL),
  productController.updateStatusOfAddress
);

router.post(
  '/createMasterProduct',
  roleAuth(ACL.STORE_CREATE),
  productController.createMasterProduct
);



export default router;
