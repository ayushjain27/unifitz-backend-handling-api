import { Router } from 'express';
import multer from 'multer';

import { SmcInsuranceController } from '../../controllers';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { validateApiKey } from '../../utils/validataKey';

const storage = multer.memoryStorage();

const router: Router = Router();
const smcInsuranceController = container.get<SmcInsuranceController>(
  TYPES.SmcInsuranceController
);

router.post('/', validateApiKey, smcInsuranceController.createSmcInsurance);

router.get('/', validateApiKey, smcInsuranceController.getAllSmcInsurance);

export default router;
