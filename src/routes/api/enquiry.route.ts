import { Router } from 'express';
import { EnquiryController } from '../../controllers';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../../routes/middleware/rbac';
import { ACL } from '../../enum/rbac.enum';

const router: Router = Router();
const controller = container.get<EnquiryController>(TYPES.EnquiryController);

router.post(
  '/',
  roleAuth(ACL.STORE_CREATE),
  controller.validate('create'),
  controller.create
);

router.get('/getAll', roleAuth(ACL.ADMIN_USER_CREATE), controller.getAll);

router.put(
  '/:id',
  roleAuth(ACL.STORE_CREATE),
  controller.validate('create'),
  controller.update
);

router.delete('/:id', roleAuth(ACL.STORE_CREATE), controller.delete);

export default router;
