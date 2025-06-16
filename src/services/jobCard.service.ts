/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
import { injectable } from 'inversify';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import Request from '../types/request';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import JobCard, { IJobCard, ILineItem, JobStatus } from './../models/JobCard';
import Store, { IStore } from '../models/Store';
import { S3Service } from './s3.service';
import _, { isEmpty } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { SQSService } from './sqs.service';
import { SQSEvent } from '../enum/sqsEvent.enum';
import CreateInvoice from '../models/CreateInvoice';
import { AdminRole } from '../models/Admin';
import { SPEmployeeService } from './spEmployee.service';
import { UserDefinedMessageSubscriptionInstance } from 'twilio/lib/rest/api/v2010/account/call/userDefinedMessageSubscription';

require('dotenv').config();

// AWS.config.update({
//   accessKeyId: s3Config.AWS_KEY_ID,
//   secretAccessKey: s3Config.ACCESS_KEY,
//   region: 'ap-south-1'
// });

// const sqs = new AWS.SQS();
// const ses = new AWS.SES();
@injectable()
export class JobCardService {
  private sqsService = container.get<SQSService>(TYPES.SQSService);
  private spEmployeeService = container.get<SPEmployeeService>(
    TYPES.SPEmployeeService
  );

  async create(jobCardPayload: IJobCard, req: Request): Promise<IJobCard> {
    Logger.info(
      '<Service>:<JobCardService>: <JobCard Creation: creating new jobcard>'
    );

    // check if store id exist
    const { storeId } = jobCardPayload;
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
    });
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

    if (!storeId) {
      delete query.storeId;
    }
    if (!searchValue) {
      delete query['customerDetails.storeCustomerVehicleInfo.vehicleNumber'];
    }
    if (!searchValue) {
      delete query['customerDetails.phoneNumber'];
    }

    const storeJobCard: IJobCard[] = await JobCard.find(query);
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
    });
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

    const jobCard: IJobCard = await JobCard.findOne({
      _id: new Types.ObjectId(jobCardId)
    });
    if (!jobCard) {
      Logger.error('<Service>:<JobCardService>:<Job Card id not found>');
      throw new Error('Job Card not found');
    }
    const sqsMessage = await this.sqsService.createMessage(
      SQSEvent.JOB_CARD,
      jobCard
    );

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

    // const storeJobCard: IJobCard[] = await JobCard.find(query);
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

  async countAllJobCard(reqPayload: any): Promise<any> {
    Logger.info('<Service>:<JobCardService>:<count all Job Cards>');

    const dateFilter: any = {};
    if (reqPayload.startDate) {
      const start = new Date(reqPayload.startDate);
      start.setUTCHours(0, 0, 0, 0);
      dateFilter.$gte = new Date(start);
    }
    if (reqPayload.endDate) {
      const end = new Date(reqPayload.endDate);
      end.setUTCHours(23, 59, 59, 999);
      console.log(end, 'dmerkfm');
      console.log(new Date(end), 'dmerkfm');
      dateFilter.$lte = new Date(end);
    }

    const query: any = {};
    const matchQuery: any = {};

    if (Object.keys(dateFilter).length) {
      query.createdAt = dateFilter;
      matchQuery.createdAt = dateFilter;
    }

    if (reqPayload?.state) {
      query['storeDetail.contactInfo.state'] = reqPayload.state;
      matchQuery['storeDetail.contactInfo.state'] = reqPayload.state;
    }
    if (reqPayload?.city) {
      query['storeDetail.contactInfo.city'] = reqPayload.city;
      matchQuery['storeDetail.contactInfo.city'] = reqPayload.city;
    }
    if (reqPayload.searchText) {
      query.$or = [
        { storeId: new RegExp(reqPayload.searchText, 'i') },
        {
          'customerDetails.phoneNumber': new RegExp(reqPayload.searchText, 'i')
        },
        {
          'customerDetails.storeCustomerVehicleInfo.vehicleNumber': new RegExp(
            reqPayload.searchText,
            'i'
          )
        }
      ];
      matchQuery.$or = [
        { storeId: new RegExp(reqPayload.searchText, 'i') },
        {
          'jobCardDetail.customerDetails.phoneNumber': new RegExp(
            reqPayload.searchText,
            'i'
          )
        },
        {
          'jobCardDetail.customerDetails.storeCustomerVehicleInfo.vehicleNumber':
            new RegExp(reqPayload.searchText, 'i')
        }
      ];
    }

    // Aggregate query to fetch total, active, and inactive counts in one go
    const totalJobCard = await JobCard.aggregate([
      {
        $lookup: {
          from: 'stores',
          localField: 'storeId',
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
      {
        $count: 'total' // Proper way to count in aggregation
      }
    ]);
    const totalInvoice = await CreateInvoice.aggregate([
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
        $match: matchQuery
      },
      {
        $count: 'total' // Proper way to count in aggregation
      }
    ]);
    // const totalInvoice = await JobCard.find({
    //   isInvoice: true
    // }).countDocuments();
    const totalCount = {
      totalJobCard: totalJobCard[0]?.total || 0,
      totalInvoice: totalInvoice[0]?.total || 0
    };
    return totalCount;
  }

  async getAllJobCardPaginated(
    pageNo?: number,
    pageSize?: number,
    startDate?: string,
    endDate?: string,
    searchText?: string,
    state?: string,
    city?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<JobCardService>:<Search and Filter job card service initiated>'
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
          'customerDetails.phoneNumber': new RegExp(searchText, 'i')
        },
        {
          'customerDetails.storeCustomerVehicleInfo.vehicleNumber': new RegExp(
            searchText,
            'i'
          )
        }
      ];
    }

    let jobCards: any = await JobCard.aggregate([
      {
        $lookup: {
          from: 'stores',
          localField: 'storeId',
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
      }
    ]);

    return jobCards;
  }

  async getJobCardTotalPaymentAnalytics(
    startDate: string,
    endDate: string,
    state: string,
    city: string,
    searchText: string,
    oemUserId?: string,
    role?: string,
    userName?: string,
    oemId?: string,
    employeeId?: string,
  ) {
    Logger.info(
      '<Service>:<JobCardService>:<Search and Filter job card analytics service initiated>'
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
      dateFilter.$lte = new Date(end);
    }

    const query: any = {};

    if (Object.keys(dateFilter).length) {
      query.createdAt = dateFilter;
    }

    if (searchText) {
      query.$or = [
        { storeId: new RegExp(searchText, 'i') },
        {
          'customerDetails.phoneNumber': new RegExp(searchText, 'i')
        },
        {
          'customerDetails.storeCustomerVehicleInfo.vehicleNumber': new RegExp(
            searchText,
            'i'
          )
        }
      ];
    }

    if(oemUserId){
      query['storeDetail.oemUserName'] = oemUserId;
    };

    if (role === AdminRole.OEM) {
      query['storeDetail.oemUserName'] = userName;
    };

    if (role === AdminRole.EMPLOYEE && oemId !== 'SERVICEPLUG') {
      query['storeDetail.oemUserName'] = oemId;
    };

    if ( role === AdminRole.EMPLOYEE && !isEmpty(employeeId)) {
      const employeeDetails =
        await this.spEmployeeService.getEmployeeByEmployeeId(
          employeeId,
          oemId
        );
      if (employeeDetails) {
        query['storeDetail.contactInfo.state'] = {
          $in: employeeDetails.state.map((stateObj) => stateObj.name)
        };
        if (!isEmpty(employeeDetails?.city)) {
          query['storeDetail.contactInfo.city'] = {
            $in: employeeDetails.city.map((cityObj) => cityObj.name)
          };
        }
      }
    }

    if (state) {
      query['storeDetail.contactInfo.state'] = state;
    }
    if (city) {
      query['storeDetail.contactInfo.city'] = city;
    }

    const result = await JobCard.aggregate([
      {
        $lookup: {
          from: 'stores',
          localField: 'storeId',
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
      { $match: query },
      // Calculate line item amounts
      {
        $addFields: {
          totalAmount: {
            $sum: {
              $map: {
                input: '$lineItems',
                as: 'item',
                in: { $multiply: ['$$item.quantity', '$$item.rate'] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          totalData: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      // Format output
      {
        $project: {
          date: '$_id',
          totalData: 1,
          totalAmount: 1,
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    return result;
  }

  async overallPayment() {
    Logger.info(
      '<Service>:<JobCardService>:<Search and Filter overall payments service initiated>'
    );

    const jobCardResult = await JobCard.aggregate([
      {
        $addFields: {
          totalAmount: {
            $sum: {
              $map: {
                input: '$lineItems',
                as: 'item',
                in: { $multiply: ['$$item.quantity', '$$item.rate'] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null, // Group all documents together
          totalJobCards: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      {
        $project: {
          _id: 0, // Exclude the _id field
          totalJobCards: 1,
          totalAmount: 1
        }
      }
    ]);
    const invoiceResult = await CreateInvoice.aggregate([
      // Group by day and calculate totals
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmounts: { $sum: '$totalAmount' }
        }
      },
      // Format output
      {
        $project: {
          _id: 0, // Exclude the _id field
          totalInvoices: 1,
          totalAmounts: 1
        }
      }
    ]);

    console.log(invoiceResult, 'derfre', jobCardResult);
    let result = {
      ...jobCardResult[0],
      ...invoiceResult[0]
    };

    return result;
  }

  async getOverallUniqueStores() {
    Logger.info(
      '<Service>:<JobCardService>:<Get overall unique stores service initiated>'
    );

    const jobCardUniqueStores = await JobCard.aggregate([
      {
        $group: {
          _id: '$storeId' // Assuming 'storeId' is the field that identifies stores
          // If you need to group by store name instead, use "$storeName" or similar
        }
      },
      {
        $count: 'jobCardUniqueStores'
      }
    ]);
    const invoiceUniqueStores = await CreateInvoice.aggregate([
      {
        $group: {
          _id: '$storeId' // Assuming 'storeId' is the field that identifies stores
          // If you need to group by store name instead, use "$storeName" or similar
        }
      },
      {
        $count: 'invoiceUniqueStores'
      }
    ]);

    console.log(jobCardUniqueStores, 'jobCardUniqueStores');
    console.log(invoiceUniqueStores, 'dmkemfkdmr');

    const result = {
      jobCardUniqueStores: jobCardUniqueStores[0]?.jobCardUniqueStores || 0,
      invoiceUniqueStores: invoiceUniqueStores[0]?.invoiceUniqueStores || 0
      // If you want total unique stores across both collections, you would need a different approach
      // totalUniqueStores: ... (see note below)
    };

    // If no documents exist, return 0 instead of an empty array
    return result;
  }

  async getUniqueStores(reqPayload: any): Promise<any> {
    Logger.info(
      '<Service>:<JobCardService>:<Get overall unique stores service initiated>'
    );

    const dateFilter: any = {};
    if (reqPayload.startDate) {
      const start = new Date(reqPayload.startDate);
      start.setUTCHours(0, 0, 0, 0);
      dateFilter.$gte = new Date(start);
    }
    if (reqPayload.endDate) {
      const end = new Date(reqPayload.endDate);
      end.setUTCHours(23, 59, 59, 999);
      console.log(end, 'dmerkfm');
      console.log(new Date(end), 'dmerkfm');
      dateFilter.$lte = new Date(end);
    }

    const query: any = {};
    const matchQuery: any = {};

    if (Object.keys(dateFilter).length) {
      query.createdAt = dateFilter;
      matchQuery.createdAt = dateFilter;
    }

    if (reqPayload?.state) {
      query['storeDetail.contactInfo.state'] = reqPayload.state;
      matchQuery['storeDetail.contactInfo.state'] = reqPayload.state;
    }
    if (reqPayload?.city) {
      query['storeDetail.contactInfo.city'] = reqPayload.city;
      matchQuery['storeDetail.contactInfo.city'] = reqPayload.city;
    }
    if (reqPayload.searchText) {
      query.$or = [
        { storeId: new RegExp(reqPayload.searchText, 'i') },
        {
          'customerDetails.phoneNumber': new RegExp(reqPayload.searchText, 'i')
        },
        {
          'customerDetails.storeCustomerVehicleInfo.vehicleNumber': new RegExp(
            reqPayload.searchText,
            'i'
          )
        }
      ];
      matchQuery.$or = [
        { storeId: new RegExp(reqPayload.searchText, 'i') },
        {
          'jobCardDetail.customerDetails.phoneNumber': new RegExp(
            reqPayload.searchText,
            'i'
          )
        },
        {
          'jobCardDetail.customerDetails.storeCustomerVehicleInfo.vehicleNumber':
            new RegExp(reqPayload.searchText, 'i')
        }
      ];
    }

    const jobCardUniqueStores = await JobCard.aggregate([
      {
        $lookup: {
          from: 'stores',
          localField: 'storeId',
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
      {
        $group: {
          _id: '$storeId' // Assuming 'storeId' is the field that identifies stores
          // If you need to group by store name instead, use "$storeName" or similar
        }
      },
      {
        $count: 'jobCardUniqueStores'
      }
    ]);
    const invoiceUniqueStores = await CreateInvoice.aggregate([
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
        $match: matchQuery
      },
      {
        $group: {
          _id: '$storeId' // Assuming 'storeId' is the field that identifies stores
          // If you need to group by store name instead, use "$storeName" or similar
        }
      },
      {
        $count: 'invoiceUniqueStores'
      }
    ]);

    console.log(jobCardUniqueStores, 'jobCardUniqueStores');
    console.log(invoiceUniqueStores, 'dmkemfkdmr');

    const result = {
      jobCardUniqueStores: jobCardUniqueStores[0]?.jobCardUniqueStores || 0,
      invoiceUniqueStores: invoiceUniqueStores[0]?.invoiceUniqueStores || 0
      // If you want total unique stores across both collections, you would need a different approach
      // totalUniqueStores: ... (see note below)
    };

    // If no documents exist, return 0 instead of an empty array
    return result;
  }

  async getHighestJobCards(reqPayload: any): Promise<any> {
    Logger.info(
      '<Service>:<JobCardService>:<Get highest job cards service initiated>'
    );
  
    try {
      const dateFilter: any = {};
      if (reqPayload.startDate) {
        const start = new Date(reqPayload.startDate);
        start.setUTCHours(0, 0, 0, 0);
        dateFilter.$gte = new Date(start);
      }
      if (reqPayload.endDate) {
        const end = new Date(reqPayload.endDate);
        end.setUTCHours(23, 59, 59, 999);
        dateFilter.$lte = new Date(end);
      }
  
      const matchQuery: any = {};
      if (Object.keys(dateFilter).length) {
        matchQuery.createdAt = dateFilter;
      }
  
      // Common pipeline stages
      const commonStages = [
        { $match: matchQuery },
        {
          $lookup: {
            from: "stores",
            localField: "storeId",
            foreignField: "storeId",
            as: "storeDetails"
          }
        },
        { $unwind: "$storeDetails" }
      ];
  
      // 1. Top Stores Pipeline
      const topStoresPipeline: any = [
        ...commonStages,
        {
          $group: {
            _id: {
              storeId: "$storeDetails.storeId",
              storeName: "$storeDetails.name"
            },
            jobCardCount: { $sum: 1 },
          }
        },
        { $sort: { jobCardCount: -1 } },
        { $limit: 20 },
        {
          $project: {
            _id: 0,
            storeId: "$_id.storeId",
            storeName: "$_id.storeName",
            city: 1,
            state: 1,
            jobCardCount: 1
          }
        }
      ];
  
      // 2. Top Cities Pipeline
      const topCitiesPipeline: any = [
        ...commonStages,
        {
          $group: {
            _id: {
              city: "$storeDetails.contactInfo.city",
              state: "$storeDetails.contactInfo.state"
            },
            jobCardCount: { $sum: 1 }
          }
        },
        { $sort: { jobCardCount: -1 } },
        { $limit: 20 },
        {
          $project: {
            _id: 0,
            city: "$_id.city",
            state: "$_id.state",
            jobCardCount: 1
          }
        }
      ];
  
      // 3. Top States Pipeline
      const topStatesPipeline: any = [
        ...commonStages,
        {
          $group: {
            _id: {
              state: "$storeDetails.contactInfo.state"
            },
            jobCardCount: { $sum: 1 }
          }
        },
        { $sort: { jobCardCount: -1 } },
        { $limit: 20 },
        {
          $project: {
            _id: 0,
            state: "$_id.state",
            jobCardCount: 1
          }
        }
      ];
  
      // Execute all pipelines in parallel
      const [topStores, topCities, topStates] = await Promise.all([
        JobCard.aggregate(topStoresPipeline),
        JobCard.aggregate(topCitiesPipeline),
        JobCard.aggregate(topStatesPipeline)
      ]);
  
      return {
        topStores,
        topCities,
        topStates
      };
      
    } catch (error: any) {
      Logger.error('<Service>:<JobCardService>:<Error in getHighestJobCards>:', error);
      throw error;
    }
  }
}
