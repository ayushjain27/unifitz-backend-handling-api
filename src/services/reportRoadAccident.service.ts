/* eslint-disable no-console */
import { injectable } from 'inversify';
import _ from 'lodash';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';
import { S3Service } from './s3.service';
import { SQSService } from './sqs.service';
import ReportRoadAccident, { IReportRoadAccident } from '../models/ReportRoadAccident';
import Logger from '../config/winston';

@injectable()
export class ReportRoadAccidentService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private sqsService = container.get<SQSService>(TYPES.SQSService);

  async create(userDetailPayload: IReportRoadAccident): Promise<IReportRoadAccident> {
    Logger.info(
      '<Service>:<ReportRoadAccidentService>: <User Detail Creation: creating user detail>'
    );

    if(!userDetailPayload?.phoneNumber){
      throw new Error("Phone Number is required");
    }
    let newUser: IReportRoadAccident = userDetailPayload;
    newUser.phoneNumber = `+91${newUser?.phoneNumber.slice(-10)}`;
    newUser = await ReportRoadAccident.create(newUser);
    Logger.info('<Service>:<ReportRoadAccidentService>:<New User created successfully>');
    return newUser;
  }
}
