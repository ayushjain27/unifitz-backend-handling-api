/* eslint-disable no-console */
import { injectable } from 'inversify';
import _ from 'lodash';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { S3Service } from './s3.service';
import OfferModel, { IOffer, OfferStatus } from '../models/Offers';
import Store, { IStore } from '../models/Store';
import Admin, { AdminRole, IAdmin } from '../models/Admin';
import { OemOfferType, OemOfferProfileStatus } from '../models/Offers';

@injectable()
export class SmcInsuranceService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  public async recordPolicyDetails() {

    Logger.info(
      '<Service>:<SmcInsuranceService>: <Offer onboarding: creating new offer>'
    );

  }


}