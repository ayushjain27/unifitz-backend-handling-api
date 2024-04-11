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
import { receiveFromSqs, receiveInvoiceFromSqs, sendToSqs } from '../utils/common';
import { v4 as uuidv4 } from 'uuid';
import CreateInvoice, {
  IAdditionalItems,
  ICreateInvoice
} from './../models/CreateInvoice';

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
export class CreateInvoiceService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async createAdditionalItems(additionalItemsPayload: ICreateInvoice) {
    Logger.info(
      '<Service>:<CreateInvoiceService>: <Invoice Creation: creating invoice>'
    );
    let { jobCardId } = additionalItemsPayload;
    const jobCard: IJobCard = await JobCard.findOne({
        _id: jobCardId
    })?.lean();

    console.log(jobCard,"cdwkl")

    try {
      let newInvoice: ICreateInvoice = additionalItemsPayload;
      newInvoice.invoiceNumber = jobCard?.jobCardNumber;

      Logger.info(
        '<Service>:<CreateInvoiceService>:<Invoice created successfully>'
      );
      newInvoice = await CreateInvoice.create(newInvoice);
      return newInvoice;
    } catch (error) {
      Logger.error(
        '<Service>:<CreateInvoiceService>:<Error creating invoice>',
        error
      );
      throw error;
    }
  }

  async getInvoiceById(id: string): Promise<ICreateInvoice> {
    Logger.info(
      '<Service>:<CreateInvoiceService>: <Invoice Fetch: getting all the store job cards by store id>'
    );

    const invoiceDetail: ICreateInvoice = await CreateInvoice.findOne({
      _id: new Types.ObjectId(id)
    }).lean();
    Logger.info(
      '<Service>:<CreateInvoiceService>:<Store Job Cards fetched successfully>'
    );
    return invoiceDetail;
  }

  async getInvoicesByStoreId(storeId: string): Promise<ICreateInvoice[]> {
    Logger.info(
      '<Service>:<CreateInvoiceService>: <Store Invoices Fetch: getting all the store invoices by store id>'
    );

    const storeJobCard: ICreateInvoice[] = await CreateInvoice.find({ storeId }).lean();
    Logger.info(
      '<Service>:<CreateInvoiceService>:<Store Job Cards fetched successfully>'
    );
    return storeJobCard;
  }

    async invoiceEmail(invoiceId?: string) {
      Logger.info(
        '<Service>:<JobCardService>: <Job Card Fetch: Get job card by job card id>'
      );

      const uniqueMessageId = uuidv4();

      const invoiceCard: ICreateInvoice = await CreateInvoice.findOne({
        _id: new Types.ObjectId(invoiceId)
      }).lean();
      if (!invoiceCard) {
        Logger.error('<Service>:<JobCardService>:<Job Card id not found>');
        throw new Error('Job Card not found');
      }

      sendToSqs(invoiceCard, uniqueMessageId);
      receiveInvoiceFromSqs();

      return 'Email sent';
    }
}
