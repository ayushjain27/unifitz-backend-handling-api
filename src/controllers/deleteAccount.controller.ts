import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { DeleteAccountService } from './../services/deleteAccount.service';
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

  uploadImage = async (req: any, res: Response) => {
    try {
      const request  = req.body;
      const result = await this.deleteAccountService.uploadImage(req.body.imagePath, req.body.options);
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
