import { injectable } from 'inversify';
import { Types } from 'mongoose';
import _ from 'lodash';
import Logger from '../config/winston';
import Customer, { ICustomer } from './../models/Customer';
import container from '../config/inversify.container';
import { S3Service } from './s3.service';
import { TYPES } from '../config/inversify.types';

@injectable()
export class CustomerService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

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

    const fileName = 'profie';
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
      '<Service>:<StoreService>:<Get stores by Id service initiated>'
    );

    const customerResponse: ICustomer = await Customer.findOne({
      phoneNumber: `+91${phoneNumber.slice(-10)}`
    }).lean();
    return customerResponse;
  }

  async getAll(): Promise<ICustomer[]> {
    Logger.info('<Service>:<StoreService>:<Get all customers>');
    const customerResponse: ICustomer[] = await Customer.find({});
    return customerResponse;
  }
}
