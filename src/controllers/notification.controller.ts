import { Response } from 'express';
// import { validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { NotificationService } from '../services/notification.service';
import Request from '../types/request';
import { body } from 'express-validator';

@injectable()
export class NotificationController {
  private notificationService: NotificationService;
  constructor(
    @inject(TYPES.NotificationService) notificationService: NotificationService
  ) {
    this.notificationService = notificationService;
  }

  sendNotification = async (req: Request, res: Response) => {
    const payload = req.body;

    Logger.info(
      '<Controller>:<NotificationController>:<Create notification controller initiated>'
    );
    try {
      const result = await this.notificationService.sendNotification(payload);

      res.json({
        message: 'Notification Sent Successfully',
        userName: result
      });
      return;
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  createNotification = async (req: Request, res: Response) => {
    const payload = req.body;

    Logger.info(
      '<Controller>:<NotificationController>:<Create notification controller initiated>'
    );
    try {
      const result = await this.notificationService.createNotification(payload);

      res.json({
        message: 'Notification Created Successfully',
        userName: result
      });
      return;
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateNotificationStatus = async (req: Request, res: Response) => {
    const payload = req.body;

    Logger.info(
      '<Controller>:<NotificationController>:<Update notification status controller initiated>'
    );
    try {
      const result = await this.notificationService.updateNotificationStatus(payload);

      res.json({
        message: 'Notification Status Updated Successfully',
        userName: result
      });
      return;
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  countTotalNotification = async (req: Request, res: Response) => {
    const payload = req.query;

    Logger.info(
      '<Controller>:<NotificationController>:<Count notification controller initiated>'
    );
    try {
      const result = await this.notificationService.countTotalNotification(payload);

      res.json({
        message: 'Notification Count Successfully',
        userName: result
      });
      return;
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  validate = (method: string) => {
    switch (method) {
      case 'createNotification':
        return [
          // body('storeId', 'Store Id does not exist').exists().isString(),
          body('title', 'Title does not exists').exists().isString(),
          body('body', 'Body does not exists').exists().isString(),
          body('phoneNumber', 'Phone Number does not exists')
            .exists()
            .isString()
        ];
    }
  };
}
