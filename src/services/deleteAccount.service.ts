import { injectable } from 'inversify';
import { Types } from 'mongoose';
import _ from 'lodash';
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
      userId: ''
    };

    // Get the user and attach the user id
    const userPayload = {
      phoneNumber: requestBody.phoneNumber,
      role: requestBody.userRole
    };

    // Get the user details
    const user = await this.userService.getUserByPhoneNumber(userPayload);

    params.userId = String(user._id);

    // If user role is store owner then get store id, else get customer id if available.

    const storePayload = {
      userId: user?._id
    };

    if (requestBody.userRole === 'STORE_OWNER') {
      const store = await this.storeService.getStoreByUserId(storePayload);

      params.storeId = store?.storeId;
    } else {
      let phoneNumber = requestBody.phoneNumber.slice(3, 13);
      const customer = await this.customerService.getByPhoneNumber({
        phoneNumber: phoneNumber
      });
      params.customerId = customer?._id;
    }

    const deleteRequest = await DeleteAccount.create(params);
    return deleteRequest;
  }

  async getDeleteRequest(reqBody: any): Promise<IDeleteAccount> {
    Logger.info('<Service>:<DeleteAccountService>:<Get deleted account by id>');
    const deleteAccountResponse: IDeleteAccount = await DeleteAccount.find({
      _id: new Types.ObjectId(reqBody.id)
    }).lean();
    return deleteAccountResponse;
  }
}
