// import { CategoryController } from './../../controllers/category.controller';
import { Router } from 'express';
// import multer from 'multer';
// import { ACL } from '../../enum/rbac.enum';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { CategoryController } from '../../controllers';
// import { roleAuth } from '../middleware/rbac';

// const storage = multer.memoryStorage();
// const uploadFile = multer({ storage: storage });

const router: Router = Router();
const categoryController = container.get<CategoryController>(
  TYPES.CategoryController
);

// upload banner API
// router.get('/category', categoryController.getCategoryList);
router.get('/category/All', categoryController.getAllCategories);
export default router;
