import { Router } from 'express';
import { ACL } from '../../enum/rbac.enum';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { CustomerController } from '../../controllers';
import { roleAuth } from '../middleware/rbac';

const router: Router = Router();
const customerController = container.get<CustomerController>(
  TYPES.CustomerController
);
// @route   POST api/customer
// @access  Private
router.post('/', roleAuth(ACL.CUSTOMER_CREATE), customerController.create);
router.put(
  '/:customerId',
  roleAuth(ACL.CUSTOMER_CREATE),
  customerController.update
);

export default router;
