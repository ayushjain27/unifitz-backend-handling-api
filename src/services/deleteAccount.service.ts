import { injectable } from 'inversify';
import { Types } from 'mongoose';
import _ from 'lodash';
import Logger from '../config/winston';
import container from '../config/inversify.container';
import { S3Service } from './s3.service';
import { TYPES } from '../config/inversify.types';
import DeleteAccount, { IDeleteAccount } from '../models/DeleteAccount';
import { AccountDeleteRequest } from '../interfaces/accountDeleteRequest.interface';

@injectable()
export class DeleteAccountService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async create(requestBody: AccountDeleteRequest): Promise<IDeleteAccount> {
    Logger.info(
      '<Service>:<StoreService>: <Store onboarding: created new store successfully>'
    );

    // Complete the delete request body

    const params: IDeleteAccount = {
      ...requestBody,
      app: requestBody.userRole === 'STORE_OWNER' ? 'PARTNER' : 'CUSTOMER',
      userId: ''
    };

    // Get the user and attach the user id
    params.userId = 'abcd';

    // If user role is store owner then get store id, else get customer id if available.

    const deleteRequest = await DeleteAccount.save(request);
    return deleteRequest;
  }
}
