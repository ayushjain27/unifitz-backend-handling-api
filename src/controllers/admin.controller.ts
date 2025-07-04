/* eslint-disable no-console */
import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { AdminRole, IAdmin } from '../models/Admin';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { AdminService } from '../services/admin.service';
import Request from '../types/request';
import {
  DistributedPartnersReviewRequest,
  VerifyB2BPartnersRequest
} from '../interfaces';

@injectable()
export class AdminController {
  private adminService: AdminService;
  constructor(@inject(TYPES.AdminService) adminService: AdminService) {
    this.adminService = adminService;
  }
  create = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }

    // const { userName, password } = req.body;

    Logger.info(
      '<Controller>:<AdminController>:<Admin creation controller initiated>'
    );
    try {
      const result = await this.adminService.create(req.body);

      res.json({
        message: 'Admin Creation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  uploadDocuments = async (req: Request, res: Response) => {
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const { userId } = req.body;
    Logger.info(
      '<Controller>:<AdminController>:<Upload Vehicle request initiated>'
    );
    try {
      const result = await this.adminService.uploadDocuments(userId, req);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateUser = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const userName = req.params.userName;
    if (!userName) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Username is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<AdminController>:<Admin updating controller initiated>'
    );
    try {
      const result = await this.adminService.updateUser(req.body, userName);
      res.send({
        message: 'User Update Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  uploadProfileImage = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    Logger.info(
      '<Controller>:<AdminController>:<Admin uploading profile picture of the admin user>'
    );
    try {
      const { userId } = req.body;

      const result = await this.adminService.uploadAdminImage(userId, req);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  login = async (req: Request, res: Response) => {
    const { userName, password } = req.body;
    Logger.info(
      '<Controller>:<AdminController>:<Onboarding request controller initiated>'
    );
    try {
      const result = await this.adminService.login(userName, password);
      Logger.info('<Controller>:<AdminController>:<Token created succesfully>');
      res.send({
        message: 'Admin Login Successful',
        ...result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAll = async (req: Request, res: Response) => {
    const roleBase = req.query.roleBase;
    const oemId = req.query.oemId;
    const createdOemUser = req.query.createdOemUser;

    Logger.info(
      '<Controller>:<AdminController>:<Get All request controller initiated>'
    );
    try {
      const role = req?.role;
      // if (role !== AdminRole.ADMIN) {
      //   throw new Error('User not allowed');
      // }
      const result = await this.adminService.getAll(
        roleBase as string,
        oemId as string,
        createdOemUser as string
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getB2BDistributors = async (req: Request, res: Response) => {
    const roleBase = req.query.roleBase;
    const oemId = req.query.oemId;
    const createdOemUser = req.query.createdOemUser;
    const employeeId = req.query.employeeId;

    Logger.info(
      '<Controller>:<AdminController>:<Get All request controller initiated>'
    );
    try {
      const role = req?.role;
      // if (role !== AdminRole.ADMIN) {
      //   throw new Error('User not allowed');
      // }
      const result = await this.adminService.getB2BDistributors(
        roleBase as string,
        oemId as string,
        createdOemUser as string,
        employeeId as string
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getUser = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<AdminController>:<Getting user by user name>');
    try {
      const userName = req.userId;
      const result = await this.adminService.getAdminUserByUserName(userName);
      Logger.info('<Controller>:<AdminController>:<User got successfully>');
      res.send({
        message: 'User obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getUserByUserName = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<AdminController>:<Getting user by user name>');
    try {
      const userName = req.query.userName;
      const result = await this.adminService.getAdminUserByUserName(
        userName as string
      );
      Logger.info('<Controller>:<AdminController>:<User got successfully>');
      res.send({
        message: 'User obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updatePassword = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>: <AdminController>: Updating password for the user'
    );

    try {
      const userName = req?.userId;
      const password = req?.body?.password;
      const result = await this.adminService.updatePassword(userName, password);
      Logger.info(
        '<Controller>:<AdminController>:<Password updated successfully>'
      );
      res.send({
        message: 'Password updated successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateUserStatus = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<AdminController>:<Update User Status>');
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    try {
      const result = await this.adminService.updateUserStatus(req.body);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateUserAccessStatus = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<AdminController>:<Update User Access Status>');
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    try {
      const result = await this.adminService.updateUserAccessStatus(req.body);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  initiateB2BPartnersVerification = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<AdminController>:<Verify B2B Partners Initatiate>'
    );
    const payload = req.body as VerifyB2BPartnersRequest;
    const role = req?.role;
    try {
      const result = await this.adminService.initiateB2BPartnersVerification(
        payload,
        role
      );
      res.send({
        message: 'B2B Partners Verification Initatiation Successful',
        result
      });
      // }
    } catch (err) {
      if (err.status && err.data) {
        res
          .status(err.status)
          .json({ success: err.data?.success, message: err.data?.message });
      } else {
        Logger.error(err.message);
        res
          .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: err.message });
      }
    }
  };

  searchDistributorsPartnersPaginated = async (req: Request, res: Response) => {
    const {
      pageNo,
      pageSize,
      storeId
    }: {
      pageNo: number;
      pageSize: number;
      storeId: string;
    } = req.body;
    Logger.info(
      '<Controller>:<AdminController>:<Search and Filter Distributors partners pagination request controller initiated>'
    );
    try {
      Logger.info(
        '<Controller>:<AdminController>:<Search and Filter Distributors partners pagination request controller initiated>'
      );
      const result: IAdmin[] = await this.adminService.searchAndFilterPaginated(
        {
          pageNo,
          pageSize,
          storeId
        }
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  deleteOemUser = async (req: Request, res: Response) => {
    const oemId = req.params.oemId;
    Logger.info(
      '<Controller>:<AdminController>:<Delete request controller initiated>'
    );
    try {
      let result;
      if (!oemId) {
        throw new Error('oemId required');
      } else {
        result = await this.adminService.deleteOemUser(
          oemId as string
        );
      }
      res.send({
        message: 'deleted successfully'
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  addStoreReview = async (req: Request, res: Response) => {
    const storeReview: DistributedPartnersReviewRequest = req.body;
    Logger.info('<Controller>:<StoreController>:<Create store ratings>');
    try {
      const result = await this.adminService.addReview(storeReview);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getOverallStoreRatings = async (req: Request, res: Response) => {
    const userName = req.params.userName;
    Logger.info(
      '<Controller>:<AdminController>:<Get distributor partners ratings>'
    );
    try {
      const result = await this.adminService.getOverallRatings(userName);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getStoreReviews = async (req: Request, res: Response) => {
    const userName = req.params.userName;
    const pageSize = Number(req.query.pageSize) || 15;
    const pageNo = Number(req.query.pageNo) || 0;
    Logger.info(
      '<Controller>:<AdminController>:<Get disributors partners reviews>'
    );
    try {
      const result = await this.adminService.getReviews(
        userName,
        pageNo,
        pageSize
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getDistributorPartnersByuserName = async (req: Request, res: Response) => {
    const userName = req.query.userName;
    Logger.info(
      '<Controller>:<AdminController>:<Get distributed partners by userName request controller initiated>'
    );
    try {
      let result: IAdmin[];
      if (!userName) {
        throw new Error('userName required');
      } else {
        result = await this.adminService.getById({ userName } as {
          userName: string;
        });
      }
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  createContactUs = async (req: Request, res: Response) => {
    const contactDetail: any = req.body;
    Logger.info('<Controller>:<AdminController>:<Createcontact us>');
    try {
      const result = await this.adminService.createContactUs(contactDetail);
      res.send({
        message: 'Successfully message Sended !',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    const userName = req.query.userName;
    Logger.info(
      '<Controller>:<AdminController>:<Reset admin partners password by request controller initiated>'
    );
    try {
      const result = await this.adminService.resetPassword(userName as string);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  sellerRegister = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const interestRequest = req.body;
    Logger.info(
      '<Controller>:<AdminController>:<Add seller request initiated>'
    );
    try {
      const result = await this.adminService.sellerRegister(interestRequest);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  createVideo = async (req: Request, res: Response) => {
    const { oemId } = req.body;
    const role = req?.role;
    const userName = req?.userId;
    try {
      Logger.info(
        '<Controller>:<AdminController>:<create Video request controller initiated>'
      );
      const result = await this.adminService.createVideo(
        req.body,
        oemId,
        role,
        userName
      );
      res.send({
        result,
        created: 'successful'
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateMarketingVideos = async (req: Request, res: Response) => {
    const { fileID } = req.body;
    Logger.info(
      '<Controller>:<AdminController>:<Upload Video request initiated>'
    );
    try {
      const result = await this.adminService.updateMarketingVideos(fileID, req);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getPaginatedAll = async (req: Request, res: Response) => {
    const userName = req.userId;
    const role = req?.role;
    Logger.info(
      '<Controller>:<AdminController>:<Get all video request controller initiated>'
    );
    const pageNo = Number(req.query.pageNo);
    const pageSize = Number(req.query.pageSize || 10);
    const searchQuery = req.query.searchQuery;
    const state = req.query.state;
    const city = req.query.city;
    const selectType = req.query.selectType;
    const oemId = req?.query?.oemId;
    const employeeId = req?.query?.employeeId;
    const profileStatus = req?.query?.profileStatus;

    try {
      const result = await this.adminService.getPaginatedAll(
        pageNo,
        pageSize,
        searchQuery as string,
        state as string,
        city as string,
        selectType as string,
        userName,
        role,
        oemId as string,
        employeeId as string,
        profileStatus as string
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllCount = async (req: Request, res: Response) => {
    const userName = req.userId;
    const role = req?.role;
    Logger.info(
      '<Controller>:<AdminController>:<Get all video request controller initiated>'
    );
    const searchQuery = req.query.searchQuery;
    const state = req.query.state;
    const city = req.query.city;
    const selectType = req.query.selectType;
    const oemId = req?.query?.oemId;
    const employeeId = req?.query?.employeeId;
    const profileStatus = req?.query?.profileStatus;

    try {
      const result = await this.adminService.getAllCount(
        searchQuery as string,
        state as string,
        city as string,
        selectType as string,
        userName,
        role,
        oemId as string,
        employeeId as string,
        profileStatus as string
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  deleteVideoUpload = async (req: Request, res: Response) => {
    const marketingId = req.params.marketingId;
    Logger.info(
      '<Controller>:<AdminController>:<Delete marketing request controller initiated>'
    );
    try {
      let result;
      if (!marketingId) {
        throw new Error('marketingId required');
      } else {
        result = await this.adminService.deleteVideoUpload(
          marketingId as string
        );
      }
      res.send({
        message: 'deleted successfully'
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getVideoUploadDetails = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<AdminController>:<Getting ID>');
    try {
      const marketingId = req.query.marketingId;
      const result = await this.adminService.getVideoUploadDetails(
        marketingId as string
      );
      Logger.info('<Controller>:<AdminController>:<get successfully>');
      res.send({
        message: 'Marketing obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
  updateVideoUpload = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<AdminController>:<Update Marketing Status>');
    // Validate the request body
    const marketingId = req.params.marketingId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    }
    try {
      const result = await this.adminService.updateVideoUpload(
        req.body,
        marketingId
      );
      res.send({
        message: 'Marketing updated successfully'
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllPaginated = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<AdminController>:<Get all video request controller initiated>'
    );
    const {
      pageNo,
      pageSize,
      state,
      city,
      category,
      subCategory,
      brand,
      storeId,
      oemUserName,
      platform,
      coordinates
    } = req.body;
    try {
      const result = await this.adminService.getAllPaginated(
        pageNo,
        pageSize,
        state as string,
        city as string,
        category as string,
        subCategory as string,
        brand as string,
        storeId as string,
        oemUserName as string,
        platform as string,
        coordinates
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getVideoUploadCount = async (req: Request, res: Response) => {
    const userName = req.userId;
    const role = req?.role;
    const oemId = req?.query?.oemId;
    const employeeId = req?.query?.employeeId;
    const searchQuery = req.query.searchQuery;
    const state = req.query.state;
    const city = req.query.city;
    const selectType = req.query.selectType;

    try {
      Logger.info(
        '<Controller>:<AdminController>:<Admin request controller initiated>'
      );
      const result = await this.adminService.getVideoUploadCount(
        userName,
        role,
        oemId as string,
        searchQuery as string,
        state as string,
        city as string,
        employeeId as string,
        selectType as string
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  updateVideoStatus = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<AdminController>:<Update video Status>');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    }
    try {
      const result = await this.adminService.updateVideoStatus(req.body);
      res.send({
        message: 'Video Status is Updated',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  createInviteRetailer = async (req: Request, res: Response) => {
    try {
      Logger.info(
        '<Controller>:<adminService>:<request controller initiated>'
      );
      const userName = req?.userId;
      const role = req?.role;
      const result =
        await this.adminService.createInviteRetailer(req.body, userName, role);
      res.send({
        result,
        created: 'successful'
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getInviteRetailer = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<adminService>:<Getting ID>');
    try {
      const userName = req?.userId;
      const role = req?.role;
      const result =
        await this.adminService.getInviteRetailer(
          userName,
          role
        );
      res.send({
        message: 'Details obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getPhoneClicksPerUser = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<adminService>:<Getting Phone Number Clicks Per User>');
    try {
      const result =
        await this.adminService.getPhoneClicksPerUser(req.query);
      res.send({
        message: 'Details obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  validate = (method: string) => {
    switch (method) {
      case 'createUser':
        return [
          body('ownerName', 'Owner Name does not exist').exists().isString(),

          body('businessName', 'Business Name does not exist')
            .exists()
            .isString()
        ];
      case 'updateUser':
        return [
          body('ownerName', 'Owner Name does not exist').exists().isString(),

          body('businessName', 'Business Name does not exist')
            .exists()
            .isString()
        ];

      case 'uploadProfile':
        return [body('userId', 'User name does not exist').exists().isString()];

      case 'updateUserStatus':
        return [
          body('userName', 'User Name does not exist').exists().isString(),
          body('status', 'Status does not exist').exists().isString()
        ];

      case 'initiateB2BPartnersVerification':
        return [
          body('documentNo', 'Document Number does not exist')
            .exists()
            .isString()
        ];
    }
  };
}
