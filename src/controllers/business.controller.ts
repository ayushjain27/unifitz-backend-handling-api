import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import { BusinessService } from '../services/business.service';
import { body, validationResult, query } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import Logger from '../config/winston';
import { Response } from 'express';
import Request from '../types/request';

@injectable()
export class BusinessController {
  private businessService: BusinessService;
  constructor(@inject(TYPES.BusinessService) businessService: BusinessService) {
    this.businessService = businessService;
  }

  createBusiness = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const businessRequest = req.body;
    Logger.info(
      '<Controller>:<BusinessController>:<Create business controller initiated>'
    );
    try {
      const result = await this.businessService.create(businessRequest);
      res.send({
        message: 'business Creation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  uploadImage = async (req: Request, res: Response) => {
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    const { businessId } = req.body;
    Logger.info(
      '<Controller>:<BusinessController>:<Upload Image request initiated>'
    );
    try {
      const result = await this.businessService.uploadImage(businessId, req);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllBusiness = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<BusinessController>:<Getting all business >');
    try {
      const result = await this.businessService.getAllBusiness();
      Logger.info('<Controller>:<BusinessController>:<get successfully>');
      res.send({
        message: 'business obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getBusinessById = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<BusinessController>:<Getting banner ID>');
    try {
      const businessId = req.query.businessId;
      const result = await this.businessService.getBusinessById(
        businessId as string
      );
      Logger.info('<Controller>:<BusinessController>:<get successfully>');
      res.send({
        message: 'business obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateBusiness = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<BusinessController>:<Update business Status>');
    // Validate the request body
    const businessId = req.params.businessId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    try {
      const result = await this.businessService.updateBusiness(
        req.body,
        businessId
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  deleteBusiness = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<BusinessController>:<Delete business>');
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    try {
      const result = await this.businessService.deleteBusiness(req.body);
      res.send({
        message: 'business deleted successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateBusinessStatus = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<BusinessController>:<Update business Status>');
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    try {
      const result = await this.businessService.updateBusinessStatus(req.body);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
}
