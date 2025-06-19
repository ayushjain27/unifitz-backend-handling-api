/* eslint-disable no-console */
import { injectable } from 'inversify';
import _ from 'lodash';
import bcrypt from 'bcryptjs';
import Payload from '../types/payload';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { S3Service } from './s3.service';
import { AdminRole } from '../models/Admin';
import { SQSService } from './sqs.service';
import DeliveryPartners, {
  IDeliveryPartners
} from '../models/DeliveryPartners';
import { generateToken } from '../utils';

@injectable()
export class DeliveryPartnerService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private sqsService = container.get<SQSService>(TYPES.SQSService);

  async create(deliveryPatnerPayload: IDeliveryPartners): Promise<any> {
    Logger.info(
      '<Service>:<DeliveryPartnerService>: <Delivery Partner Creation: creating new delivery partner>'
    );

    // check if store id exist
    const { userName } = deliveryPatnerPayload;

    try {
      // Find the latest delivery partner with the same userName
      const latestPartner = await DeliveryPartners.findOne({
        userName
      }).sort({ createdAt: -1 });

      if (userName === 'SERVICEPLUG') {
        if (latestPartner && latestPartner.partnerId) {
          const prefix = latestPartner.partnerId.substring(0, 11); // Get "SP2245"
          const numericPart = latestPartner.partnerId.substring(11); // Get "01"

          // Increment the numeric part and pad with leading zeros
          const incrementedNumber = String(
            parseInt(numericPart, 10) + 1
          ).padStart(numericPart.length, '0');
          const newPartnerId = prefix + incrementedNumber;

          deliveryPatnerPayload.partnerId = newPartnerId;
        } else {
          deliveryPatnerPayload.partnerId = `${deliveryPatnerPayload?.userName}00`;
        }
      } else {
        if (latestPartner && latestPartner.partnerId) {
          const prefix = latestPartner.partnerId.substring(0, 6); // Get "SP2245"
          const numericPart = latestPartner.partnerId.substring(6); // Get "01"

          // Increment the numeric part and pad with leading zeros
          const incrementedNumber = String(
            parseInt(numericPart, 10) + 1
          ).padStart(numericPart.length, '0');
          const newPartnerId = prefix + incrementedNumber;

          deliveryPatnerPayload.partnerId = newPartnerId;
        } else {
          deliveryPatnerPayload.partnerId = `${deliveryPatnerPayload?.userName}00`;
        }
      }
      const updatedPassword = await this.encryptPassword(
        deliveryPatnerPayload?.security
      );
      deliveryPatnerPayload.password = updatedPassword;
      const newDeliveryPartner = await DeliveryPartners.create(
        deliveryPatnerPayload
      );

      Logger.info(
        '<Service>:<DeliveryPartnerService>:<Delivery Partner created successfully>'
      );
      return newDeliveryPartner;
    } catch (error) {
      Logger.error(
        `<Service>:<DeliveryPartnerService>: <Error in create>: ${error.message}`
      );
      throw error;
    }
  }

  private async encryptPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    return hashed;
  }

  async uploadDeliveryPartnerImage(
    deliveryPartnerId: string,
    req: Request | any
  ) {
    Logger.info(
      '<Service>:<DeliveryPartnerService>:<Delivery Partner image uploading>'
    );
    const deliveryPartner: IDeliveryPartners = await DeliveryPartners.findOne({
      _id: new Types.ObjectId(deliveryPartnerId)
    });
    if (_.isEmpty(deliveryPartner)) {
      throw new Error('Delivery Partner does not exist');
    }
    const file: any = req.file;

    let profileImageUrl: any = deliveryPartner.profileImageUrl || '';

    if (!file) {
      throw new Error('Files not found');
    }

    const fileName = 'profile';
    const { url } = await this.s3Client.uploadFile(
      deliveryPartnerId,
      fileName,
      file.buffer
    );
    profileImageUrl = url;

    const res = await DeliveryPartners.findOneAndUpdate(
      { _id: new Types.ObjectId(deliveryPartnerId) },
      { $set: { profileImageUrl } },
      { returnDocument: 'after' }
    );
    return res;
  }

  async getDeliveryPartnersPaginated(
    pageNo: number,
    pageSize: number,
    reqPayload: any,
    role?: string,
    userName?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<DeliveryPartnerService>:<Get all delivery partners>'
    );

    let query: any = {};
    if (reqPayload?.state) {
      query['state.name'] = reqPayload?.state;
    }
    if (reqPayload?.city) {
      query['city.name'] = reqPayload?.city;
    }
    if (reqPayload?.selectedPartner) {
      query.userName = reqPayload?.selectedPartner;
    }

    if (role === AdminRole.OEM) {
      query.userName = userName;
    }

    if (role === AdminRole.EMPLOYEE && reqPayload?.oemId !== 'SERVICEPLUG') {
      query.userName = reqPayload.oemId;
    }

    const deliveryParntersResponse = await DeliveryPartners.find(query)
      .skip(pageNo * pageSize)
      .limit(pageSize);
    return deliveryParntersResponse;
  }

  async countAllDeliveryPartners(
    reqPayload: any,
    role?: string,
    userName?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<DeliveryPartnerService>:<Count all delivery partners  service initiated>'
    );

    const query: any = {};
    if (reqPayload?.state) {
      query['state.name'] = reqPayload?.state;
    }
    if (reqPayload?.city) {
      query['city.name'] = reqPayload?.city;
    }
    if (reqPayload?.selectedPartner) {
      query.userName = reqPayload?.selectedPartner;
    }

    if (role === AdminRole.OEM) {
      query.userName = userName;
    }

    if (role === AdminRole.EMPLOYEE && reqPayload.oemId !== 'SERVICEPLUG') {
      query.userName = reqPayload.oemId;
    }

    const count = await DeliveryPartners.countDocuments(query);

    return { count: count };
  }

  async getAllDeliveryPartnersByUserName(
    oemId: string,
    vehicleType: string,
    role?: string,
    userName?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<DeliveryPartnerService>:<Get all delivery partners by username service initiated>'
    );

    const query: any = {
      vehicleType: vehicleType
    };

    if (role === AdminRole.OEM) {
      query.userName = userName;
    }

    if (role === AdminRole.EMPLOYEE && oemId !== 'SERVICEPLUG') {
      query.userName = oemId;
    }

    const result = await DeliveryPartners.find(query);

    return result;
  }

  async getDeliveryPartnerDetailsByPartnerId(partnerId: string): Promise<any> {
    Logger.info(
      '<Service>:<DeliveryPartnerService>:<Count all delivery partners by username service initiated>'
    );

    const result = await DeliveryPartners.findOne({ partnerId });

    return result;
  }

  async login(userName: string, password: string): Promise<any> {
    Logger.info('<Service>:<DeliveryPartnerService>:<login service initiated>');
    const deliveryPartnerDetails = await DeliveryPartners.findOne({
      partnerId: userName
    });
    if (!deliveryPartnerDetails) {
      throw new Error('Delivery Partner not found');
    }
    if (!(await bcrypt.compare(password, deliveryPartnerDetails.password))) {
      throw new Error('Password validation failed');
    }
    const payload: Payload = {
      userId: deliveryPartnerDetails.partnerId,
      role: deliveryPartnerDetails.role
    };
    const token = await generateToken(payload);
    return { user: deliveryPartnerDetails, token };
  }
}
