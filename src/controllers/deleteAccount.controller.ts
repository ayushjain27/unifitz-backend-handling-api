import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { DeleteAccountService } from './../services/deleteAccount.service';
import fs from 'fs';
import { AccountDeleteRequest } from '../interfaces/accountDeleteRequest.interface';

@injectable()
export class DeleteAccountController {
  private deleteAccountService: DeleteAccountService;
  constructor(
    @inject(TYPES.DeleteAccountService)
    deleteAccountService: DeleteAccountService
  ) {
    this.deleteAccountService = deleteAccountService;
  }

  signup = async (req: any, res: Response) => {
  try {
      const request  = req.body;
      const result = await this.deleteAccountService.signup(request);
      res.send({
        message: 'Profile Creation Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  login = async (req: any, res: Response) => {
  try {
      const request  = req.body;
      const result = await this.deleteAccountService.login(request);
      res.send({
        message: 'Profile Login Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  createStudioInfo = async (req: any, res: Response) => {
    try {
      const request  = req.body;
      const result = await this.deleteAccountService.createStudioIndo(request);
      res.send({
        message: 'Creation Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getAllStudioInfo = async (req: any, res: Response) => {
    try {
      const userName  = req.query.userName;
      const result = await this.deleteAccountService.getAllStudioInfo(userName);
      res.send({
        message: 'Get all Studio Info Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  createHeroContent = async (req: any, res: Response) => {
    try {
      const request  = req.body;
      const result = await this.deleteAccountService.createHeroContent(request);
      res.send({
        message: 'Creation Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getAllHeroContent = async (req: any, res: Response) => {
    try {
      const userName  = req.query.userName;
      const result = await this.deleteAccountService.getAllHeroContent(userName);
      res.send({
        message: 'Get all Studio Info Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  aboutContent = async (req: any, res: Response) => {
    try {
      const request  = req.body;
      const result = await this.deleteAccountService.aboutContent(request);
      res.send({
        message: 'Creation Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getAllAboutContent = async (req: any, res: Response) => {
    try {
      const userName  = req.query.userName;
      const result = await this.deleteAccountService.getAllAboutContent(userName);
      res.send({
        message: 'Get all Studio Info Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  benefits = async (req: any, res: Response) => {
    try {
      const request  = req.body;
      const result = await this.deleteAccountService.benefits(request);
      res.send({
        message: 'Creation Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getAllBenefits = async (req: any, res: Response) => {
    try {
      const userName  = req.query.userName;
      const result = await this.deleteAccountService.getAllBenefits(userName);
      res.send({
        message: 'Get all Studio Info Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  classes = async (req: any, res: Response) => {
    try {
      const request  = req.body;
      const result = await this.deleteAccountService.classes(request);
      res.send({
        message: 'Creation Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getAllClasses = async (req: any, res: Response) => {
    try {
      const userName  = req.query.userName;
      const result = await this.deleteAccountService.getAllClasses(userName);
      res.send({
        message: 'Get all Studio Info Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  instructors = async (req: any, res: Response) => {
    try {
      const request  = req.body;
      const result = await this.deleteAccountService.instructors(request);
      res.send({
        message: 'Creation Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getAllInstructors = async (req: any, res: Response) => {
    try {
      const userName  = req.query.userName;
      const result = await this.deleteAccountService.getAllInstructors(userName);
      res.send({
        message: 'Get all instructors Info Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  pricingPlans = async (req: any, res: Response) => {
    try {
      const request  = req.body;
      const result = await this.deleteAccountService.pricingPlans(request);
      res.send({
        message: 'Creation Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getAllPricingPlans = async (req: any, res: Response) => {
    try {
      const userName  = req.query.userName;
      const result = await this.deleteAccountService.getAllPricingPlans(userName);
      res.send({
        message: 'Get all pricing plans Info Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  testimonials = async (req: any, res: Response) => {
    try {
      const request  = req.body;
      const result = await this.deleteAccountService.testimonials(request);
      res.send({
        message: 'Creation Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getAllTestimonials = async (req: any, res: Response) => {
    try {
      const userName  = req.query.userName;
      const result = await this.deleteAccountService.getAllTestimonials(userName);
      res.send({
        message: 'Get all testimonials Info Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  uploadImage = async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'No file uploaded' });
      }
       // Get the path to the uploaded file
       const imagePath = req.file.path;
       const options = req.body.options ? JSON.parse(req.body.options) : {};
       const result = await this.deleteAccountService.uploadImage(imagePath, req.body.type, req.body.id);
       console.log(result,"sd;lmekm")
       fs.unlinkSync(imagePath);
      res.send({
        message: 'Creation Request Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };
}
