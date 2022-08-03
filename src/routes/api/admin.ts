import { Router } from 'express';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { AdminController } from '../../controllers';

const router: Router = Router();
const adminController = container.get<AdminController>(TYPES.AdminController);
// @route   POST api/admin
// @desc    Register admin given their userName and password, returns the token upon successful registration
// @access  Private
router.post('/', adminController.create);
router.post('/login', adminController.login);

export default router;
