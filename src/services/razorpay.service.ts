import { injectable } from 'inversify';
import _ from 'lodash';
import Logger from '../config/winston';
import container from '../config/inversify.container';
import { S3Service } from './s3.service';
import { TYPES } from '../config/inversify.types';
import {
  UserPaymentRequest} from '../interfaces';
import Razorpay from 'razorpay';
import { planId, razorpayKey, razorpaySecretId } from '../config/constants';
import Payment, { IPayment } from '../models/payment';

const razorpay = new Razorpay({
  key_id: razorpayKey as string,
  key_secret: razorpaySecretId as string
});

@injectable()
export class RazorPayService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async createRazorPaySubscription(
    customer_email: string,
    customer_id: string,
    purpose: string
  ): Promise<any> {
    Logger.info('<Service>:<RazorPayService>:<RazorPay subsription initiated>');

    try {
      // get the store data
      const subscription = await razorpay.subscriptions.create({
        plan_id: planId as string,
        customer_notify: 1,
        total_count: 12, // Number of billing cycles
        notes: {
          email: customer_email, // ✅ Meta tag
          purpose: purpose, // ✅ Custom meta tag
          reference_id: customer_id // ✅ Custom meta tag
        }
      });

      return subscription;
    } catch (err) {
      throw new Error(err);
    }
  }

  async createPayment(paymentRequest: UserPaymentRequest): Promise<IPayment> {
    Logger.info(
      '<Service>:<RazorPayService>:<RazorPay subscription initiated>'
    );

    try {
      const query = {
        storeId: paymentRequest.storeId,
        customerId: paymentRequest.customerId,
        purpose: paymentRequest.purpose
      };

      if (!paymentRequest.storeId) {
        delete query['storeId'];
      }

      if (!paymentRequest.customerId) {
        delete query['customerId'];
      }

      const existingPayment = await Payment.findOne(query);

      if (existingPayment) {
        const updatedPayment = await Payment.findOneAndUpdate(
          query,
          {
            $set: {
              status: 'INACTIVE'
            }
          },
          { returnDocument: 'after' }
        );
        return updatedPayment;
      }

      const newPayment = await Payment.create(paymentRequest);
      return newPayment;
    } catch (err) {
      throw new Error(err);
    }
  }

  async createOrder(orderRequest: any): Promise<any> {
    Logger.info(
      '<Service>:<RazorPayService>:<RazorPay order initiated>'
    );

    try {
      const options = {
        amount: orderRequest.amount, // Amount in paise (100 INR = 10000 paise)
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        payment_capture: 1 // ✅ Ensures automatic capture
      };

      const order = await razorpay.orders.create(options);
      return order;
    } catch (err) {
      throw new Error(err);
    }
  }

  async updatePaymentStatus(paymentRequest: any): Promise<IPayment> {
    Logger.info(
      '<Service>:<RazorPayService>:<RazorPay subscription initiated>'
    );

    try {
      const query = {
        storeId: paymentRequest.storeId,
        customerId: paymentRequest.customerId,
        purpose: paymentRequest.purpose
      };

      if (!paymentRequest.storeId) {
        delete query['storeId'];
      }

      if (!paymentRequest.customerId) {
        delete query['customerId'];
      }

      const existingPayment = await Payment.findOne(query);

      if (!existingPayment) {
        throw new Error('No Payment is found');
      }
      const updatedPayment = await Payment.findOneAndUpdate(
        query,
        {
          $set: {
            status: 'ACTIVE'
          }
        },
        { returnDocument: 'after' }
      );
      return updatedPayment;
    } catch (err) {
      throw new Error(err);
    }
  }

  async getPaymentDetails(paymentRequest: any): Promise<any> {
    Logger.info(
      '<Service>:<RazorPayService>:<RazorPay subscription initiated>'
    );

    try {
      const query = {
        storeId: paymentRequest.storeId,
        customerId: paymentRequest.customerId,
        status: 'ACTIVE'
      };

      const getPaymentDetails = await Payment.find(query);

      return getPaymentDetails;
    } catch (err) {
      throw new Error(err);
    }
  };
}
