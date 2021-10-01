import { injectable } from 'inversify';
import { Types } from 'mongoose';
import Logger from '../config/winston';
import { firebaseAdmin } from '../config/firebase-config';
// import Customer, { ICustomer } from './../models/Customer';

@injectable()
export class NotificationService {
  async sendNotification(params: any): Promise<any> {
    Logger.info(
      '<Service>:<NotificationService>: <Sending notification: sending notfication to user>'
    );
    const registrationToken = params.fcmToken;
    const payload = params.payload;
    const options = {
      priority: 'high',
      timeToLive: 60 * 60 * 24
    };
    try {
      const response = await firebaseAdmin
        .messaging()
        .sendToDevice(registrationToken, payload, options);
      return response;
    } catch (err) {
      throw new Error(err);
    }
  }
}
