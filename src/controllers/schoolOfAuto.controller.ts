import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import { SchoolOfAutoService } from '../services/schoolOfAuto.service';
import { body, validationResult, query } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import Logger from '../config/winston';
import { Response } from 'express';
import Request from '../types/request';

@injectable()
export class SchoolOfAutoController {
  private schoolOfAutoService: SchoolOfAutoService;
  constructor(
    @inject(TYPES.SchoolOfAutoService) schoolOfAutoService: SchoolOfAutoService
  ) {
    this.schoolOfAutoService = schoolOfAutoService;
  }

  create = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const businessRequest = req.body;
    Logger.info(
      '<Controller>:<SchoolOfAutoController>:<Create school auto controller initiated>'
    );
    try {
      const result = await this.schoolOfAutoService.create(businessRequest);
      res.send({
        message: 'Creation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  // uploadImage = async (req: Request, res: Response) => {
  //   const errors = validationResult(req);
  //   if (!errors.isEmpty()) {
  //     return res
  //       .status(HttpStatusCodes.BAD_REQUEST)
  //       .json({ errors: errors.array() });
  //   }
  //   const { schoolOfAutoId } = req.body;
  //   Logger.info(
  //     '<Controller>:<SchoolOfAutoController>:<Upload Image request initiated>'
  //   );
  //   try {
  //     const result = await this.schoolOfAutoService.uploadImage(schoolOfAutoId, req);
  //     res.send({
  //       result
  //     });
  //   } catch (err) {
  //     Logger.error(err.message);
  //     res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
  //   }
  // };

  getAll = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<SchoolOfAutoController>:<Getting all school of auto >'
    );
    try {
      const result = await this.schoolOfAutoService.getAll();
      Logger.info('<Controller>:<SchoolOfAutoController>:<get successfully>');
      res.send({
        message: 'School of auto obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getById = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<SchoolOfAutoController>:<Getting by ID>');
    try {
      const schoolOfAutoId = req.query.schoolOfAutoId;
      const result = await this.schoolOfAutoService.getById(
        schoolOfAutoId as string
      );
      Logger.info('<Controller>:<SchoolOfAutoController>:<get successfully>');
      res.send({
        message: 'School of auto obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  update = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<SchoolOfAutoController>:<Update business Status>'
    );
    // Validate the request body
    const schoolOfAutoId = req.params.schoolOfAutoId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    try {
      const result = await this.schoolOfAutoService.update(
        req.body,
        schoolOfAutoId
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  delete = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<SchoolOfAutoController>:<Delete business>');
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    try {
      const result = await this.schoolOfAutoService.delete(req.body);
      res.send({
        message: 'School of auto deleted successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateStatus = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<SchoolOfAutoController>:<Update school of auto Status>'
    );
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    try {
      const result = await this.schoolOfAutoService.updateStatus(req.body);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
}
