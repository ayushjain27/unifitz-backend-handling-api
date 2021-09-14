import { injectable } from 'inversify';
import { Types } from 'mongoose';
import Logger from '../config/winston';
import Customer, { ICustomer } from './../models/Customer';

@injectable()
export class CustomerService {
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

  async getByPhoneNumber(phoneNumber: string): Promise<ICustomer> {
    Logger.info(
      '<Service>:<StoreService>:<Get stores by Id service initiated>'
    );
    const customerResponse: ICustomer = await Customer.findOne({
      phoneNumber
    }).lean();
    return customerResponse;
  }

  async getAll(): Promise<ICustomer[]> {
    Logger.info('<Service>:<StoreService>:<Get all customers>');
    const customerResponse: ICustomer[] = await Customer.find({});
    return customerResponse;
  }
}
