import { Router } from 'express';
import multer from 'multer';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../middleware/rbac';
import { ACL } from '../../enum/rbac.enum';
import { validationHandler } from '../middleware/auth';
import { OrderManagementController } from '../../controllers';

const storage = multer.memoryStorage();
const uploadFiles = multer({ storage: storage });

const router: Router = Router();
const orderManagementController = container.get<OrderManagementController>(
  TYPES.OrderManagementController
);

router.post(
  '/create-order',
  roleAuth(ACL.STORE_GET_ALL),
  orderManagementController.validate('createOrder'),
  validationHandler(),
  orderManagementController.createOrder
);

router.get(
  '/get-order/:orderId',
  roleAuth(ACL.STORE_GET_ALL),
  validationHandler(),
  orderManagementController.getOrderById
);

router.post(
  '/get-all-orders',
  roleAuth(ACL.STORE_GET_ALL),
  validationHandler(),
  orderManagementController.getUserAllOrdersPaginated
);

router.post(
  '/update-cart-status',
  roleAuth(ACL.STORE_GET_ALL),
  validationHandler(),
  orderManagementController.updateCartStatus
);

router.post(
  '/distributors-orders-paginated',
  roleAuth(ACL.STORE_CREATE),
  orderManagementController.getAllDistributorsOrdersPaginated
);

router.get(
  '/countAllDistributorOrdersCount',
  roleAuth(ACL.STORE_CREATE),
  orderManagementController.getDistributorOrdersCount
);

router.get(
  '/getDistributorOrderById',
  roleAuth(ACL.STORE_CREATE),
  orderManagementController.getDistributorOrderById
);

router.post(
  '/updatePaymentMode',
  roleAuth(ACL.STORE_CREATE),
  orderManagementController.validate('paymentMode'),
  orderManagementController.updatePaymentMode
);

router.post(
  '/updatePaymentStatus',
  roleAuth(ACL.STORE_CREATE),
  orderManagementController.updatePaymentStatus
);

router.post(
  '/sparePostRequirement/create',
  roleAuth(ACL.STORE_CREATE),
  orderManagementController.createSparePostRequirement
);
router.post(
  '/sparePostRequirement/audioUpload',
  uploadFiles.array('files'),
  orderManagementController.updateAudio
);
router.post(
  '/sparePostRequirement/imageUpload',
  uploadFiles.array('files'),
  orderManagementController.updateImage
);
router.put('/sparePostRequirement/:sparePostId', orderManagementController.updateSparePost);


router.delete(
  '/sparePostRequirement/delete/:sparePostId',
  orderManagementController.deleteSparePost
);

router.get(
  '/sparePostRequirement/getById',
  orderManagementController.getSparePostRequirementDetails
);

router.get(
  '/sparePostRequirement/paginated',
  orderManagementController.getSparePostPaginated
);
router.get(
  '/sparePostRequirement/count',
  orderManagementController.getSparePostCount
);

router.get(
  '/sparePostRequirement/getSpareRequirementId',
  orderManagementController.getSparePostRequirementDetailById
);

router.post(
  '/sparePostStatus/create',
  roleAuth(ACL.STORE_CREATE),
  orderManagementController.createSparePostStatus
);

router.get(
  '/sparePostStatus/getById',
  orderManagementController.getSparePostStatusDetails
);

export default router;
