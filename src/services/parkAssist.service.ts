import { injectable } from 'inversify';
import _ from 'lodash';
import Logger from '../config/winston';
import container from '../config/inversify.container';
import { S3Service } from './s3.service';
import { TYPES } from '../config/inversify.types';
import {
    ParkAssistChatRequest,
    ParkAssistUserRequest,
  UserPaymentRequest} from '../interfaces';
import Razorpay from 'razorpay';
import { planId, razorpayKey, razorpaySecretId } from '../config/constants';
import Payment, { IPayment } from '../models/payment';
import ParkAssistChatUser, { IParkAssistChatUser } from '../models/parkAssistChatUser';
import ParkAssistChatMessage, { IParkAssistChatMessage } from '../models/parkAssistChatMessage';

@injectable()
export class ParkAssistService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async createUser(parkAssistUserPayload: ParkAssistUserRequest): Promise<IParkAssistChatUser> {
    Logger.info(
      '<Service>:<ParkAssistService>:<Park Assist User Creation initiated>'
    );

    try {
      const query = {
        senderId: parkAssistUserPayload.senderId,
        receiverId: parkAssistUserPayload.receiverId,
        vehicleNumber: parkAssistUserPayload.vehicleNumber,
        platform: parkAssistUserPayload.platform
      };

      const existingData = await ParkAssistChatUser.findOne(query);

      if (existingData) {
        const updatedData = await ParkAssistChatUser.findOneAndUpdate(query, {
            date: new Date()
        },{
            new: true
        });
        return updatedData;
      }

      parkAssistUserPayload.date = new Date();

      const newData = await ParkAssistChatUser.create(parkAssistUserPayload);
      return newData;
    } catch (err) {
      console.error(err, 'Error in creating user');
      throw new Error(err);
    }
  }

  async createUserChat(parkAssistUserChatPayload: ParkAssistChatRequest): Promise<IParkAssistChatMessage> {
    Logger.info(
      '<Service>:<ParkAssistService>:<Park Assist User Message Creation initiated>'
    );

    try {
      const parkAssistChatMessage = await ParkAssistChatMessage.create(parkAssistUserChatPayload);
      return parkAssistChatMessage;
    } catch (err) {
      console.error(err, 'Error in creating user');
      throw new Error(err);
    }
  }

  async getUserChatDetails(dataPayload: any): Promise<any> {
    Logger.info(
      '<Service>:<ParkAssistService>:<Get Park Assist User Messages initiated>'
    );

    const query = {
        vehicleNumber: dataPayload.vehicleNumber,
        $or: [
          {
            senderId: dataPayload.senderId,
            receiverId: dataPayload.receiverId,
          },
          {
            senderId: dataPayload.receiverId,
            receiverId: dataPayload.senderId,
          },
        ],
      };
    

    try {
      const parkAssistChatMessage = await ParkAssistChatMessage.find(query).sort({ createdAt: 1 });;
      return parkAssistChatMessage;
    } catch (err) {
      console.error(err, 'Error in creating user');
      throw new Error(err);
    }
  }

  async getUserDetails(dataPayload: any): Promise<any> {
    Logger.info(
      '<Service>:<ParkAssistService>:<Get Park Assist User Details Creation initiated>'
    );

    try {
      const parkAssistUsers = await ParkAssistChatUser.find(dataPayload).sort({ date: -1 });;
      return parkAssistUsers;
    } catch (err) {
      console.error(err, 'Error in creating user');
      throw new Error(err);
    }
  }
}
