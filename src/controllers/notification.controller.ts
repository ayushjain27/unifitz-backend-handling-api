import { Response } from 'express';
// import { validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { NotificationService } from '../services/notification.service';
import Request from '../types/request';

@injectable()
export class NotificationController {
  private notificationService: NotificationService;
  constructor(
    @inject(TYPES.NotificationService) notificationService: NotificationService
  ) {
    this.notificationService = notificationService;
  }

  sendNotification = async (req: Request, res: Response) => {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res
    //     .status(HttpStatusCodes.BAD_REQUEST)
    //     .json({ errors: errors.array() });
    // }

    const { payload } = req.body;

    Logger.info(
      '<Controller>:<NotificationController>:<Send notification controller initiated>'
    );
    try {
      const result = await this.notificationService.sendNotification(payload);

      return res.json({
        message: 'Notification Sent Successfully',
        userName: result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
}
