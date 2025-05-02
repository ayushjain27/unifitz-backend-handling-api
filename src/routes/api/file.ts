import { Router } from 'express';
import HttpStatusCodes from 'http-status-codes';
import multer from 'multer';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import Logger from '../../config/winston';
import { ACL } from '../../enum/rbac.enum';
import { S3Service } from '../../services';
import { roleAuth } from '../middleware/rbac';
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import { buffer } from 'stream/consumers';

const router: Router = Router();
const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });
const s3Client = container.get<S3Service>(TYPES.S3Service);
const unzipper: any = require('unzipper');
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

router.post(
  '/upload-any',
  uploadFile.array('files', 10), // Accept up to 10 files
  roleAuth(ACL.STORE_CREATE),
  async (req: any, res: any) => {
    const files = req.files;
    const uploadedLinks = [];

    if (!files || files.length === 0) {
      return res.status(HttpStatusCodes.BAD_REQUEST).send('No files uploaded');
    }

    console.log(files, 'lefmkmrk');

    try {
      // Upload all files and collect links
      for (const file of files) {
        if (file.mimetype === 'application/zip') {
          const directory = await unzipper.Open.buffer(file.buffer);

          for (const entry of directory.files) {
            if (
              !entry.path.endsWith('/') &&
              !entry.path.startsWith('__MACOSX/') &&
              !entry.path.includes('.DS_Store') &&
              !entry.path.startsWith('.')
            ) {
              const imageExtensions = [
                '.jpg',
                '.jpeg',
                '.png',
                '.gif',
                '.bmp',
                '.webp',
                '.svg'
              ];
              const extension = entry.path
                .substring(entry.path.lastIndexOf('.'))
                .toLowerCase();
              if (imageExtensions.includes(extension)) {
                const innerBuffer = await entry.buffer();
                const filename = `${Date.now()}-${entry.path.replace(/\//g, '-')}`;
                const result = await s3Client.uploadFile(
                  filename,
                  entry.path,
                  innerBuffer
                );
                uploadedLinks.push({ link: result });
              }
            }
          }
        } else {
          const filename = `${Date.now()}-${file.originalname}`;
          const result = await s3Client.uploadFile(
            filename,
            file.originalname,
            file.buffer
          );
          uploadedLinks.push({ link: result });
        }
      }

      console.log(uploadedLinks, 'uploadedLinks');
      // Create Excel file with the links using ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Uploaded Links');

      // Set up the header row
      worksheet.columns = [{ header: 'Link', key: 'link', width: 60 }];

      // Add the uploaded links as rows
      uploadedLinks.forEach((linkData) => {
        // Parse the JSON if it's a string, or use directly if it's an object
        const linkInfo = typeof linkData.link === 'string' ? JSON.parse(linkData.link) : linkData.link;
        worksheet.addRow({ link: linkInfo.url }); // Only add the URL
      });

      // Create a buffer with the generated Excel file
      const excelBuffer = await workbook.xlsx.writeBuffer();

      // Set the appropriate headers for the download response
      const result = Buffer.from(excelBuffer)
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=uploaded_links.xlsx'
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      // Send the Excel file as a response
      res.status(200).send(result);
    } catch (error) {
      Logger.error('Upload failed:', error);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .send('File upload failed');
    }
  }
);

export default router;
