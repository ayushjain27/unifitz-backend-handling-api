import { Router } from 'express';
import multer from 'multer';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../middleware/rbac';
import { ACL } from '../../enum/rbac.enum';
import { BusinessController } from '../../controllers';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const businessController = container.get<BusinessController>(
  TYPES.BusinessController
);

router.post('/', businessController.createBusiness);

router.post(
  '/uploadImage',
  uploadFile.single('file'),
  businessController.uploadImage
);

router.get('/getAllBusiness', businessController.getAllBusiness);

router.get('/getBusinessByBusinessTypeAndCategory', businessController.getBusinessByBusinessTypeAndCategory);

router.get('/getBusinessById', businessController.getBusinessById);

router.put('/updateBusiness/:businessId', businessController.updateBusiness);

router.delete('/deleteBusiness', businessController.deleteBusiness);

router.post('/updateBusinessStatus', businessController.updateBusinessStatus);

export default router;
