/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
import { injectable } from 'inversify';
import { Types } from 'mongoose';
import Logger from '../config/winston';
import { firebaseAdmin } from '../config/firebase-config';
import { messaging } from 'firebase-admin';
import { App } from 'firebase-admin/app';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';
import Store from '../models/Store';
import { SQSService } from './sqs.service';
import { SQSEvent } from '../enum/sqsEvent.enum';
import Customer from '../models/Customer';
import Notification, { INotification } from '../models/Notification';
import { isEmpty } from 'lodash';
const FCM = require('fcm-node');
// import Customer, { ICustomer } from './../models/Customer';

@injectable()
export class NotificationService {
  private sqsService = container.get<SQSService>(TYPES.SQSService);
  // async sendNotification(params: any): Promise<any> {
  //   Logger.info(
  //     '<Service>:<NotificationService>: <Sending notification: sending notfication to user>'
  //   );
  //   const registrationToken = params.fcmToken;
  //   const payload = params.payload;
  //   const options = {
  //     priority: 'high',
  //     timeToLive: 60 * 60 * 24
  //   };
  //   try {
  //     const response = await messaging(firebaseAdmin as App | any).sendToDevice(
  //       registrationToken,
  //       payload,
  //       options
  //     );
  //     return response;
  //   } catch (err) {
  //     throw new Error(err);
  //   }
  // }

  async sendNotification(params: any): Promise<any> {
    Logger.info(
      '<Service>:<NotificationService>: <Sending notification: sending notfication to user>'
    );

    try {
      let partners = await Customer.find({});
      for (const partner of partners) {
        // await sendNotification(
        //   '🚗 New Features Alert! 🚗',
        //   'Buy and Sell Vehicles Easier Than Ever. Explore our latest updates to find your perfect ride or sell yours quickly. Check it out now!',
        //   customer?.phoneNumber,
        //   'USER',
        //   ''
        // );
        // const data = {
        //   title: 'New Feature',
        //   body: 'Introducing Buy Spares: Purchase spare parts directly from distributors at your convenience.',
        //   phoneNumber: partner?.contactInfo?.phoneNumber?.primary,
        //   role: 'STORE_OWNER',
        //   type: 'BUY_SPARES'
        // };
        const data = {
          title: 'Buy/ Renewal Insurane!',
          body: 'SMC Insurance is here! Protect your vehicle with affordable and reliable insurance plans.',
          phoneNumber: partner?.phoneNumber,
          role: 'USER',
          type: 'SMC_INSURANCE',
        };
        console.log(data,"data send");
        const sqsMessage = await this.sqsService.createMessage(
          SQSEvent.NOTIFICATION,
          data
        );
      }
    } catch (err) {
      throw new Error(err);
    }
  }

  async createNotification(params: any): Promise<INotification> {
    Logger.info(
      '<Service>:<NotificationService>: <Creating notification: creating notfication to user>'
    );
    let payload = params;
    try {
      let createNotification = Notification.create(payload);
      return createNotification;
    } catch (err) {
      throw new Error(err);
    }
  }

  async updateNotificationStatus(params: any): Promise<any> {
    Logger.info(
      '<Service>:<NotificationService>: <Updating notification status: updating notfication status to user>'
    );
    let payload = params;
    try {
      let notification = await Notification.findOne({
        _id: payload.notificationId
      })
      if(!isEmpty(notification)){
        let response = await Notification.findOneAndUpdate({
          _id: payload.notificationId,
          $set: {status: 'INACTIVE'}
        })
        return response;
      }
    } catch (err) {
      throw new Error(err);
    }
  }

  async countTotalNotification(params: any): Promise<any> {
    Logger.info(
      '<Service>:<NotificationService>: <Counting notification: counting notfication status to user>'
    );
    let payload = params;
    let count: any = 0
    let query: any = {
        status: 'ACTIVE'
    }
    if(payload.storeId){
      query.storeId = payload.storeId;
    }
    if(payload.customerId){
      query.customerId = payload.customerId;
    }
    try {
      count = await Notification.countDocuments(query);
      return count;
    } catch (err) {
      throw new Error(err);
    }
  }

  async getUserAllNotificationsPaginated(
    storeId: string,
    customerId: string,
    pageNo: number,
    pageSize: number
  ): Promise<INotification[]> {
    let query: any = {}
    if(!isEmpty(storeId)){
      query.storeId = storeId
    }
    if(!isEmpty(customerId)){
      query.customerId = customerId
    }
      Logger.info(
      '<Service>:<NotificationService>:<Get user all notifications by id>'
    );

    const notificationResponse: any = await Notification.aggregate([
      {
        $match: query
      },
      { $sort: { createdAt: -1 } }, // 1 for ascending order
      {
        $skip: pageNo * pageSize
      },
      {
        $limit: pageSize
      }
    ]);

    return notificationResponse;
  }
}
