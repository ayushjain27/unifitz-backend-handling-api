import { Router } from 'express';
import { ACL } from '../../enum/rbac.enum';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { AdvertisementController } from '../../controllers';
import { roleAuth } from '../middleware/rbac';

const router: Router = Router();

export default router;
