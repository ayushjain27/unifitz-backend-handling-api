import { injectable } from 'inversify';
import { Types } from 'mongoose';
import _ from 'lodash';
import Logger from '../config/winston';
import container from '../config/inversify.container';
import { S3Service } from './s3.service';
import { TYPES } from '../config/inversify.types';

@injectable()
export class DeleteAccountService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
}
