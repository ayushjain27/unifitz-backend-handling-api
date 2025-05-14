/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-var-requires */
import { injectable } from 'inversify';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import JobCard, { IJobCard } from './../models/JobCard';
import { S3Service } from './s3.service';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import CreateInvoice, { ICreateInvoice } from './../models/CreateInvoice';
import { SurepassService } from './surepass.service';
import { SQSService } from './sqs.service';
import { SQSEvent } from '../enum/sqsEvent.enum';

const nodemailer = require('nodemailer');
require('dotenv').config();

// AWS.config.update({
//   accessKeyId: s3Config.AWS_KEY_ID,
//   secretAccessKey: s3Config.ACCESS_KEY,
//   region: 'ap-south-1'
// });

// const sqs = new AWS.SQS();
// const ses = new AWS.SES();
@injectable()
export class CreateInvoiceService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private surepassService = container.get<SurepassService>(
    TYPES.SurepassService
  );
  private sqsService = container.get<SQSService>(TYPES.SQSService);

  async createAdditionalItems(additionalItemsPayload: ICreateInvoice) {
    Logger.info(
      '<Service>:<CreateInvoiceService>: <Invoice Creation: creating invoice>'
    );
    const { jobCardId } = additionalItemsPayload;
    const jobCard: IJobCard = await JobCard.findOne({
      _id: jobCardId
    });
    let amount = 0;

    // Calculate amount based on line items
    if (jobCard?.lineItems) {
      jobCard.lineItems.map((item) => {
        amount += item.quantity * item.rate;
      });
    }

    // Adjust amount based on additional items payload
    if (additionalItemsPayload.additionalItems) {
      additionalItemsPayload.additionalItems.map((item: any) => {
        if (item.operation === 'discount') {
          if (item.format === 'percentage') {
            amount -= Number((amount * item.value) / 100);
          } else {
            amount -= Number(item.value);
          }
        } else {
          if (item.format === 'percentage') {
            amount += Number((amount * item.value) / 100);
          } else {
            amount += Number(item.value);
          }
        }
      });
    }

    try {
      let newInvoice: ICreateInvoice = additionalItemsPayload;
      newInvoice.invoiceNumber = jobCard?.jobCardNumber;
      newInvoice.totalAmount = amount;

      Logger.info(
        '<Service>:<CreateInvoiceService>:<Invoice created successfully>'
      );
      newInvoice = await CreateInvoice.create(newInvoice);
      const { phoneNumber } = jobCard?.customerDetails[0];
      const customPhoneNumber = `+91${phoneNumber}`;
      const data = {
        title: 'Invoice Generated',
        body: 'Your invoice has been generated',
        phoneNumber: customPhoneNumber,
        role: 'USER',
        type: 'INVOICE'
      };
      const sqsMessage = await this.sqsService.createMessage(
        SQSEvent.NOTIFICATION,
        data
      );

      // const notificationData = {
      //   title: 'Invoice Generated',
      //   body: `Your invoice has been generated`,
      //   phoneNumber: customPhoneNumber,
      //   type: "NEW_VEHICLE",
      //   role: "USER",
      //   customerId: reqBody?.storeDetails?.storeId
      // }

      // let notification = await this.notificationService.createNotification(notificationData)

      // this.createOrUpdateUser(phoneNumber, jobCard);
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

  // async createOrUpdateUser(phoneNumber: string, jobCard: any) {
  //   const updatedPhoneNumber = `+91${phoneNumber}`;
  //   const userFields = {
  //     updatedPhoneNumber,
  //     role: 'USER'
  //   };
  //   const newUser = await User.findOneAndUpdate(
  //     { phoneNumber: updatedPhoneNumber, role: 'USER' },
  //     userFields,
  //     { upsert: true, new: true }
  //   );
  //   await this.createCustomer(updatedPhoneNumber, jobCard);
  // }

  // async createCustomer(updatedPhoneNumber: string, jobCard: any) {
  //   const customer = await Customer.findOne({
  //     phoneNumber: updatedPhoneNumber
  //   });
  //   console.log(customer, 'wlekr');
  //   let newCustomer;
  //   if (!customer) {
  //     const customerDetails = {
  //       fullName: jobCard?.customerDetails[0]?.name,
  //       email: jobCard?.customerDetails[0]?.email,
  //       phoneNumber: updatedPhoneNumber
  //     };
  //     newCustomer = await Customer.create(customerDetails);
  //   }

  //   console.log(newCustomer, 'wfr;ekl');
  //   await this.createVehicle(jobCard, customer, newCustomer);
  // }

  // async createVehicle(jobCard: any, customer: any, newCustomer: any) {
  //   const vehicleDetailsFetch =
  //     jobCard?.customerDetails[0]?.storeCustomerVehicleInfo[0];
  //   if (vehicleDetailsFetch?.registeredVehicle === 'registered') {
  //     const checkExistingVehicle: IVehiclesInfo = await VehicleInfo.findOne({
  //       vehicleNumber: vehicleDetailsFetch?.vehicleNumber,
  //       userId: newCustomer?._id || customer?._id
  //     });
  //     if (!checkExistingVehicle) {
  //       const vehicleNumber = vehicleDetailsFetch?.vehicleNumber;
  //       const vehicleDetails = await this.surepassService.getRcDetails(
  //         vehicleNumber
  //       );
  //       const addVehicleDetails = {
  //         userId: newCustomer?._id || customer?._id,
  //         brand: vehicleDetails?.maker_description,
  //         fuelType: vehicleDetails?.fuel_type,
  //         vehicleType:
  //           jobCard?.customerDetails[0]?.storeCustomerVehicleInfo[0]
  //             ?.vehicleType,
  //         vehicleNumber: vehicleDetails?.rc_number,
  //         purpose: 'OWNED',
  //         modelName: vehicleDetails?.maker_model,
  //         manufactureYear: vehicleDetails?.manufacturing_date,
  //         ownership: vehicleDetails?.owner_number,
  //         vehicleImageList:
  //           jobCard?.customerDetails[0]?.storeCustomerVehicleInfo[0]
  //             ?.vehicleImageList,
  //         lastInsuanceDate: new Date(vehicleDetails?.insurance_upto)
  //       };
  //       const newVehicle: IVehiclesInfo = await VehicleInfo.create(
  //         addVehicleDetails
  //       );
  //     }
  //   }
  // }

  async getInvoiceById(id: string): Promise<ICreateInvoice> {
    Logger.info(
      '<Service>:<CreateInvoiceService>: <Invoice Fetch: getting all the store job cards by store id>'
    );

    const invoiceDetail: ICreateInvoice = await CreateInvoice.findOne({
      _id: new Types.ObjectId(id)
    });
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
    });
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
    });
    if (!invoiceCard) {
      Logger.error('<Service>:<CreateInvoiceService>:<Invoice id not found>');
      throw new Error('Job Card not found');
    }
    const sqsMessage = await this.sqsService.createMessage(
      SQSEvent.INVOICE,
      invoiceCard
    );

    return 'Email sent';
  }

  async getAllInvoicePaginated(
    pageNo?: number,
    pageSize?: number,
    startDate?: string,
    endDate?: string,
    searchText?: string,
    state?: string,
    city?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<CreateInvoiceService>:<Search and Filter invoice service initiated>'
    );

    const dateFilter: any = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);
      dateFilter.$gte = new Date(start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      console.log(end, 'dmerkfm');
      console.log(new Date(end), 'dmerkfm');
      dateFilter.$lte = new Date(end);
    }

    const query: any = {};

    if (Object.keys(dateFilter).length) {
      query.createdAt = dateFilter;
    }

    if (state) {
      query['storeDetail.contactInfo.state'] = state;
    }
    if (city) {
      query['storeDetail.contactInfo.city'] = city;
    }

    if (searchText) {
      query.$or = [
        { storeId: new RegExp(searchText, 'i') },
        {
          'jobCardDetail.customerDetails.phoneNumber': new RegExp(
            searchText,
            'i'
          )
        },
        {
          'jobCardDetail.customerDetails.storeCustomerVehicleInfo.vehicleNumber':
            new RegExp(searchText, 'i')
        }
      ];
    }

    let invoices: any = await CreateInvoice.aggregate([
      {
        $lookup: {
          from: 'jobcards',
          let: { jobCardIdStr: '$jobCardId' }, // string field from CreateInvoice
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toString: '$_id' }, // convert ObjectId to string
                    '$$jobCardIdStr' // compare with string from CreateInvoice
                  ]
                }
              }
            }
          ],
          as: 'jobCardDetail'
        }
      },
      {
        $unwind: {
          path: '$jobCardDetail',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'stores',
          localField: 'jobCardDetail.storeId',
          foreignField: 'storeId',
          as: 'storeDetail'
        }
      },
      {
        $unwind: {
          path: '$storeDetail', // Fixed from 'partnerDetail' to 'storeDetail'
          preserveNullAndEmptyArrays: true // Added to include docs even if lookup fails
        }
      },
      {
        $match: query
      },
      { $sort: { createdAt: -1 } }, // Sort in descending order
      {
        $skip: pageNo * pageSize
      },
      {
        $limit: pageSize
      },
      {
        $addFields: {
          convertedJobCardId: { $toObjectId: "$jobCardId" } // Convert string to ObjectId
        }
      },
      {
        $lookup: {
          from: 'jobcards',
          localField: 'convertedJobCardId',
          foreignField: '_id',
          as: 'jobCardDetails'
        }
      },
      { 
        $unwind: {
          path: '$jobCardDetails',
          preserveNullAndEmptyArrays: false
        } 
      },
      { $project: { convertedJobCardId: 0 } } // Remove temporary field
    ]);
    return invoices;
  }
}
