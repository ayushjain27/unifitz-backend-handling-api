import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import { EventService } from '../services/event.service';
import { body, validationResult, query } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import Logger from '../config/winston';
import { Response } from 'express';
import Request from '../types/request';

@injectable()
export class EventController {
  private eventService: EventService;
  constructor(@inject(TYPES.EventService) eventService: EventService) {
    this.eventService = eventService;
  }

  createEvent = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const eventRequest = req.body;
    Logger.info(
      '<Controller>:<EventController>:<Create event controller initiated>'
    );
    try {
      const result = await this.eventService.create(eventRequest);
      res.send({
        message: 'Event Creation Successful',
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
    const { eventId } = req.body;
    Logger.info(
      '<Controller>:<EventController>:<Upload Image request initiated>'
    );
    try {
      const result = await this.eventService.uploadImage(eventId, req);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllEvent = async (req: Request, res: Response) => {
    const {
      coordinates,
      category
    }: {
      coordinates: number[];
      category: string;
    } = req.body;
    let { subCategory } = req.body;
    if (subCategory) {
      subCategory = (subCategory as string).split(',');
    } else {
      subCategory = [];
    }
    Logger.info(
      '<Controller>:<EventController>:<Get All request controller initiated>'
    );
    try {
      const result = await this.eventService.getAll(
        coordinates,
        subCategory,
        category
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getEventById = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<EventController>:<Getting banner ID>');
    try {
      const eventId = req.query.eventId;
      const result = await this.eventService.getEventById(eventId as string);
      Logger.info('<Controller>:<EventController>:<get successfully>');
      res.send({
        message: 'Event obtained successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateEvent = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<EventController>:<Update Event Status>');
    // Validate the request body
    const eventId = req.params.eventId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    try {
      const result = await this.eventService.updateEventDetails(
        req.body,
        eventId
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  deleteEvent = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<EventController>:<Delete Event>');
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    try {
      const result = await this.eventService.deleteEvent(req.body);
      res.send({
        message: 'Event deleted successfully',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateEventStatus = async (req: Request, res: Response) => {
    Logger.info('<Controller>:<EventController>:<Update Event Status>');
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    try {
      const result = await this.eventService.updateEventStatus(req.body);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
}
