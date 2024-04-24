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
import {
  receiveFromSqs,
  receiveInvoiceFromSqs,
  sendToSqs
} from '../utils/common';
import { v4 as uuidv4 } from 'uuid';
import CreateInvoice, {
  IAdditionalItems,
  ICreateInvoice
} from './../models/CreateInvoice';
import { SurepassService } from './surepass.service';
import User, { IUser } from '../models/User';
import VehicleInfo, { IVehiclesInfo } from '../models/Vehicle';
import Customer from '../models/Customer';

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
  private surepassService = container.get<SurepassService>(
    TYPES.SurepassService
  );

  async createAdditionalItems(additionalItemsPayload: ICreateInvoice) {
    Logger.info(
      '<Service>:<CreateInvoiceService>: <Invoice Creation: creating invoice>'
    );
    let { jobCardId } = additionalItemsPayload;
    const jobCard: IJobCard = await JobCard.findOne({
      _id: jobCardId
    })?.lean();
    let amount = 0;

    // Calculate amount based on line items
    jobCard.lineItems.map((item) => {
      amount += item.quantity * item.rate;
    });

    // Adjust amount based on additional items payload
    additionalItemsPayload.additionalItems.map((item: any) => {
      if (item.operation === 'discount') {
        if (item.format === 'percentage') {
          amount -= (amount * item.value) / 100;
        } else {
          amount -= item.value;
        }
      } else {
        if (item.format === 'percentage') {
          amount += (amount * item.value) / 100;
        } else {
          amount += item.value;
        }
      }
    });

    try {
      let newInvoice: ICreateInvoice = additionalItemsPayload;
      newInvoice.invoiceNumber = jobCard?.jobCardNumber;
      newInvoice.totalAmount = amount;

      Logger.info(
        '<Service>:<CreateInvoiceService>:<Invoice created successfully>'
      );
      newInvoice = await CreateInvoice.create(newInvoice);
      let { phoneNumber } = jobCard?.customerDetails[0];

      this.createOrUpdateUser(phoneNumber, jobCard);
      //  "category": "", "fuel": "", "fuelType": "PETROL", "gearType": "MANUAL", "kmsDriven": "2000", "lastInsuanceDate": "2020-10-22T18:30:00.000Z", "lastServiceDate": "2023-11-14T07:03:33.476Z", "manufactureYear": "8/2019", "modelName": "ACCESS 125", "ownerShip": "1", "purpose": "OWNED", "userId": "63aadcd071f7e310475492f1", "vehicleImageList": [], "vehicleNumber": "DL8SCS6791"}
      return newInvoice;
    } catch (error) {
      Logger.error(
        '<Service>:<CreateInvoiceService>:<Error creating invoice>',
        error
      );
      throw error;
    }
  }

  async createOrUpdateUser(phoneNumber: string, jobCard: any) {
    let updatedPhoneNumber = `+91${phoneNumber}`;
    const userFields = {
      updatedPhoneNumber,
      role: 'USER'
    };
    const newUser = await User.findOneAndUpdate(
      { phoneNumber: updatedPhoneNumber, role: 'USER' },
      userFields,
      { upsert: true, new: true }
    );
    await this.createCustomer(updatedPhoneNumber, jobCard);
  }

  async createCustomer(updatedPhoneNumber: string, jobCard: any) {
    let customer = await Customer.findOne({
      phoneNumber: updatedPhoneNumber
    });
    console.log(customer,"wlekr")
    let newCustomer;
    if (!customer) {
      let customerDetails = {
        fullName: jobCard?.customerDetails[0]?.name,
        email: jobCard?.customerDetails[0]?.email,
        phoneNumber: updatedPhoneNumber
      };
      newCustomer = await Customer.create(customerDetails);
    }
    
    console.log(newCustomer,"wfr;ekl")
    await this.createVehicle(jobCard, customer, newCustomer);
  }

  async createVehicle(jobCard: any, customer: any, newCustomer: any) {
    let vehicleDetailsFetch =
    jobCard?.customerDetails[0]?.storeCustomerVehicleInfo[0];
    if (vehicleDetailsFetch?.registeredVehicle === 'registered') {
      let checkExistingVehicle: IVehiclesInfo = await VehicleInfo.findOne({
        vehicleNumber: vehicleDetailsFetch?.vehicleNumber,
        userId: newCustomer?._id || customer?._id
      });
        if (!checkExistingVehicle) {
          const vehicleNumber = vehicleDetailsFetch?.vehicleNumber;
          const vehicleDetails = await this.surepassService.getRcDetails(
            vehicleNumber
          );
          let addVehicleDetails = {
            userId: newCustomer?._id || customer?._id,
            brand: vehicleDetails?.maker_description,
            fuelType: vehicleDetails?.fuel_type,
            vehicleType:
              jobCard?.customerDetails[0]?.storeCustomerVehicleInfo[0]
                ?.vehicleType,
            vehicleNumber: vehicleDetails?.rc_number,
            purpose: 'OWNED',
            modelName: vehicleDetails?.maker_model,
            manufactureYear: vehicleDetails?.manufacturing_date,
            ownership: vehicleDetails?.owner_number,
            vehicleImageList:
              jobCard?.customerDetails[0]?.storeCustomerVehicleInfo[0]
                ?.vehicleImageList,
            lastInsuanceDate: new Date(vehicleDetails?.insurance_upto)
          };
          const newVehicle: IVehiclesInfo = await VehicleInfo.create(
            addVehicleDetails
          );
        }
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

    const storeJobCard: ICreateInvoice[] = await CreateInvoice.find({
      storeId
    }).lean();
    Logger.info(
      '<Service>:<CreateInvoiceService>:<Store Job Cards fetched successfully>'
    );
    return storeJobCard;
  }

  async invoiceEmail(invoiceId?: string) {
    Logger.info(
      '<Service>:<CreateInvoiceService>: <Invoice Fetch: Get invoice by invoice id>'
    );

    const uniqueMessageId = uuidv4();

    const invoiceCard: ICreateInvoice = await CreateInvoice.findOne({
      _id: new Types.ObjectId(invoiceId)
    }).lean();
    if (!invoiceCard) {
      Logger.error('<Service>:<CreateInvoiceService>:<Invoice id not found>');
      throw new Error('Job Card not found');
    }

    sendToSqs(invoiceCard, uniqueMessageId);
    receiveInvoiceFromSqs();

    return 'Email sent';
  }
}
