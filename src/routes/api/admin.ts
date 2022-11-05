import { roleAuth } from './../middleware/rbac';
import { Router } from 'express';
import { ACL } from '../../enum/rbac.enum';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { AdminController } from '../../controllers';

const router: Router = Router();
const adminController = container.get<AdminController>(TYPES.AdminController);
// @route   POST api/admin
// @desc    Register admin given their userName and password, returns the token upon successful registration
// @access  Private
router.post(
  '/',
  roleAuth(ACL.ADMIN_USER_CREATE),
  adminController.validate('createUser'),
  adminController.create
);
router.post('/login', adminController.login);

router.get('/user', roleAuth(ACL.STORE_CREATE), adminController.getUser);

router.post(
  '/update-password',
  roleAuth(ACL.STORE_CREATE),
  adminController.updatePassword
);

export default router;
