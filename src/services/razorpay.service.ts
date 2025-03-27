import { injectable } from 'inversify';
import { Types } from 'mongoose';
import _, { isEmpty } from 'lodash';
import Logger from '../config/winston';
import Customer, { ICustomer } from './../models/Customer';
import container from '../config/inversify.container';
import { S3Service } from './s3.service';
import { TYPES } from '../config/inversify.types';
import {
  ApproveUserVerifyRequest,
  VerifyAadharUserRequest,
  VerifyCustomerRequest
} from '../interfaces';
import { DocType } from '../enum/docType.enum';
import { SurepassService } from './surepass.service';
import { StaticIds } from '../models/StaticId';
import Razorpay from "razorpay";
import { razorpayKey, razorpaySecretId } from '../config/constants';

const razorpay = new Razorpay({
  key_id: razorpayKey as string,
  key_secret: razorpaySecretId as string
})

@injectable()
export class RazorPayService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async createRazorPaySubscription(
    plan_id: string,
    customer_email: string,
    customer_id: string,
    purpose: string
  ): Promise<any> {
    Logger.info('<Service>:<RazorPAyService>:<RazorPay subsription initiated>');

    try {
      // get the store data
       const subscription = await razorpay.subscriptions.create({
          plan_id,
          customer_notify: 1,
          total_count: 12, // Number of billing cycles
          notes: {
            email: customer_email, // ✅ Meta tag
            purpose: purpose, // ✅ Custom meta tag
            reference_id: customer_id, // ✅ Custom meta tag
          },
        });
  
        console.log(subscription,"fermfk")
      return subscription;
    } catch (err) {
      console.log(err,"frmkfnk")
      throw new Error(err);
    }
  }
 
}
