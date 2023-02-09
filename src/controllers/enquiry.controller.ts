import { Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Request from '../types/request';
import { EnquiryService } from './../services/enquiry.service';

@injectable()
export class EnquiryController {
  private enquiryService: EnquiryService;
  constructor(@inject(TYPES.EnquiryService) enquiryService: EnquiryService) {
    this.enquiryService = enquiryService;
  }

  create = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const request = req.body;
    Logger.info(
      '<Controller>:<EnquiryController>:<Create enquiry controller initiated>'
    );
    try {
      const result = await this.enquiryService.create(request);
      res.send({
        message: 'Enquiry Creation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAll = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<EnquiryController>:<Get All request controller initiated>'
    );
    try {
      const result = await this.enquiryService.getAll();
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getById = async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Enquiry Id is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<EnquiryController>:<Get by id controller initiated>'
    );
    try {
      const result = await this.enquiryService.getById(id);
      res.send({
        message: 'Enquiry Fetch Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  update = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const id = req.params.id;
    if (!id) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Enquiry Id is not present' } });
      return;
    }
    const reqPayload = req.body;
    Logger.info(
      '<Controller>:<EnquiryController>:<Update product controller initiated>'
    );

    try {
      const result = await this.enquiryService.update(reqPayload, id);
      res.send({
        message: 'Enquiry Update Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  delete = async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Enquiry Id is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<EnquiryController>:<Delete controller initiated>'
    );

    try {
      const result = await this.enquiryService.delete(id);
      res.send({
        message: 'Enquiry Deleted Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  validate = (method: string) => {
    switch (method) {
      case 'create':
        return [
          body('enquiryType', 'Enquiry Type does not exist')
            .exists()
            .isString(),
          body('enquiryFormData', 'Form Data does not exist').exists()
        ];
    }
  };
}
