import { injectable } from 'inversify';
import { Types } from 'mongoose';
import _ from 'lodash';
import Logger from '../config/winston';
import container from '../config/inversify.container';
import { S3Service } from './s3.service';
import { TYPES } from '../config/inversify.types';
import User, { IUser } from '../models/User';

@injectable()
export class UserService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async getUserByPhoneNumber(userPayload: any): Promise<IUser> {
    Logger.info('<Service>:<UserService>:<Get user by phone number>');
    const userResponse: IUser = await User.findOne({
      phoneNumber: userPayload.phoneNumber,
      role: userPayload.role
    });
    return userResponse;
  }
}
