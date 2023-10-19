import { injectable } from 'inversify';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import Request from '../types/request';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import JobCard, { IJobCard, JobStatus } from './../models/JobCard';
import Store, { IStore } from '../models/Store';
import { S3Service } from './s3.service';
import _ from 'lodash';

@injectable()
export class JobCardService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async create(jobCardPayload: IJobCard, req: Request): Promise<IJobCard> {
    Logger.info(
      '<Service>:<JobCardService>: <JobCard Creation: creating new jobcard>'
    );

    // check if store id exist
    const { storeId } = jobCardPayload;
    const files = req.files;
    let store: IStore;
    if (storeId) {
      store = await Store.findOne({ storeId }, { verificationDetails: 0 });
    }
    if (!store) {
      Logger.error(
        '<Service>:<JobCardService>:<Upload file - store id not found>'
      );
      throw new Error('Store not found');
    }
    let newJobCard: IJobCard = jobCardPayload;
    newJobCard.jobStatus = JobStatus.CREATED;

    if (files) {
      const promises: any[] = [];
      let uploadedKeys: [{ key: string; docURL: string }];
      _.forEach(files, (file: any) => {
        promises.push(
          this.s3Client
            .uploadFile(`${storeId}/jobCard`, file.originalname, file.buffer)
            .then(({ key, url }) => uploadedKeys.push({ key, docURL: url }))
        );
      });
      await Promise.all(promises);

      newJobCard.refImageList = uploadedKeys;
    }
    newJobCard = await JobCard.create(newJobCard);
    Logger.info('<Service>:<JobCardService>:<Job Card created successfully>');
    return newJobCard;
  }
}
