import { injectable } from 'inversify';
import { Types } from 'mongoose';
import { isEmpty } from 'lodash';
import Logger from '../config/winston';
import container from '../config/inversify.container';
import { S3Service } from './s3.service';
import { TYPES } from '../config/inversify.types';
import DeleteAccount, { IDeleteAccount } from '../models/DeleteAccount';
import { AccountDeleteRequest } from '../interfaces/accountDeleteRequest.interface';
import { UserService } from './user.service';
import { StoreService } from './store.service';
import { CustomerService } from './customer.service';

@injectable()
export class DeleteAccountService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private userService = container.get<UserService>(TYPES.UserService);
  private storeService = container.get<StoreService>(TYPES.StoreService);
  private customerService = container.get<CustomerService>(
    TYPES.CustomerService
  );

  async create(requestBody: AccountDeleteRequest): Promise<IDeleteAccount> {
    Logger.info('<Service>:<DeleteAccountService>: <Deleted Account created>');

    // Complete the delete request body

    const params: IDeleteAccount = {
      ...requestBody,
      app: requestBody.userRole === 'STORE_OWNER' ? 'PARTNER' : 'CUSTOMER',
      userId: new Types.ObjectId()
    };

    // Check if the request exist
    const accountRequest = await this.getDeleteRequest(
      requestBody.phoneNumber,
      requestBody.userRole
    );

    if (!isEmpty(accountRequest)) {
      throw new Error('Request already exist');
    }

    // Get the user and attach the user id
    const userPayload = {
      phoneNumber: `+91${requestBody.phoneNumber?.slice(-10)}`,
      role: requestBody.userRole
    };

    // Get the user details
    const user = await this.userService.getUserByPhoneNumber(userPayload);

    if (isEmpty(user)) {
      throw new Error('User not found');
    }

    params.userId = user._id;

    // If user role is store owner then get store id, else get customer id if available.

    if (requestBody.userRole === 'STORE_OWNER') {
      const store = await this.storeService.getStoreByUserId(user._id);

      if (isEmpty(store)) {
        throw new Error('Store not found');
      }
      params.storeId = store?.storeId;
    } else {
      const phoneNumber = requestBody.phoneNumber.slice(-10);
      const customer = await this.customerService.getByPhoneNumber(phoneNumber);
      params.customerId = String(customer?._id);
    }

    const deleteRequest = await DeleteAccount.create(params);
    return deleteRequest;
  }

  async getDeleteRequest(
    phoneNumber: string,
    userRole: string
  ): Promise<IDeleteAccount> {
    Logger.info('<Service>:<DeleteAccountService>:<Get deleted account by id>');
    const deleteAccountResponse: IDeleteAccount = await DeleteAccount.findOne({
      phoneNumber: `+91${phoneNumber?.slice(-10)}`,
      userRole
    });
    return deleteAccountResponse;
  }

  async getRestoreRequest(
    phoneNumber: string,
    userRole: string
  ): Promise<IDeleteAccount> {
    Logger.info('<Service>:<DeleteAccountService>:<Get deleted account by id>');
    const deleteAccountResponse: IDeleteAccount =
      await DeleteAccount.findOneAndDelete({
        phoneNumber: `+91${phoneNumber?.slice(-10)}`,
        userRole
      });
    return deleteAccountResponse;
  }
}
