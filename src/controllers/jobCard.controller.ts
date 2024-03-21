import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Request from '../types/request';
import { JobCardService } from './../services/jobCard.service';

@injectable()
export class JobCardController {
  private jobCardService: JobCardService;
  constructor(@inject(TYPES.JobCardService) jobCardService: JobCardService) {
    this.jobCardService = jobCardService;
  }

  createJobCard = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const jobCardRequest = req.body;
    Logger.info(
      '<Controller>:<JobCardController>:<Create jobcard controller initiated>'
    );
    try {
      const result = await this.jobCardService.create(jobCardRequest, req);
      res.send({
        message: 'Job Card Creation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  createLineItems = async (req: Request, res: Response) => {
    const { jobCardId, lineItems } = req.body;
    Logger.info(
      '<Controller>:<JobCardController>:<Upload Store Customer request initiated>'
    );
    try {
      const result = await this.jobCardService.createStoreLineItems (
        jobCardId,
        lineItems
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getJobCardsByStoreId = async (req: Request, res: Response) => {
    const storeId = req.params.storeId;

    if (!storeId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Store Id is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<JobCardController>:<Get store job Card by store id controller initiated>'
    );
    try {
      const result = await this.jobCardService.getStoreJobCardsByStoreId(storeId);
      res.send({
        message: 'Store Job Card Fetch Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getJobCardById = async (req: Request, res: Response) => {
    const jobCardId = req.query.id;

    if (!jobCardId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Job Card with same id is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<JobCardController>:<Get job card by id controller initiated>'
    );
    try {
      const result = await this.jobCardService.getJobCardById(jobCardId as string);
      res.send({
        message: 'Job Card Fetch Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateJobCard = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const jobCardId = req.params.jobCardId;
    if (!jobCardId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'job Card Id is not present' } });
      return;
    }
    const jobCardRequest = req.body;
    Logger.info(
      '<Controller>:<JobCardController>:<Update job card controller initiated>'
    );

    try {
      const result = await this.jobCardService.updateJobCard(jobCardRequest, jobCardId);
      res.send({
        message: 'Job Card Update Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  validate = (method: string) => {
    switch (method) {
      case 'createJobCard':
        return [
          body('storeId', 'Store Id does not exist').exists().isString()];
    }
  };
}
