// import { CategoryController } from './../../controllers/category.controller';
import { Router } from 'express';
import multer from 'multer';
// import { ACL } from '../../enum/rbac.enum';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { CategoryController } from '../../controllers';
// import { roleAuth } from '../middleware/rbac';

const storage = multer.memoryStorage();
const uploadFiles = multer({ storage: storage });

const router: Router = Router();
const categoryController = container.get<CategoryController>(
  TYPES.CategoryController
);

router.get('/getAll', categoryController.getAllCategories);
router.get('/paginated/getAll', categoryController.getAllPaginatedCategories);
router.get('/getAllRootCategory', categoryController.getAllRootCategories);
router.delete('/delete/:categoryId', categoryController.deleteCategory);
router.post('/create', categoryController.createCategories);
router.put('/update', categoryController.updateCategories);
router.get('/getAllBrand', categoryController.getBrands);
router.get('/:categoryId', categoryController.getCategoryByCategoryId);
router.post(
  '/uploadCategoryImages',
  uploadFiles.array('files'),
  categoryController.uploadCategoryImages
);

export default router;
