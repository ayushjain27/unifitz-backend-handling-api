/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-var-requires */
import { injectable } from 'inversify';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import JobCard, { IJobCard } from './../models/JobCard';
import { S3Service } from './s3.service';
import _, { isEmpty } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import CreateInvoice, { ICreateInvoice } from './../models/CreateInvoice';
import { SurepassService } from './surepass.service';
import { SQSService } from './sqs.service';
import { SQSEvent } from '../enum/sqsEvent.enum';
import { AdminRole } from '../models/Admin';
import { SPEmployeeService } from './spEmployee.service';
import Invoice, { IInvoice } from '../models/Invoice';
import { AnyNsRecord } from 'dns';

const nodemailer = require('nodemailer');
require('dotenv').config();

@injectable()
export class CreateInvoiceService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private surepassService = container.get<SurepassService>(
    TYPES.SurepassService
  );
  private spEmployeeService = container.get<SPEmployeeService>(
    TYPES.SPEmployeeService
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
    city?: string,
    role?: string,
    userName?: string,
    oemId?: string,
    employeeId?: string
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
      dateFilter.$lte = new Date(end);
    }

    const query: any = {};
    const newInvoiceQuery: any = {};

    if (Object.keys(dateFilter).length) {
      query.createdAt = dateFilter;
      newInvoiceQuery.createdAt = dateFilter;
    }

    if (role === AdminRole.OEM) {
      query['storeDetail.oemUserName'] = userName;
      newInvoiceQuery['storeDetail.oemUserName'] = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      if (oemId !== 'SERVICEPLUG') {
        query['storeDetail.oemUserName'] = oemId;
      }
      const employeeDetails =
        await this.spEmployeeService.getEmployeeByEmployeeId(employeeId, oemId);
      if (employeeDetails) {
        query['storeDetail.contactInfo.state'] = {
          $in: employeeDetails.state.map((stateObj) => stateObj.name)
        };
        newInvoiceQuery['storeDetail.contactInfo.state'] = {
          $in: employeeDetails.state.map((stateObj) => stateObj.name)
        };
        if (!isEmpty(employeeDetails?.city)) {
          query['storeDetail.contactInfo.city'] = {
            $in: employeeDetails.city.map((cityObj) => cityObj.name)
          };
          newInvoiceQuery['storeDetail.contactInfo.city'] = {
            $in: employeeDetails.city.map((cityObj) => cityObj.name)
          };
        }
      }
    }

    if (state) {
      query['storeDetail.contactInfo.state'] = state;
      newInvoiceQuery['storeDetail.contactInfo.state'] = state;
    }
    if (city) {
      query['storeDetail.contactInfo.city'] = city;
      newInvoiceQuery['storeDetail.contactInfo.city'] = city;
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
      newInvoiceQuery.$or = [
        { storeId: new RegExp(searchText, 'i') },
        {
          phoneNumber: new RegExp(searchText, 'i')
        },
        {
          vehicleNumber: new RegExp(searchText, 'i')
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
        $addFields: {
          convertedJobCardId: { $toObjectId: '$jobCardId' } // Convert string to ObjectId
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
    let newInvoices: any = await Invoice.aggregate([
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
        $match: newInvoiceQuery
      },
      {
        $limit: pageSize
      }
    ]);

    const combined = [...invoices, ...newInvoices].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // 4. Apply pagination
    const startIdx = pageNo * pageSize;
    const paginatedResults = combined.slice(startIdx, startIdx + pageSize);

    return paginatedResults;
  }

  async getInvoiceTotalPaymentAnalytics(
    startDate: string,
    endDate: string,
    state: string,
    city: string,
    searchText: string,
    oemUserId: string,
    role?: string,
    userName?: string,
    oemId?: string,
    employeeId?: string
  ) {
    Logger.info(
      '<Service>:<CreateInvoiceService>:<Search and Filter invoice analytics service initiated>'
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
    const invoiceQuery: any = {};

    if (Object.keys(dateFilter).length) {
      query.createdAt = dateFilter;
      invoiceQuery.createdAt = dateFilter;
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
      invoiceQuery.$or = [
        { storeId: new RegExp(searchText, 'i') },
        {
          phoneNumber: new RegExp(searchText, 'i')
        },
        {
          vehicleNumber: new RegExp(searchText, 'i')
        }
      ];
    }

    if (oemUserId) {
      query['storeDetail.oemUserName'] = oemUserId;
      invoiceQuery['storeDetail.oemUserName'] = oemUserId;
    }

    if (role === AdminRole.OEM) {
      query['storeDetail.oemUserName'] = userName;
      invoiceQuery['storeDetail.oemUserName'] = userName;
    }

    if (role === AdminRole.EMPLOYEE && oemId !== 'SERVICEPLUG') {
      query['storeDetail.oemUserName'] = oemId;
      invoiceQuery['storeDetail.oemUserName'] = oemId;
    }

    if (role === AdminRole.EMPLOYEE && !isEmpty(employeeId)) {
      const employeeDetails =
        await this.spEmployeeService.getEmployeeByEmployeeId(employeeId, oemId);
      if (employeeDetails) {
        query['storeDetail.contactInfo.state'] = {
          $in: employeeDetails.state.map((stateObj) => stateObj.name)
        };
        invoiceQuery['storeDetail.contactInfo.state'] = {
          $in: employeeDetails.state.map((stateObj) => stateObj.name)
        };
        if (!isEmpty(employeeDetails?.city)) {
          query['storeDetail.contactInfo.city'] = {
            $in: employeeDetails.city.map((cityObj) => cityObj.name)
          };
          invoiceQuery['storeDetail.contactInfo.city'] = {
            $in: employeeDetails.city.map((cityObj) => cityObj.name)
          };
        }
      }
    }

    if (state) {
      query['storeDetail.contactInfo.state'] = state;
      invoiceQuery['storeDetail.contactInfo.state'] = state;
    }
    if (city) {
      query['storeDetail.contactInfo.city'] = city;
      invoiceQuery['storeDetail.contactInfo.city'] = city;
    }

    const result = await CreateInvoice.aggregate([
      {
        $lookup: {
          from: 'jobcards',
          let: { jobCardIdStr: '$jobCardId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: '$_id' }, '$$jobCardIdStr']
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
          path: '$storeDetail',
          preserveNullAndEmptyArrays: true
        }
      },
      { $match: query },
      // Handle date field (fixing potential string/Date issues)
      {
        $addFields: {
          formattedDate: {
            $cond: {
              if: { $eq: [{ $type: '$createdAt' }, 'string'] },
              then: { $dateFromString: { dateString: '$createdAt' } },
              else: '$createdAt'
            }
          }
        }
      },
      // Group by day and calculate totals
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$formattedDate'
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
    const newInvoice = await Invoice.aggregate([
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
          path: '$storeDetail',
          preserveNullAndEmptyArrays: true
        }
      },
      { $match: query },
      // Handle date field (fixing potential string/Date issues)
      {
        $addFields: {
          formattedDate: {
            $cond: {
              if: { $eq: [{ $type: '$createdAt' }, 'string'] },
              then: { $dateFromString: { dateString: '$createdAt' } },
              else: '$createdAt'
            }
          }
        }
      },
      // Group by day and calculate totals
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$formattedDate'
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

    const combinedResults = this.combineByDate(newInvoice, result);
    return combinedResults;
  }

  async combineByDate(arr1: any, arr2: any) {
    const combined: { [key: string]: any } = {};

    // Process first array
    arr1.forEach((item: any) => {
      if (!combined[item.date]) {
        combined[item.date] = { ...item };
      } else {
        combined[item.date].totalData += item.totalData;
        combined[item.date].totalAmount += item.totalAmount;
      }
    });

    // Process second array
    arr2.forEach((item: any) => {
      if (!combined[item.date]) {
        combined[item.date] = { ...item };
      } else {
        combined[item.date].totalData += item.totalData;
        combined[item.date].totalAmount += item.totalAmount;
      }
    });

    // Convert back to array and sort by date
    return Object.values(combined).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  async getHighestInvoice(reqPayload: any) {
    Logger.info(
      '<Service>:<CreateInvoiceService>:<Get highest invoice initiated>'
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
            from: 'stores',
            localField: 'storeId',
            foreignField: 'storeId',
            as: 'storeDetails'
          }
        },
        { $unwind: '$storeDetails' }
      ];

      // 1. Top Stores Pipeline
      const topStoresPipeline: any = [
        ...commonStages,
        {
          $group: {
            _id: {
              storeId: '$storeDetails.storeId',
              storeName: '$storeDetails.name'
            },
            invoiceCount: { $sum: 1 }
          }
        },
        { $sort: { invoiceCount: -1 } },
        { $limit: 20 },
        {
          $project: {
            _id: 0,
            storeId: '$_id.storeId',
            storeName: '$_id.storeName',
            city: 1,
            state: 1,
            invoiceCount: 1
          }
        }
      ];

      // 2. Top Cities Pipeline
      const topCitiesPipeline: any = [
        ...commonStages,
        {
          $group: {
            _id: {
              city: '$storeDetails.contactInfo.city',
              state: '$storeDetails.contactInfo.state'
            },
            invoiceCount: { $sum: 1 }
          }
        },
        { $sort: { invoiceCount: -1 } },
        { $limit: 20 },
        {
          $project: {
            _id: 0,
            city: '$_id.city',
            state: '$_id.state',
            invoiceCount: 1
          }
        }
      ];

      // 3. Top States Pipeline
      const topStatesPipeline: any = [
        ...commonStages,
        {
          $group: {
            _id: {
              state: '$storeDetails.contactInfo.state'
            },
            invoiceCount: { $sum: 1 }
          }
        },
        { $sort: { invoiceCount: -1 } },
        { $limit: 20 },
        {
          $project: {
            _id: 0,
            state: '$_id.state',
            invoiceCount: 1
          }
        }
      ];

      // Execute all pipelines in parallel
      const [topStores, topCities, topStates] = await Promise.all([
        CreateInvoice.aggregate(topStoresPipeline),
        CreateInvoice.aggregate(topCitiesPipeline),
        CreateInvoice.aggregate(topStatesPipeline)
      ]);
      const [newInvocieTopStores, newInvoiceTopCities, newInvoiceTopStates] =
        await Promise.all([
          Invoice.aggregate(topStoresPipeline),
          Invoice.aggregate(topCitiesPipeline),
          Invoice.aggregate(topStatesPipeline)
        ]);

      const combinedStores = [...topStores, ...newInvocieTopStores]
        .reduce((acc, curr) => {
          const existing = acc.find(
            (item: any) => item.storeId === curr.storeId
          );
          if (existing) {
            existing.invoiceCount += curr.invoiceCount;
          } else {
            acc.push({ ...curr });
          }
          return acc;
        }, [])
        .sort((a: any, b: any) => b.invoiceCount - a.invoiceCount);

      // Combine city data
      const combinedCities = [...topCities, ...newInvoiceTopCities]
        .reduce((acc, curr) => {
          const key = `${curr.city}|${curr.state}`;
          const existing = acc.find(
            (item: any) => `${item.city}|${item.state}` === key
          );
          if (existing) {
            existing.invoiceCount += curr.invoiceCount;
          } else {
            acc.push({ ...curr });
          }
          return acc;
        }, [])
        .sort((a: any, b: any) => b.invoiceCount - a.invoiceCount);

      // Combine state data
      const combinedStates = [...topStates, ...newInvoiceTopStates]
        .reduce((acc, curr) => {
          const existing = acc.find((item: any) => item.state === curr.state);
          if (existing) {
            existing.invoiceCount += curr.invoiceCount;
          } else {
            acc.push({ ...curr });
          }
          return acc;
        }, [])
        .sort((a: any, b: any) => b.invoiceCount - a.invoiceCount);

      return {
        combinedStores,
        combinedCities,
        combinedStates
      };
    } catch (error: any) {
      Logger.error(
        '<Service>:<CreateInvoiceService>:<Error in getHighestInvoices>:',
        error
      );
      throw error;
    }
  }

  async getTotalInvoiceRevenueByStoreId(reqPayload: any) {
    Logger.info(
      '<Service>:<CreateInvoiceService>:<Get total invoice revenues by storeid initiated>'
    );
    try {
      const query: any = {
        storeId: reqPayload.storeId
      };

      const pipeline = [
        { $match: query },
        {
          $group: {
            _id: 0,
            totalAmount: { $sum: '$totalAmount' }
          }
        },
        { $project: { _id: 0, totalAmount: 1 } }
      ];

      const result = await CreateInvoice.aggregate(pipeline);
      const newInvoiceResult = await Invoice.aggregate(pipeline);

      return {
        totalAmount:
          result[0]?.totalAmount + newInvoiceResult[0]?.totalAmount || 0
      };
    } catch (error: any) {
      Logger.error(
        '<Service>:<CreateInvoiceService>:<Error in getHighestInvoices>:',
        error
      );
      throw error;
    }
  }

  async getInvoiceRevenueByStoreId(reqPayload: any) {
    Logger.info(
      '<Service>:<CreateInvoiceService>:<Get total invoice revenues by storeid initiated>'
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

      const matchQuery: any = {
        storeId: reqPayload?.storeId
      };
      if (Object.keys(dateFilter).length) {
        matchQuery.createdAt = dateFilter;
      }

      const pipeline = [
        { $match: matchQuery },
        {
          $group: {
            _id: 0,
            totalAmount: { $sum: '$totalAmount' }
          }
        },
        { $project: { _id: 0, totalAmount: 1 } }
      ];

      const result = await CreateInvoice.aggregate(pipeline);
      const newInvoiceResult = await Invoice.aggregate(pipeline);

      return {
        totalAmount:
          result[0]?.totalAmount + newInvoiceResult[0]?.totalAmount || 0
      };
    } catch (error: any) {
      Logger.error(
        '<Service>:<CreateInvoiceService>:<Error in getHighestInvoices>:',
        error
      );
      throw error;
    }
  }

  async getInvoiceRevenuePerDayByStoreId(reqPayload: any) {
    Logger.info(
      '<Service>:<CreateInvoiceService>:<Get total invoice revenues by storeid initiated>'
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

      const matchQuery: any = {
        storeId: reqPayload?.storeId
      };
      if (Object.keys(dateFilter).length) {
        matchQuery.createdAt = dateFilter;
      }

      const pipeline = [
        { $match: matchQuery },
        {
          $group: {
            _id: 0,
            totalAmount: { $sum: '$totalAmount' }
          }
        },
        { $project: { _id: 0, totalAmount: 1 } }
      ];

      const result = await CreateInvoice.aggregate(pipeline);
      const newInvoiceResult = await Invoice.aggregate(pipeline);

      return {
        totalAmount:
          result[0]?.totalAmount + newInvoiceResult[0]?.totalAmount || 0
      };
    } catch (error: any) {
      Logger.error(
        '<Service>:<CreateInvoiceService>:<Error in getHighestInvoices>:',
        error
      );
      throw error;
    }
  }

  async createInvoice(payload: any) {
    Logger.info(
      '<Service>:<CreateInvoiceService>: <Invoice Creation: creating invoice>'
    );

    let amount = 0;

    // Calculate amount based on line items
    if (payload?.vehiclePartsDetails?.lineItems) {
      payload?.vehiclePartsDetails?.lineItems.map((item: any) => {
        amount += item.quantity * item.rate;
      });
    }

    // Adjust amount based on additional items payload
    if (payload?.extraCharges?.additionalItems) {
      payload?.extraCharges?.additionalItems.map((item: any) => {
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

    let newInvoice: any = {
      name: payload?.customerDetails?.name,
      phoneNumber: payload?.customerDetails?.phoneNumber,
      email: payload?.customerDetails?.email,
      address: payload?.customerDetails?.billingAddress,
      storeId: payload?.storeId,
      vehicleNumber: payload?.vehicleNumber,
      lineItems: payload?.vehiclePartsDetails?.lineItems,
      additionalItems: payload?.extraCharges?.additionalItems
    };

    const lastCreatedInvoice = await Invoice.find({ storeId: payload?.storeId })
      .sort({ createdAt: 'desc' })
      .limit(1)
      .exec();

    const invoiceNumber = isEmpty(lastCreatedInvoice)
      ? 1
      : Number(+lastCreatedInvoice[0].invoiceNumber) + 1;

    try {
      newInvoice.invoiceNumber = invoiceNumber;
      newInvoice.totalAmount = amount;

      Logger.info(
        '<Service>:<CreateInvoiceService>:<Invoice created successfully>'
      );
      newInvoice = await Invoice.create(newInvoice);
      console.log(newInvoice,"newInvoice");
      if(payload?.customerDetails?.email){
        const sqsMessage = await this.sqsService.createMessage(
          SQSEvent.NEW_INVOICE,
          newInvoice
        );
      }
      return newInvoice;
    } catch (error) {
      Logger.error(
        '<Service>:<CreateInvoiceService>:<Error creating invoice>',
        error
      );
      throw error;
    }
  }

  async getNewInvoicesByStoreId(payload: any) {
    Logger.info(
      '<Service>:<CreateInvoiceService>: <Invoice Fetching: Fetchind invoice>'
    );
    const { pageNo, pageSize, searchText, storeId } = payload;
    let query: any = {
      storeId
    };
    if (searchText) {
      query.phoneNumber = `+91${searchText?.slice(-10)}`;
    }
    try {
      const invoices = await Invoice.find(query)
        .skip(pageNo * pageSize)
        .limit(pageSize);
      return invoices;
    } catch (error) {
      Logger.error(
        '<Service>:<CreateInvoiceService>:<Error fetching invoices>',
        error
      );
      throw error;
    }
  }

  async getNewInvoicesByInvoiceId(invoiceId: string) {
    Logger.info(
      '<Service>:<CreateInvoiceService>: <Invoice Fetching: Fetching invoice>'
    );
    try {
      const invoice = await Invoice.findOne({
        _id: new Types.ObjectId(invoiceId)
      });
      return invoice;
    } catch (error) {
      Logger.error(
        '<Service>:<CreateInvoiceService>:<Error creating invoice>',
        error
      );
      throw error;
    }
  }
}
