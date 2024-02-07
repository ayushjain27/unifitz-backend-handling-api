import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import { EventService } from '../services/event.service';
import { body, validationResult, query } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import Logger from '../config/winston';
import { Response } from 'express';
import Request from '../types/request';
import { OfferService } from '../services';

@injectable()
export class OfferController {
  private offerService: OfferService;
  constructor(@inject(TYPES.OfferService) offerService: OfferService) {
    this.offerService = offerService;
  }

  createOffer = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const offerRequest = req.body;
    Logger.info(
      '<Controller>:<OfferController>:<Create offer controller initiated>'
    );
    try {
      const result = await this.offerService.create(offerRequest);
      res.send({
        message: 'Offer Creation Successful',
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
    const { offerId } = req.body;
    Logger.info(
      '<Controller>:<OfferController>:<Upload Image request initiated>'
    );
    try {
      const result = await this.offerService.uploadImage(offerId, req);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllOffer = async (req: Request, res: Response) => {
    const {
      coordinates,
      category,
      state,
      city,
      offerType,
      storeId,
      customerId
    }: {
      coordinates: number[];
      category: string;
      state: string;
      city: string;
      offerType: string;
      storeId: string;
      customerId: string;
    } = req.body;
    let { subCategory } = req.body;
    if (subCategory) {
      subCategory = (subCategory as string).split(',');
    } else {
      subCategory = [];
    }
    Logger.info(
      '<Controller>:<OfferController>:<Get All request controller initiated>'
    );
    try {
      const result = await this.offerService.getAll(
        coordinates,
        subCategory,
        category,
        state,
        city,
        offerType,
        storeId,
        customerId
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getOfferById = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<OfferController>:<Getting offer ID>');
    try {
      const offerId = req.query.offerId;
      const result = await this.offerService.getOfferById(offerId as string);
      Logger.info('<Controller>:<OfferController>:<get successfully>');
      res.send({
        message: 'Offer obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateOffer = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<OfferController>:<Update Offer Status>');
    // Validate the request body
    const offerId = req.params.offerId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    try {
      const result = await this.offerService.updateOfferDetails(
        req.body,
        offerId
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  deleteOffer = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<OfferController>:<Delete Offer>');
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    try {
      const result = await this.offerService.deleteOffer(req.body);
      res.send({
        message: 'Offer deleted successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateOfferStatus = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<OfferController>:<Update Offer Status>');
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    try {
      const result = await this.offerService.updateOfferStatus(req.body);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
}
