import { injectable } from 'inversify';
import { Types } from 'mongoose';
import _ from 'lodash';
import Logger from '../config/winston';
import Customer, { ICustomer } from './../models/Customer';
import container from '../config/inversify.container';
import { S3Service } from './s3.service';
import { TYPES } from '../config/inversify.types';
import { ApproveUserVerifyRequest, VerifyAadharUserRequest, VerifyCustomerRequest } from '../interfaces';
import { DocType } from '../enum/docType.enum';
import { SurepassService } from './surepass.service';

@injectable()
export class CustomerService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  private surepassService = container.get<SurepassService>(
    TYPES.SurepassService
  );

  async create(customerPayload: ICustomer): Promise<ICustomer> {
    Logger.info(
      '<Service>:<CustomerService>: <Customer onboarding: creating new customer>'
    );
    const newCustomer = await Customer.create(customerPayload);
    Logger.info('<Service>:<CustomerService>:<Customer created successfully>');
    return newCustomer;
  }

  async update(
    customerId: string,
    customerPayload: ICustomer
  ): Promise<ICustomer> {
    Logger.info(
      '<Service>:<CustomerService>: <Customer onboarding: creating new customer>'
    );
    await Customer.findOneAndUpdate(
      {
        _id: new Types.ObjectId(customerId)
      },
      customerPayload
    );
    const updatedCustomerPayload = Customer.findById(
      new Types.ObjectId(customerId)
    );
    Logger.info('<Service>:<CustomerService>:<Customer updated successfully>');
    return updatedCustomerPayload;
  }

  async updateCustomerImage(customerId: string, req: Request | any) {
    Logger.info('<Service>:<CustomerService>:<Customer image uploading>');
    const customer: ICustomer = await Customer.findOne({
      _id: new Types.ObjectId(customerId)
    })?.lean();
    if (_.isEmpty(customer)) {
      throw new Error('customer does not exist');
    }
    const file: any = req.file;

    let profileImageUrl: any = customer.profileImageUrl || '';

    if (!file) {
      throw new Error('Files not found');
    }

    const fileName = 'profile';
    const { url } = await this.s3Client.uploadFile(
      customerId,
      fileName,
      file.buffer
    );
    profileImageUrl = url;

    const res = await Customer.findOneAndUpdate(
      { _id: customerId },
      { $set: { profileImageUrl } },
      { returnDocument: 'after' }
    );
    return res;
  }

  async getByPhoneNumber(phoneNumber: string): Promise<ICustomer> {
    Logger.info(
      '<Service>:<CustomerService>:<Get customer by phone Number service initiated>'
    );

    const customerResponse: ICustomer = await Customer.findOne({
      phoneNumber: `+91${phoneNumber.slice(-10)}`
    }).lean();
    return customerResponse;
  }

  async getAll(): Promise<ICustomer[]> {
    Logger.info('<Service>:<CustomerService>:<Get all customers>');
    const customerResponse: ICustomer[] = await Customer.find({});
    return customerResponse;
  }

  async initiateUserVerification(
    payload: VerifyCustomerRequest
  ) {
    Logger.info('<Service>:<CustomerService>:<Initiate Verifying user>');
    // validate the store from user phone number and user id
    let verifyResult: any = {};
    const displayFields: any = {};

    try {
      // get the store data
      const customerDetails = await Customer.findOne(
        {
          phoneNumber: payload.phoneNumber
        }
      );

      if (_.isEmpty(customerDetails)) {
        throw new Error('Customer does not exist');
      }


      // integrate surephass api based on doc type
      switch (payload.documentType) {
        case DocType.GST:
          verifyResult = await this.surepassService.getGstDetails(
            payload.documentNo
          );
          displayFields.businessName = verifyResult?.business_name;
          displayFields.address = verifyResult?.address;
          break;
        case DocType.AADHAR:
          verifyResult = await this.surepassService.sendOtpForAadharVerify(
            payload.documentNo
          );
          break;
        default:
          throw new Error('Invalid Document Type');
      }

      return { verifyResult, displayFields };
    } catch (err) {
      if (err.response) {
        return Promise.reject(err.response);
      }
      throw new Error(err);
    }
  }

  async approveUserVerification(
    payload: ApproveUserVerifyRequest
  ) {
    Logger.info('<Service>:<CustomerService>:<Approve Verifying user business>');
    // validate the store from user phone number and user id

    try {
      const customerDetails = await Customer.findOne(
        {
          phoneNumber: payload.phoneNumber
        }
      );

      if(_.isEmpty(customerDetails)){
        throw new Error('Customer not found'); 
      }

      const updatedCustomer = await this.updateCustomerDetails(
        payload.verificationDetails,
        payload.documentType,
        payload.gstAdhaarNumber,
        customerDetails
      );

      return updatedCustomer;
    } catch (err) {
      if (err.response) {
        return Promise.reject(err.response);
      }
      throw new Error(err);
    }
  }

  async verifyAadhar(
    payload: VerifyAadharUserRequest,
  ) {
    Logger.info('<Service>:<StoreService>:<Initiate Verifying user business>');
    // validate the store from user phone number and user id
    let verifyResult: any = {};
    const gstAdhaarNumber = payload?.gstAdhaarNumber ? payload?.gstAdhaarNumber : '';

    try {
      // get the store data
      const customerDetails = await Customer.findOne({
        phoneNumber: payload.phoneNumber
      });

      if (_.isEmpty(customerDetails)) {
        throw new Error('Customer does not exist');
      }

      const verifyResult = await this.surepassService.verifyOtpForAadharVerify(
        payload.clientId,
        payload.otp
      );
      const updatedCustomer = await this.updateCustomerDetails(
        verifyResult,
        DocType.AADHAR,
        gstAdhaarNumber,
        customerDetails
      );

      return updatedCustomer;
    } catch (err) {
      throw new Error(err);
    }
  }

  private async updateCustomerDetails(
    verifyResult: any,
    documentType: string,
    gstAdhaarNumber: string,
    customerDetails: ICustomer
  ) {
    let isVerified = false;

    if (!_.isEmpty(verifyResult)) {
      // Business is verified
      isVerified = true;
    }

    // update the store
    const updatedCustomer = await Customer.findOneAndUpdate(
      { phoneNumber: customerDetails.phoneNumber },
      {
        $set: {
          isVerified,
          verificationDetails: { documentType, verfiyName: verifyResult?.business_name, verifyAddress: verifyResult?.address ,verifyObj: verifyResult, gstAdhaarNumber }
        }
      },
      {
        returnDocument: 'after',
        projection: { 'verificationDetails.verifyObj': 0 }
      }
    );

    return updatedCustomer;
  }
}
