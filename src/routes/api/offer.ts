import { Router } from 'express';
import multer from 'multer';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../../routes/middleware/rbac';
import { ACL } from '../../enum/rbac.enum';
import { OfferController } from '../../controllers';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const offerController = container.get<OfferController>(TYPES.OfferController);

router.post('/', roleAuth(ACL.STORE_GET_ALL), offerController.createOffer);

router.post(
  '/uploadImage',
  uploadFile.single('file'),
  offerController.uploadImage
);

router.post(
  '/getAllOffer',
  roleAuth(ACL.STORE_GET_ALL),
  offerController.getAllOffer
);

router.get(
  '/getAllOfferByInterest',
  roleAuth(ACL.STORE_GET_ALL),
  offerController.getAllOfferByInterest
);

router.get('/getOfferById', offerController.getOfferById);

router.put('/updateOffer/:offerId', offerController.updateOffer);

router.delete('/deleteOffer', offerController.deleteOffer);

router.post('/updateOfferStatus', offerController.updateOfferStatus);

export default router;
