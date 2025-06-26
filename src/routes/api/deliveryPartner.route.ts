import { Router } from 'express';
import multer from 'multer';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../middleware/rbac';
import { ACL } from '../../enum/rbac.enum';
import { DeliveryPartnerController } from '../../controllers';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const deliveryPartnerController = container.get<DeliveryPartnerController>(
  TYPES.DeliveryPartnerController
);

router.post(
  '/',
  roleAuth(ACL.STORE_CREATE),
  // spEmployeeController.validate('createEmployee'),
  deliveryPartnerController.createDeliverPartner
);

router.post(
  '/uploadDeliveryPartnerImage',
  uploadFile.single('file'),
  deliveryPartnerController.uploadDeliveryPartnerImage
);

router.post(
  '/getDeliveryPartnersPaginated',
  roleAuth(ACL.STORE_GET_ALL),
  deliveryPartnerController.getDeliveryPartnersPaginated

);

router.get(
  '/countAllDeliveryPartners',
  roleAuth(ACL.STORE_GET_ALL),
  deliveryPartnerController.countAllDeliveryPartners
);

router.get(
  '/getAllDeliveryPartnersByUserName',
  roleAuth(ACL.STORE_GET_ALL),
  deliveryPartnerController.getAllDeliveryPartnersByUserName
);

router.get(
  '/getDeliveryPartnerDetailsByPartnerId',
  roleAuth(ACL.STORE_GET_ALL),
  deliveryPartnerController.getDeliveryPartnerDetailsByPartnerId
);

router.post(
  '/login',
  deliveryPartnerController.login
);

router.get(
  '/getAllDeliveryOrders',
  roleAuth(ACL.STORE_GET_ALL),
  deliveryPartnerController.getAllDeliveryOrders
);

router.post(
  '/postDeliveryDone',
  roleAuth(ACL.STORE_GET_ALL),
  deliveryPartnerController.postDeliveryDone
);

export default router;
