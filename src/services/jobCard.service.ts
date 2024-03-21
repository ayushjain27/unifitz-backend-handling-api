import { injectable } from 'inversify';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import Request from '../types/request';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import JobCard, { IJobCard, ILineItem, JobStatus } from './../models/JobCard';
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

    const lastCreatedJobId = await JobCard.find({ storeId })
      .sort({ createdAt: 'desc' })
      .limit(1)
      .exec();

    const jobCardNumber = !lastCreatedJobId[0]
      ? 1
      : Number(+lastCreatedJobId[0].jobCardNumber) + 1
      
    let newJobCard: IJobCard = jobCardPayload;
    newJobCard.jobCardNumber = String(jobCardNumber);
    newJobCard.jobStatus = JobStatus.CREATED;

    // if (files) {
    //   const promises: any[] = [];
    //   let uploadedKeys: [{ key: string; docURL: string }];
    //   _.forEach(files, (file: any) => {
    //     promises.push(
    //       this.s3Client
    //         .uploadFile(`${storeId}/jobCard`, file.originalname, file.buffer)
    //         .then(({ key, url }) => uploadedKeys.push({ key, docURL: url }))
    //     );
    //   });
    //   await Promise.all(promises);

    //   // newJobCard.refImageList = uploadedKeys;
    // }
    newJobCard = await JobCard.create(newJobCard);
    Logger.info('<Service>:<JobCardService>:<Job Card created successfully>');
    return newJobCard;
  }

  async createStoreLineItems(
    jobCardId: string,
    lineItemsPayload: ILineItem[]
  ) {
    Logger.info(
      '<Service>:<JobCardService>: <Job Card Creation: creating ccustomer job card line items>'
    );
    const storeCustomer: IJobCard = await JobCard.findOne({ _id: new Types.ObjectId(jobCardId)})?.lean();
    if (_.isEmpty(storeCustomer)) {
      throw new Error('Customer does not exist');
    }
    const storeCustomerLineItems: ILineItem[] = lineItemsPayload;
    const res = await JobCard.findOneAndUpdate(
      { _id: jobCardId },
      { $set: { lineItems: storeCustomerLineItems } },
      { returnDocument: 'after' }
    );
    Logger.info('<Service>:<JobCardService>:<Line Items created successfully>');
    return res;
  }

  async getStoreJobCardsByStoreId(storeId: string): Promise<IJobCard[]> {
    Logger.info(
      '<Service>:<JobCardService>: <Store Job Card Fetch: getting all the store job cards by store id>'
    );

    const storeJobCard: IJobCard[] = await JobCard.find({ storeId }).lean();
    Logger.info('<Service>:<JobCardService>:<Store Job Cards fetched successfully>');
    return storeJobCard;
  }

  async getJobCardById(jobCardId: string): Promise<IJobCard> {
    Logger.info(
      '<Service>:<JobCardService>: <Job Card Fetch: Get job card by job card id>'
    );
    const jobCard: IJobCard = await JobCard.findOne({
      _id: new Types.ObjectId(jobCardId)
    }).lean();
    return jobCard;
  }

  async updateJobCard(jobCardPayload: IJobCard, jobCardId: string): Promise<IJobCard> {
    Logger.info(
      '<Service>:<JobCardService>: <Job Card Update: updating job card>'
    );

    // check if store id exist
    const { storeId } = jobCardPayload;
    let store: IStore;
    if (storeId) {
      store = await Store.findOne({ storeId }, { verificationDetails: 0 });
    }
    if (!store) {
      Logger.error('<Service>:<JobCardService>:< Store id not found>');
      throw new Error('Store not found');
    }
    let jobCard: IJobCard;
    if (jobCardId) {
      jobCard = await JobCard.findOne({
        _id: new Types.ObjectId(jobCardId)
      });
    }
    if (!jobCard) {
      Logger.error(
        '<Service>:<JobCardService>:<Job Card not found with that job Card Id>'
      );
      throw new Error('Job Card not found');
    }

    let updatedJobCard: IJobCard = jobCardPayload;
    updatedJobCard = await JobCard.findOneAndUpdate(
      { _id: new Types.ObjectId(jobCardId) },
      updatedJobCard,
      { returnDocument: 'after' }
    );
    Logger.info('<Service>:<JobCardService>:<Job Card updated successfully>');
    return updatedJobCard;
  }
}
