import multer from 'multer';

import { roleAuth } from './../middleware/rbac';
import { Router } from 'express';
import { ACL } from '../../enum/rbac.enum';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { AdminController } from '../../controllers';
import { validationHandler } from '../middleware/auth';

const storage = multer.memoryStorage();
const uploadFiles = multer({ storage: storage });

const router: Router = Router();
const adminController = container.get<AdminController>(TYPES.AdminController);
// @route   POST api/admin
// @desc    Register admin given their userName and password, returns the token upon successful registration
// @access  Private
router.post(
  '/',
  // roleAuth(ACL.ADMIN_USER_CREATE),
  adminController.validate('createUser'),
  adminController.create
);

router.post(
  '/uploadDocuments',
  uploadFiles.array('files'),
  // roleAuth(ACL.ADMIN_USER_CREATE),
  adminController.uploadDocuments
);

router.put(
  '/:userName',
  // roleAuth(ACL.ADMIN_USER_CREATE),
  adminController.validate('updateUser'),
  adminController.updateUser
);

router.get(
  '/getAll',
  //  roleAuth(ACL.ADMIN_USER_CREATE),
  adminController.getAll
);

router.get(
  '/getB2BDistributors',
  //  roleAuth(ACL.ADMIN_USER_CREATE),
  adminController.getB2BDistributors
);

router.post(
  '/uploadProfileImage',
  uploadFiles.single('file'),
  roleAuth(ACL.STORE_CREATE),
  adminController.validate('uploadProfile'),
  adminController.uploadProfileImage
);

router.post('/login', adminController.login);

router.get('/user', roleAuth(ACL.STORE_CREATE), adminController.getUser);

router.get(
  '/getUserByUserName',
  roleAuth(ACL.STORE_CREATE),
  adminController.getUserByUserName
);

router.post(
  '/updateUserStatus',
  roleAuth(ACL.ADMIN_USER_CREATE),
  adminController.validate('updateUserStatus'),
  adminController.updateUserStatus
);

router.post(
  '/updateUserAccessStatus',
  // roleAuth(ACL.ADMIN_USER_CREATE),
  adminController.updateUserAccessStatus
);

router.post(
  '/update-password',
  roleAuth(ACL.STORE_CREATE),
  adminController.updatePassword
);

router.post(
  '/initiate-b2bPartners-verify',
  roleAuth(ACL.STORE_CREATE),
  adminController.validate('initiateB2BPartnersVerification'),
  validationHandler(),
  adminController.initiateB2BPartnersVerification
);

router.post(
  '/search_paginated',
  // roleAuth(ACL.STORE_GET_ALL),
  adminController.searchDistributorsPartnersPaginated
);

router.delete(
  '/:oemId',
  adminController.deleteOemUser
);

router.post('/review', adminController.addStoreReview);

router.get('/:userName/ratings', adminController.getOverallStoreRatings);

router.get('/:userName/reviews', adminController.getStoreReviews);

router.get(
  '/userName',
  // roleAuth(ACL.STORE_GET_SINGLE),
  adminController.getDistributorPartnersByuserName
);

router.post('/createContactUs', adminController.createContactUs);

router.get('/resetPassword', adminController.resetPassword);

router.post('/sellerRegister', adminController.sellerRegister);

router.post(
  '/videoUpload/create',
  roleAuth(ACL.STORE_CREATE),
  adminController.createVideo
);
router.post(
  '/videoUpload',
  uploadFiles.array('files'),
  adminController.updateMarketingVideos
);
router.get(
  '/videoUpload/paginated',
  roleAuth(ACL.STORE_CREATE),
  adminController.getPaginatedAll
);
router.get(
  '/videoUpload/count',
  roleAuth(ACL.STORE_CREATE),
  adminController.getAllCount
);
router.delete(
  '/videoUpload/delete/:marketingId',
  adminController.deleteVideoUpload
);

router.get('/videoUpload/getById', adminController.getVideoUploadDetails);
router.put('/videoUpload/:marketingId', adminController.updateVideoUpload);

router.post('/videoUpload/getAllPaginated', adminController.getAllPaginated);

router.get(
  '/totalVideoUploadCount',
  roleAuth(ACL.STORE_CREATE),
  adminController.getVideoUploadCount
);

router.post(
  '/updateVideoStatus',
  roleAuth(ACL.STORE_CREATE),
  adminController.updateVideoStatus
);

router.post(
  '/inviteRetailer/send',
  roleAuth(ACL.STORE_CREATE),
  adminController.createInviteRetailer
);

router.get(
  '/inviteRetailer/all',
  roleAuth(ACL.STORE_CREATE),
  adminController.getInviteRetailer
);

router.get(
  '/phone-clicks-per-user',
  roleAuth(ACL.STORE_CREATE),
  adminController.getPhoneClicksPerUser
);

export default router;
