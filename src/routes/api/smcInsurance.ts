import { Router } from 'express';
import { SmcInsuranceController } from '../../controllers';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { validateApiKey } from '../../utils/validataKey';

const router: Router = Router();
const smcInsuranceController = container.get<SmcInsuranceController>(
  TYPES.SmcInsuranceController
);

router.post('/', validateApiKey, smcInsuranceController.createSmcInsurance);

router.get('/', validateApiKey, smcInsuranceController.getAllSmcInsurance);

export default router;
