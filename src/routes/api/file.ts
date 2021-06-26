import { Router } from 'express';
import HttpStatusCodes from 'http-status-codes';
import multer from 'multer';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import Logger from '../../config/winston';
import { ACL } from '../../enum/rbac.enum';
import { S3Service } from '../../services';
import { roleAuth } from '../middleware/rbac';

const router: Router = Router();
const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });
const s3Client = container.get<S3Service>(TYPES.S3Service);
// @route   POST api/file
// @access  Private
router.post(
  '/upload',
  uploadFile.single('file'),
  roleAuth(ACL.FILE_UPLOAD),
  async (req, res) => {
    const file = req.file;
    Logger.info('---------------------');
    Logger.info('req body is', req.body, req.file);
    Logger.info('---------------------');
    Logger.info('<Route>:<File Route>:<Upload file request initiated>');
    try {
      const result = await s3Client.uploadFile(
        JSON.stringify(new Date().getMilliseconds()),
        file.originalname,
        file.buffer
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  }
);

export default router;
