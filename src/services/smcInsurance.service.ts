/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import { injectable } from 'inversify';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { S3Service } from './s3.service';
import SmcInsurance from '../models/SmcInsurance';

@injectable()
export class SmcInsuranceService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async create(smcInsurancePayload: any): Promise<any> {
    Logger.info(
      '<Service>:<SmcInsuranceService>: <SmcInsurance Creation: creating new smc insurance>'
    );
    // try {
    let newSmcInsurance;
    try {
      newSmcInsurance = await SmcInsurance.create(smcInsurancePayload);
      Logger.info(
        '<Service>:<SmcInsuranceService>:<SmcInsurance created successfully>'
      );
    } catch (err) {
      Logger.info('<Service>:<SmcInsuranceService>:<SmcInsurance Failed>');
      throw new Error(err);
    }
    return newSmcInsurance;
  }

  public async recordPolicyDetails() {
    Logger.info(
      '<Service>:<SmcInsuranceService>: <Offer onboarding: creating new offer>'
    );
  }
}
