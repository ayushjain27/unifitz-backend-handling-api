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
import StudioInfo from '../models/StudioInfo';

@injectable()
export class DeleteAccountService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private userService = container.get<UserService>(TYPES.UserService);
  private storeService = container.get<StoreService>(TYPES.StoreService);
  private customerService = container.get<CustomerService>(
    TYPES.CustomerService
  );

  async createStudioIndo(storeRequest: any): Promise<any> {
    let studioInfoPayload = storeRequest;
    studioInfoPayload.contact.phoneNumber = `+91${storeRequest?.contact?.phoneNumber?.slice(-10)}`;
    Logger.info(
      '<Route>:<StoreService>: <Store onboarding: creating new studio info>'
    );
    console.log(studioInfoPayload, 'emkfmkr');

    let newStudioInfo;
    try {
      newStudioInfo = await StudioInfo.create(studioInfoPayload);
    } catch (err) {
      throw new Error(err);
    }
    Logger.info(
      '<Service>:<StoreService>: <StudioInfo onboarding: created new studioinfo successfully>'
    );
    return newStudioInfo;
  }
}
