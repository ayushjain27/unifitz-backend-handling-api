import { Router } from 'express';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../middleware/rbac';
import { ACL } from '../../enum/rbac.enum';
import { SchoolOfAutoController } from '../../controllers';

const router: Router = Router();
const schoolOfAutoController = container.get<SchoolOfAutoController>(
  TYPES.SchoolOfAutoController
);

router.post('/', schoolOfAutoController.create);

router.get('/getAll', schoolOfAutoController.getAll);

router.get('/getById', schoolOfAutoController.getById);

router.put('/update/:schoolOfAutoId', schoolOfAutoController.update);

router.delete('/delete', schoolOfAutoController.delete);

router.post('/updateStatus', schoolOfAutoController.updateStatus);

export default router;
