import { Router } from 'express';
import multer from 'multer';

import { SmcInsuranceController } from '../../controllers';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';

const storage = multer.memoryStorage();

const router: Router = Router();
const smcInsuranceController = container.get<SmcInsuranceController>(
  TYPES.SmcInsuranceController
);

router.post('/', smcInsuranceController.createSmcInsurance);

export default router;
