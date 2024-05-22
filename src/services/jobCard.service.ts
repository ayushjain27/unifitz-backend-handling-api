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
import AWS from 'aws-sdk';
import { s3Config } from '../config/constants';
import path from 'path';
import { receiveFromSqs, sendToSqs } from '../utils/common';
import { v4 as uuidv4 } from 'uuid';
import CreateInvoice from '../models/CreateInvoice';

const nodemailer = require('nodemailer');
require('dotenv').config();

AWS.config.update({
  accessKeyId: s3Config.AWS_KEY_ID,
  secretAccessKey: s3Config.ACCESS_KEY,
  region: 'ap-south-1'
});

const sqs = new AWS.SQS();
const ses = new AWS.SES();
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
      : Number(+lastCreatedJobId[0].jobCardNumber) + 1;

    let newJobCard: IJobCard = jobCardPayload;
    newJobCard.jobCardNumber = String(jobCardNumber);
    newJobCard.jobStatus = JobStatus.CREATED;

    newJobCard = await JobCard.create(newJobCard);
    Logger.info('<Service>:<JobCardService>:<Job Card created successfully>');
    return newJobCard;
  }

  async createStoreLineItems(jobCardId: string, lineItemsPayload: ILineItem[]) {
    Logger.info(
      '<Service>:<JobCardService>: <Job Card Creation: creating ccustomer job card line items>'
    );
    const storeCustomer: IJobCard = await JobCard.findOne({
      _id: new Types.ObjectId(jobCardId)
    })?.lean();
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

  async getStoreJobCardsByStoreId(
    storeId: string,
    searchValue: string
  ): Promise<IJobCard[]> {
    Logger.info(
      '<Service>:<JobCardService>: <Store Job Card Fetch: getting all the store job cards by store id>'
    );

    let query: any = {};
    query = {
      storeId: storeId,
      $or: [
        {
          'customerDetails.storeCustomerVehicleInfo.vehicleNumber': new RegExp(
            searchValue,
            'i'
          )
        },
        { 'customerDetails.phoneNumber': new RegExp(searchValue, 'i') }
      ]
    };

    console.log(query, 'asdw;l');
    if (!storeId) {
      delete query.storeId;
    }
    if (!searchValue) {
      delete query['customerDetails.storeCustomerVehicleInfo.vehicleNumber'];
    }
    if (!searchValue) {
      delete query['customerDetails.phoneNumber'];
    }
    console.log(query, 'asdw;wklml');

    const storeJobCard: IJobCard[] = await JobCard.find(query).lean();
    Logger.info(
      '<Service>:<JobCardService>:<Store Job Cards fetched successfully>'
    );
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

  async updateJobCard(
    jobCardPayload: IJobCard,
    jobCardId: string
  ): Promise<IJobCard> {
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

  async jobCardEmail(jobCardId?: string) {
    Logger.info(
      '<Service>:<JobCardService>: <Job Card Fetch: Get job card by job card id>'
    );

    const uniqueMessageId = uuidv4();

    const jobCard: IJobCard = await JobCard.findOne({
      _id: new Types.ObjectId(jobCardId)
    }).lean();
    if (!jobCard) {
      Logger.error('<Service>:<JobCardService>:<Job Card id not found>');
      throw new Error('Job Card not found');
    }

    sendToSqs(jobCard, uniqueMessageId);
    receiveFromSqs();

    return 'Email sent';
  }

  async filterJobCards(
    phoneNumber: string,
    modelName: string,
    year: string
  ): Promise<IJobCard[]> {
    Logger.info(
      '<Service>:<JobCardService>: <Store Job Card Fetch: getting all the store job cards by store id>'
    );
    let query: any = {};
    query = {
      'customerDetails.phoneNumber': phoneNumber,
      isInvoice: true,
      'customerDetails.storeCustomerVehicleInfo.modelName': new RegExp(
        modelName,
        'i'
      )
    };

    if (!_.isEmpty(year)) {
      const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
      const yearEnd = new Date(`${year}-12-31T23:59:59.999Z`);

      // Adding the createdAt condition to the query
      query.createdAt = {
        $gte: yearStart,
        $lte: yearEnd
      };
    }

    if (!phoneNumber) {
      delete query['customerDetails.phoneNumber'];
    }
    if (!modelName) {
      delete query['customerDetails.storeCustomerVehicleInfo.modelName'];
    }
    Logger.debug(query);

    // Aggregate pipeline to calculate total amount

    // const storeJobCard: IJobCard[] = await JobCard.find(query).lean();
    const storeJobCard: IJobCard[] = await JobCard.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: 'createinvoices',
          let: { jobId: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$jobCardId', '$$jobId']
                }
              }
            }
          ],
          as: 'totalAmount'
        }
      },
      {
        $unwind: {
          path: '$totalAmount'
        }
      }
    ]);
    Logger.info(
      '<Service>:<JobCardService>:<Store Job Cards fetched successfully>'
    );
    return storeJobCard;
  }
}
