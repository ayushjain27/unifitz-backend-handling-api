import { injectable } from 'inversify';
import { Types } from 'mongoose';
import _, { isEmpty } from 'lodash';
import Logger from '../config/winston';
import Customer, { ICustomer } from './../models/Customer';
import container from '../config/inversify.container';
import { S3Service } from './s3.service';
import { TYPES } from '../config/inversify.types';
import {
  ApproveUserVerifyRequest,
  VerifyAadharUserRequest,
  VerifyCustomerRequest
} from '../interfaces';
import { DocType } from '../enum/docType.enum';
import { SurepassService } from './surepass.service';
import { StaticIds } from '../models/StaticId';
import { permissions } from '../config/permissions';
import CustomerReferralCode from '../models/CustomerReferralcode';
import InviteUsers from '../models/inviteNewUsers';
import Rewards, { IRewards } from '../models/rewards';
import { AdminRole } from './../models/Admin';
import Store from '../models/Store';
import { StoreService } from './store.service';
import { TwoFactorService } from './twoFactor.service';
import CustomerRedeemCoupon from '../models/CustomerRedeemCoupon';

@injectable()
export class CustomerService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private storeService = container.get<StoreService>(TYPES.StoreService);
  private twoFactorService = container.get<TwoFactorService>(
    TYPES.TwoFactorService
  );
  private surepassService = container.get<SurepassService>(
    TYPES.SurepassService
  );

  async create(customerPayload: ICustomer): Promise<ICustomer> {
    Logger.info(
      '<Service>:<CustomerService>: <Customer onboarding: creating new customer>'
    );
    const checkCustomerExists = await Customer.findOne({
      phoneNumber: customerPayload?.phoneNumber
    });
    if (checkCustomerExists) {
      return;
    } else {
      const lastCreatedCustomerId = await StaticIds.find({}).limit(1).exec();
      const newCustomerId = String(
        parseInt(lastCreatedCustomerId[0].customerId) + 1
      );
      await StaticIds.findOneAndUpdate({}, { customerId: newCustomerId });
      customerPayload.customerId = newCustomerId;
      customerPayload.accessList = permissions.CUSTOMER;
      const newCustomer = await Customer.create(customerPayload);
      if (customerPayload?.referralCode) {
        let data = {
          customerId: newCustomerId,
          referralCode: customerPayload?.referralCode
        };
        await CustomerReferralCode.create(data);
      }
      Logger.info(
        '<Service>:<CustomerService>:<Customer created successfully>'
      );
      return newCustomer;
    }
  }

  async update(
    customerId: string,
    customerPayload: ICustomer
  ): Promise<ICustomer> {
    Logger.info(
      '<Service>:<CustomerService>: <Customer onboarding: creating new customer>'
    );
    try {
      await Customer.findOneAndUpdate(
        {
          _id: new Types.ObjectId(customerId)
        },
        customerPayload
      );
      const updatedCustomerPayload = Customer.findById(
        new Types.ObjectId(customerId)
      );
      if (customerPayload?.referralCode) {
        let customerReferrals = await CustomerReferralCode.findOne({
          customerId: customerPayload?.customerId,
          referralCode: customerPayload?.referralCode
        });
        console.log(customerReferrals, 'wemkfmlr');
        if (customerReferrals) {
          await CustomerReferralCode.findOneAndUpdate(
            {
              customerId: customerPayload?.customerId,
              referralCode: customerPayload?.referralCode
            },
            { $set: { status: 'SUCCESSFULL' } },
            { new: true }
          );
        }
      }
      Logger.info(
        '<Service>:<CustomerService>:<Customer updated successfully>'
      );
      return updatedCustomerPayload;
    } catch (error) {
      throw new Error(error);
    }
  }

  async updateCustomerImage(customerId: string, req: Request | any) {
    Logger.info('<Service>:<CustomerService>:<Customer image uploading>');
    const customer: ICustomer = await Customer.findOne({
      _id: new Types.ObjectId(customerId)
    });
    if (_.isEmpty(customer)) {
      throw new Error('customer does not exist');
    }
    const file: any = req.file;

    let profileImageUrl: any = customer.profileImageUrl || '';

    if (!file) {
      throw new Error('Files not found');
    }

    const fileName = 'profile';
    const { url } = await this.s3Client.uploadFile(
      customerId,
      fileName,
      file.buffer
    );
    profileImageUrl = url;

    const res = await Customer.findOneAndUpdate(
      { _id: customerId },
      { $set: { profileImageUrl } },
      { returnDocument: 'after' }
    );
    return res;
  }

  async getByPhoneNumber(phoneNumber: string): Promise<ICustomer> {
    Logger.info(
      '<Service>:<CustomerService>:<Get customer by phone Number service initiated>'
    );

    const customerResponse: ICustomer = await Customer.findOne({
      phoneNumber: `+91${phoneNumber.slice(-10)}`
    });
    return customerResponse;
  }

  async getAll(): Promise<ICustomer[]> {
    Logger.info('<Service>:<CustomerService>:<Get all customers>');
    const customerResponse: ICustomer[] = (await Customer.find({})).reverse();
    return customerResponse;
  }

  async getcustomerDetailsByCustomerId(customerId: string): Promise<any> {
    Logger.info('<Service>:<CustomerService>:<Get customer by customer id>');
    const customerResponse: ICustomer = await Customer.findOne({
      customerId: customerId
    });
    if (isEmpty(customerResponse)) {
      return {
        message: 'Customer Not Found',
        isPresent: false
      };
    }
    return customerResponse;
  }

  async getAllCount(searchQuery?: string, state?: string, city?: string) {
    Logger.info('<Service>:<CustomerService>:<Get all customers>');
    const query: any = {
      'contactInfo.state': state,
      'contactInfo.city': city
    };

    if (!state) {
      delete query['contactInfo.state'];
    }
    if (!city) {
      delete query['contactInfo.city'];
    }
    const regexQuery = new RegExp(searchQuery, 'i');

    if (searchQuery) {
      query.$or = [
        { customerId: { $regex: regexQuery } },
        { 'contactInfo.address': { $regex: regexQuery } }
      ];
    }
    const customerResponse: any = await Customer.countDocuments(query);
    const result = {
      count: customerResponse
    };
    return result;
  }

  async getPaginatedAll(
    pageNo?: number,
    pageSize?: number,
    searchQuery?: string,
    state?: string,
    city?: string
  ): Promise<ICustomer[]> {
    Logger.info('<Service>:<CustomerService>:<Get all customers>');
    const query: any = {
      'contactInfo.state': state,
      'contactInfo.city': city
    };

    if (!state) {
      delete query['contactInfo.state'];
    }
    if (!city) {
      delete query['contactInfo.city'];
    }
    // if (searchQuery) {
    //   query.$or = [{ fullName: searchQuery }, { email: searchQuery }];
    // }

    const regexQuery = new RegExp(searchQuery, 'i');

    if (searchQuery) {
      query.$or = [
        { customerId: { $regex: regexQuery } },
        { 'contactInfo.address': { $regex: regexQuery } },
        { phoneNumber: { $regex: regexQuery } },
        { fullName: { $regex: regexQuery } }
      ];
    }
    const customerResponse = await Customer.aggregate([
      {
        $match: query
      },
      { $sort: { createdAt: -1 } },
      {
        $skip: pageNo * pageSize
      },
      {
        $limit: pageSize
      }
    ]);
    return customerResponse;
  }

  async initiateUserVerification(payload: VerifyCustomerRequest) {
    Logger.info('<Service>:<CustomerService>:<Initiate Verifying user>');
    // validate the store from user phone number and user id
    let verifyResult: any = {};
    const displayFields: any = {};

    try {
      // get the store data
      const customerDetails = await Customer.findOne({
        customerId: payload.customerId
      });

      if (_.isEmpty(customerDetails)) {
        throw new Error('Customer does not exist');
      }

      // integrate surephass api based on doc type
      switch (payload.documentType) {
        case DocType.GST:
          verifyResult = await this.surepassService.getGstDetails(
            payload.documentNo
          );
          displayFields.businessName = verifyResult?.business_name;
          displayFields.address = verifyResult?.address;
          break;
        case DocType.AADHAR:
          verifyResult = await this.surepassService.sendOtpForAadharVerify(
            payload.documentNo
          );
          break;
        default:
          throw new Error('Invalid Document Type');
      }

      return { verifyResult, displayFields };
    } catch (err) {
      if (err.response) {
        return Promise.reject(err.response);
      }
      throw new Error(err);
    }
  }

  async approveUserVerification(payload: ApproveUserVerifyRequest) {
    Logger.info(
      '<Service>:<CustomerService>:<Approve Verifying user business>'
    );
    // validate the store from user phone number and user id

    try {
      const customerDetails = await Customer.findOne({
        phoneNumber: payload.phoneNumber
      });

      if (_.isEmpty(customerDetails)) {
        throw new Error('Customer not found');
      }
      const docDetails: any = payload;
      const updatedCustomer = await this.updateCustomerDetails(
        docDetails.verificationDetails,
        docDetails.documentType,
        docDetails.gstAdhaarNumber || docDetails?.verificationDetails?.gstin,
        customerDetails
      );

      return updatedCustomer;
    } catch (err) {
      if (err.response) {
        return Promise.reject(err.response);
      }
      throw new Error(err);
    }
  }

  async verifyAadhar(payload: VerifyAadharUserRequest) {
    Logger.info('<Service>:<CustomerService>:<Initiate Verifying user>');
    // validate the store from user phone number and user id
    const gstAdhaarNumber = payload?.gstAdhaarNumber
      ? payload?.gstAdhaarNumber
      : '';

    try {
      // get the store data
      const customerDetails = await Customer.findOne({
        phoneNumber: payload.phoneNumber
      });

      if (_.isEmpty(customerDetails)) {
        throw new Error('Customer does not exist');
      }

      const verifyResult = await this.surepassService.verifyOtpForAadharVerify(
        payload.clientId,
        payload.otp
      );
      const updatedCustomer = await this.updateCustomerDetails(
        verifyResult,
        DocType.AADHAR,
        gstAdhaarNumber,
        customerDetails
      );

      return updatedCustomer;
    } catch (err) {
      throw new Error(err);
    }
  }

  private async updateCustomerDetails(
    verifyResult: any,
    documentType: string,
    gstAdhaarNumber: string,
    customerDetails: ICustomer
  ) {
    let isVerified = false;

    if (!_.isEmpty(verifyResult)) {
      // Business is verified
      isVerified = true;
    }

    // update the store

    const updatedCustomer = await Customer.findOneAndUpdate(
      { phoneNumber: customerDetails.phoneNumber },
      {
        $set: {
          isVerified,
          verificationDetails: {
            documentType,
            verifyName: verifyResult?.business_name || verifyResult?.full_name,
            verifyAddress:
              documentType === 'GST'
                ? String(verifyResult?.address)
                : String(
                    `${verifyResult?.address?.house} ${verifyResult?.address?.landmark} ${verifyResult?.address?.street} ${verifyResult?.address?.vtc} ${verifyResult?.address?.state} - ${verifyResult?.zip}`
                  ),
            verifyObj: verifyResult,
            gstAdhaarNumber
          }
        }
      },
      {
        returnDocument: 'after',
        projection: { 'verificationDetails.verifyObj': 0 }
      }
    );

    return updatedCustomer;
  }

  async getAllCustomerId() {
    Logger.info('<Service>:<CustomerService>:<Get all customersID>');

    const customerResponse = await Customer.find({}, 'customerId'); // Only fetch customerId field

    const customerIds = customerResponse.map(
      (customer: any) => customer.customerId
    );

    const result = {
      customerIds: customerIds
    };

    return result;
  }

  async getAllCustomerReferralsByCustomerId(referralCode: string) {
    Logger.info('<Service>:<CustomerService>:<Get all customersID>');

    const customerResponse = await CustomerReferralCode.aggregate([
      // Step 1: Match the referralCode
      {
        $match: { referralCode: referralCode }
      },
      // Step 2: Perform a lookup on 'customers' collection
      {
        $lookup: {
          from: 'customers', // The collection to join
          localField: 'customerId', // Field from the CustomerReferralCode collection
          foreignField: 'customerId', // Field from the customers collection
          as: 'customersDetails' // Alias for the resulting joined data
        }
      }
    ]);

    return customerResponse;
  }

  async inviteUsers(customerPayload: any): Promise<any> {
    Logger.info(
      '<Service>:<CustomerService>: <Customer Inviting: Inviting new customer>'
    );
    const checkCustomerExists = await Customer.findOne({
      phoneNumber: customerPayload?.phoneNumber
    });
    if (checkCustomerExists) {
      return {
        message:
          'This phoneNumber is already exists. Please use different phoneNumber'
      };
    }
    const checkInviteUsersExists = await InviteUsers.findOne({
      phoneNumber: customerPayload?.phoneNumber,
      customerId: customerPayload?.customerId
    });
    console.log(checkInviteUsersExists, 'Dlr,fm');
    if (checkInviteUsersExists) {
      console.log(
        checkInviteUsersExists?.count,
        'checkInviteUsersExists?.count'
      );

      const updateInviteDetails = await InviteUsers.findOneAndUpdate(
        {
          phoneNumber: customerPayload?.phoneNumber,
          customerId: customerPayload?.customerId
        },
        {
          $set: {
            count: Number(checkInviteUsersExists?.count || 0) + 1
          }
        },
        {
          new: true // returns updated document
        }
      );
      return updateInviteDetails;
    } else {
      customerPayload.count = 1;
      let newInvite = InviteUsers.create(customerPayload);
      Logger.info(
        '<Service>:<CustomerService>:<Customer created successfully>'
      );
      return newInvite;
    }
  }

  async countAllReferCustomer(
    searchText: string,
    firstDate: string,
    lastDate: string,
    state: string,
    city: string
  ): Promise<any> {
    Logger.info('<Service>:<CustomerService>:<count all refer customers>');

    // Initialize match query
    const matchQuery: any = {};

    // Date validation and processing
    const createdAtFilter: any = {};
    const firstDay = firstDate ? new Date(firstDate) : null;
    const lastDay = lastDate ? new Date(lastDate) : null;

    // Validate date range
    if (firstDay && lastDay && firstDay > lastDay) {
      throw new Error('Start date must be less than or equal to end date');
    }

    // Set UTC time to beginning of day (00:00:00)
    if (firstDay) {
      firstDay.setUTCHours(0, 0, 0, 0);
      createdAtFilter.$gte = firstDay;
    }

    // Set UTC time to end of day (23:59:59)
    if (lastDay) {
      lastDay.setUTCHours(23, 59, 59, 999);
      createdAtFilter.$lte = lastDay;
    }

    // Add date filter to match query if dates are provided
    if (Object.keys(createdAtFilter).length > 0) {
      matchQuery.createdAt = createdAtFilter;
    }

    // Location filters
    if (state) {
      matchQuery['customerDetails.contactInfo.state'] = state;
    }
    if (city) {
      matchQuery['customerDetails.contactInfo.city'] = city;
    }

    // Search text filter
    if (searchText) {
      const searchNumber = searchText.replace(/\D/g, '').slice(-10);
      matchQuery.$or = [
        { customerId: searchText },
        { phoneNumber: new RegExp(searchNumber, 'i') },
        { 'customerDetails.phoneNumber': new RegExp(searchNumber, 'i') }
      ];
    }

    // Aggregate query to fetch counts
    const counts = await InviteUsers.aggregate([
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: 'customerId',
          as: 'customerDetails'
        }
      },
      {
        $unwind: { path: '$customerDetails', preserveNullAndEmptyArrays: true }
      },
      { $match: matchQuery },
      {
        $facet: {
          totalCount: [{ $count: 'total' }]
        }
      },
      {
        $project: {
          total: { $ifNull: [{ $arrayElemAt: ['$totalCount.total', 0] }, 0] }
        }
      }
    ]);

    return counts[0] || { total: 0, active: 0, inactive: 0 };
  }

  async countAllReferCustomerPaginated(
    pageNo?: number,
    pageSize?: number,
    searchText?: string,
    firstDate?: string,
    lastDate?: string,
    state?: string,
    city?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<CustomerService>:<Get all customer referrals initiated>'
    );

    // Date validation and processing
    const createdAtFilter: any = {};
    const firstDay = firstDate ? new Date(firstDate) : null;
    const lastDay = lastDate ? new Date(lastDate) : null;

    // Initialize match query
    const matchQuery: any = {};

    // Validate date range
    if (firstDay && lastDay && firstDay > lastDay) {
      throw new Error('Start date must be less than or equal to end date');
    }

    // Set UTC time to beginning of day (00:00:00)
    if (firstDay) {
      firstDay.setUTCHours(0, 0, 0, 0);
      createdAtFilter.$gte = firstDay;
    }

    // Set UTC time to end of day (23:59:59)
    if (lastDay) {
      lastDay.setUTCHours(23, 59, 59, 999);
      createdAtFilter.$lte = lastDay;
    }

    // Add date filter to match query if dates are provided
    if (Object.keys(createdAtFilter).length > 0) {
      matchQuery.createdAt = createdAtFilter;
    }

    // Location filters
    if (state) {
      matchQuery['customerDetails.contactInfo.state'] = state;
    }
    if (city) {
      matchQuery['customerDetails.contactInfo.city'] = city;
    }

    // Search text filter
    if (searchText) {
      const searchNumber = searchText.replace(/\D/g, '').slice(-10);
      matchQuery.$or = [
        { customerId: searchText },
        { phoneNumber: new RegExp(searchNumber, 'i') },
        { 'customerDetails.phoneNumber': new RegExp(searchNumber, 'i') }
      ];
    }

    const inviteUsers = await InviteUsers.aggregate([
      {
        $lookup: {
          from: 'customers', // The customer collection name
          localField: 'customerId',
          foreignField: 'customerId',
          as: 'customerDetails'
        }
      },
      {
        $unwind: { path: '$customerDetails', preserveNullAndEmptyArrays: true }
      },
      { $sort: { createdAt: -1 } },
      { $match: matchQuery },
      { $skip: pageNo * pageSize },
      { $limit: pageSize },
      {
        $lookup: {
          from: 'customers', // The customer collection name
          localField: 'phoneNumber',
          foreignField: 'phoneNumber',
          as: 'customerMatch'
        }
      },
      {
        $addFields: {
          status: {
            $cond: {
              if: { $gt: [{ $size: '$customerMatch' }, 0] },
              then: 'ACTIVE',
              else: 'INACTIVE'
            }
          }
        }
      },
      { $project: { customerMatch: 0 } } // Remove the temporary field
    ]);
    return inviteUsers;
  }

  async createRewards(rewardsPayload: any): Promise<any> {
    Logger.info(
      '<Service>:<CustomerService>: <Rewards creation: creating new rewards>'
    );
    rewardsPayload.quantityLeft = rewardsPayload?.quantity;
    const newRewards = await Rewards.create(rewardsPayload);
    return newRewards;
  }

  async uploadRewardImage(rewardId: string, req: Request | any) {
    Logger.info('<Service>:<CustomerService>:<Reward image uploading>');
    const reward: IRewards = await Rewards.findOne({
      _id: new Types.ObjectId(rewardId)
    });
    if (_.isEmpty(reward)) {
      throw new Error('Reward does not exist');
    }
    const file: any = req.file;

    let rewardsImageUrl: any = reward.rewardsImageUrl || '';

    if (!file) {
      throw new Error('Files not found');
    }

    const fileName = 'profile';
    const { url } = await this.s3Client.uploadFile(
      rewardId,
      fileName,
      file.buffer
    );
    rewardsImageUrl = url;

    const res = await Rewards.findOneAndUpdate(
      { _id: rewardId },
      { $set: { rewardsImageUrl } },
      { returnDocument: 'after' }
    );
    return res;
  }

  async countAllRewards(
    userName?: string,
    role?: string,
    oemId?: string
  ): Promise<any> {
    Logger.info('<Service>:<CustomerService>:<count all rewards>');
    let query: any = {};

    if (role === AdminRole.OEM) {
      query.$or = [{ userName: userName }, { selectedUserName: userName }];
    }

    if (role === AdminRole.EMPLOYEE && oemId !== 'SERVICEPLUG') {
      query.$or = [
        { userName: oemId },
        { selectedUserName: oemId }
      ];
    }

    console.log(query,"demkfmdkr")

    const counts = await Rewards.aggregate([
      {
        $match: query
      },
      {
        $facet: {
          total: [{ $count: 'count' }],
          active: [{ $match: { status: 'ACTIVE' } }, { $count: 'count' }],
          inactive: [{ $match: { status: 'INACTIVE' } }, { $count: 'count' }]
        }
      }
    ]);

    // Extract the counts from the aggregation result
    const result = {
      total: counts[0]?.total[0]?.count || 0,
      active: counts[0]?.active[0]?.count || 0,
      inActive: counts[0]?.inactive[0]?.count || 0
    };

    console.log(result, 'result');

    return result;
  }

  async getAllRewardsPaginated(
    pageNo?: number,
    pageSize?: number,
    status?: string,
    userName?: string,
    role?: string,
    oemId?: string,
    selectedPartner?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<CustomerService>:<Search and Filter rewards service initiated>'
    );

    const query: any = {
      status
    };

    console.log(selectedPartner,"dlmerk")

    if (selectedPartner) {
      query.$or = [
        { userName: selectedPartner },
        { selectedUserName: selectedPartner }
      ];
    }

    if (role === AdminRole.OEM) {
      query.$or = [{ userName: userName }, { selectedUserName: userName }];
    }

    if (role === AdminRole.EMPLOYEE && oemId !== 'SERVICEPLUG') {
      query.$or = [
        { userName: oemId },
        { selectedUserName: oemId }
      ];
    }

    console.log(query,"mrfm")

    let sosNotifications: any = await Rewards.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } }, // Sort in descending order
      {
        $skip: pageNo * pageSize
      },
      {
        $limit: pageSize
      }
    ]);
    return sosNotifications;
  }

  async updateRewardStatus(status?: string, rewardId?: string): Promise<any> {
    Logger.info(
      '<Service>:<CustomerService>:<Update reward status service initiated>'
    );
    if (!rewardId) {
      throw new Error('Reward Id is required');
    }
    if (!status) {
      throw new Error('Status is required');
    }

    let getRewardInfo: any = await Rewards.findOne({
      _id: new Types.ObjectId(rewardId)
    });
    if (!getRewardInfo) {
      throw new Error('Reward Details not found');
    }
    const updateUsers = await Rewards.findOneAndUpdate(
      {
        _id: new Types.ObjectId(rewardId)
      },
      { $set: { status: status } },
      { returnDocument: 'after' }
    );
    return updateUsers;
  }

  async getInviteUserPerCustomerId(customerId?: string): Promise<any> {
    Logger.info(
      '<Service>:<CustomerService>:<Get invite users by customerId initiated>'
    );

    const totalInvites = await InviteUsers.find({
      customerId
    }).countDocuments();
    return totalInvites;
  }

  async getRewardsList(): Promise<any> {
    Logger.info(
      '<Service>:<CustomerService>:<Get all active rewards list initiated>'
    );

    const result = await Rewards.find({
      status: 'ACTIVE'
    });
    return result;
  }

  async getNearestDealer(searchReqBody: {
    coordinates: number[];
    oemUserName: string;
  }): Promise<any> {
    Logger.info(
      '<Service>:<CustomerService>:<Search and Filter stores service initiated 111111> '
    );
    const query: any = {
      profileStatus: 'ONBOARDED',
      oemUserName: searchReqBody?.oemUserName
    };

    Logger.debug(query);

    let stores: any = await Store.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: searchReqBody.coordinates as [number, number]
          },
          spherical: true,
          query: query,
          distanceField: 'contactInfo.distance',
          distanceMultiplier: 0.001
        }
      },
      // {
      //   $lookup: {
      //     from: 'admin_users',
      //     localField: 'oemUserName',
      //     foreignField: 'userName',
      //     as: 'partnerDetail'
      //   }
      // },
      // { $unwind: { path: '$partnerDetail' } },
      // {
      //   $set: {
      //     partnerEmail: '$partnerDetail.contactInfo.email',
      //     dealerName: '$partnerDetail.businessName'
      //   }
      // },
      {
        $project: { verificationDetails: 0 }
      },
      { $limit: 10 }
    ]);

    if (stores && Array.isArray(stores)) {
      stores = await Promise.all(
        stores.map(async (store) => {
          const updatedStore = { ...store };
          updatedStore.overAllRating =
            await this.storeService.getOverallRatings(updatedStore.storeId);
          return updatedStore;
        })
      );
    }
    return stores;
  }

  async sendCouponRedeemOtp(phoneNumber: string): Promise<any> {
    Logger.info(
      '<Service>:<CustomerService>:<Search and Filter stores service initiated 111111> '
    );

    if (!phoneNumber) {
      throw new Error('Phone Number is required');
    }

    const result = await this.twoFactorService.sendVerificationCode(
      phoneNumber.slice(-10)
    );
    return {
      message: 'Verification is sent!!',
      phoneNumber,
      result
    };
  }

  async verifyCouponRedeemOtp(requestPayload: any): Promise<any> {
    Logger.info(
      '<Service>:<CustomerService>:<Search and Filter stores service initiated 111111> '
    );
    const { phoneNumber, code, customerId, storeId, rewardId, oemUserName } =
      requestPayload;

    let customer = await Customer.findOne({ customerId });
    if (!customer) {
      throw new Error('Customer Not Found');
    }
    let store = await Store.findOne({ storeId });
    if (!store) {
      throw new Error('Store Not Found');
    }
    let rewardDetails = await Rewards.findOne({
      _id: new Types.ObjectId(rewardId)
    });
    if (!phoneNumber) {
      throw new Error('Phone Number is required');
    }

    const result = await this.twoFactorService.verifyCode(
      phoneNumber.slice(-10),
      code
    );
    if (!result || result?.Status === 'Error') {
      return {
        message: 'Invalid verification code :(',
        phoneNumber
      };
    }
    let data = {
      customerId,
      storeId,
      rewardId,
      oemUserName
    };
    await CustomerRedeemCoupon.create(data);
    let oldestInvites = await InviteUsers.find({
      customerId
    })
      .sort({ createdAt: -1 }) // Get latest first
      .limit(rewardDetails?.eligibleUsers);

    if (oldestInvites.length > 0) {
      const idsToDelete = oldestInvites.map((invite) => invite._id);
      await InviteUsers.deleteMany({ _id: { $in: idsToDelete } });
    }

    let oldestsuccessFullInvites = await CustomerReferralCode.find({
      referralCode: customerId,
      status: 'SUCCESSFULL'
    })
      .sort({ createdAt: -1 }) // Get oldest first
      .limit(rewardDetails?.eligibleUsers);

    if (oldestsuccessFullInvites.length > 0) {
      const idsToDelete = oldestsuccessFullInvites.map((invite) => invite._id);
      await CustomerReferralCode.deleteMany({ _id: { $in: idsToDelete } });
    }

    let updateRewards = await Rewards.findOneAndUpdate(
      {
        _id: new Types.ObjectId(rewardId)
      },
      { $set: { quantityLeft: rewardDetails?.quantityLeft - 1 } },
      { returnDocument: 'after' }
    );

    return {
      message: 'Verification is completed!!',
      phoneNumber,
      result
    };
  }

  async getRedeemCouponsDetailsByCustomerId(customerId: string): Promise<any> {
    Logger.info(
      '<Service>:<CustomerService>:<et redeem coupons details by customerId initiated>'
    );

    if (!customerId) {
      throw new Error('Customer not found');
    }

    const matchQuery = {
      customerId: customerId
    };

    const result = await CustomerRedeemCoupon.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'rewards',
          let: { rewardIdString: '$rewardId' }, // Store the string rewardId in a variable
          pipeline: [
            {
              $match: {
                $expr: {
                  // Convert both to strings for comparison
                  $eq: [{ $toString: '$_id' }, '$$rewardIdString']
                }
              }
            }
          ],
          as: 'rewardDetails'
        }
      },
      {
        $unwind: {
          path: '$rewardDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'stores', // The customer collection name
          localField: 'storeId',
          foreignField: 'storeId',
          as: 'storeDetails'
        }
      },
      {
        $unwind: {
          path: '$storeDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    return result;
  }

  async countAllRedeemCoupons(
    searchText: string,
    state: string,
    city: string,
    selectedPartner: string,
    firstDate: string,
    lastDate: string,
    oemId: string,
    userName?: string,
    role?: string,
  ): Promise<any> {
    Logger.info(
      '<Service>:<CustomerService>:<Get all customers redeem coupons>'
    );
    // Date validation and processing
    const createdAtFilter: any = {};
    const firstDay = firstDate ? new Date(firstDate) : null;
    const lastDay = lastDate ? new Date(lastDate) : null;

    // Initialize match query
    const matchQuery: any = {};
    if (role === AdminRole.OEM) {
      matchQuery.oemUserName = userName
    };
    
    if (role === AdminRole.EMPLOYEE && oemId !== 'SERVICEPLUG') {
      matchQuery.oemUserName = oemId
    }

    // Validate date range
    if (firstDay && lastDay && firstDay > lastDay) {
      throw new Error('Start date must be less than or equal to end date');
    }

    // Set UTC time to beginning of day (00:00:00)
    if (firstDay) {
      firstDay.setUTCHours(0, 0, 0, 0);
      createdAtFilter.$gte = firstDay;
    }

    // Set UTC time to end of day (23:59:59)
    if (lastDay) {
      lastDay.setUTCHours(23, 59, 59, 999);
      createdAtFilter.$lte = lastDay;
    }

    // Add date filter to match query if dates are provided
    if (Object.keys(createdAtFilter).length > 0) {
      matchQuery.createdAt = createdAtFilter;
    }

    // Location filters
    if (state) {
      matchQuery.$or = [
        { 'storeDetails.contactInfo.state': state },
        { 'customerDetails.contactInfo.state': state }
      ];
    }
    if (city) {
      matchQuery.$or = [
        { 'storeDetails.contactInfo.city': city },
        { 'customerDetails.contactInfo.city': city }
      ];
    }

    if (selectedPartner) {
      matchQuery.oemUserName = selectedPartner;
    }

    // Search text filter
    if (searchText) {
      const searchNumber = searchText.replace(/\D/g, '').slice(-10);
      matchQuery.$or = [
        { customerId: searchText },
        { storeId: searchText },
        {
          'storeDetails.contactInfo.phoneNumber.primary': new RegExp(
            searchNumber,
            'i'
          )
        },
        {
          'customerDetails.contactInfo.phoneNumber': new RegExp(
            searchNumber,
            'i'
          )
        }
      ];
    }

    const count = await CustomerRedeemCoupon.aggregate([
      {
        $lookup: {
          from: 'stores', // The customer collection name
          localField: 'storeId',
          foreignField: 'storeId',
          as: 'storeDetails'
        }
      },
      {
        $unwind: {
          path: '$storeDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'customers', // The customer collection name
          localField: 'customerId',
          foreignField: 'customerId',
          as: 'customerDetails'
        }
      },
      {
        $unwind: {
          path: '$storeDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      { $match: matchQuery },
      { $count: 'count' }
    ]);
    return {
      count: count[0]?.count || 0
    };
  }

  async getAllRedeemCouponsPaginated(
    pageNo?: number,
    pageSize?: number,
    searchText?: string,
    firstDate?: string,
    lastDate?: string,
    state?: string,
    city?: string,
    selectedPartner?: string,
    oemId?: string,
    userName?: string,
    role?: string,
  ): Promise<any> {
    Logger.info(
      '<Service>:<CustomerService>:<Get all customer redeem coupons initiated>'
    );

    // Date validation and processing
    const createdAtFilter: any = {};
    const firstDay = firstDate ? new Date(firstDate) : null;
    const lastDay = lastDate ? new Date(lastDate) : null;

    // Initialize match query
    const matchQuery: any = {};
    
    if (role === AdminRole.OEM) {
      matchQuery.oemUserName = userName
    };
    
    if (role === AdminRole.EMPLOYEE && oemId !== 'SERVICEPLUG') {
      matchQuery.oemUserName = oemId
    }

    // Validate date range
    if (firstDay && lastDay && firstDay > lastDay) {
      throw new Error('Start date must be less than or equal to end date');
    }

    // Set UTC time to beginning of day (00:00:00)
    if (firstDay) {
      firstDay.setUTCHours(0, 0, 0, 0);
      createdAtFilter.$gte = firstDay;
    }

    // Set UTC time to end of day (23:59:59)
    if (lastDay) {
      lastDay.setUTCHours(23, 59, 59, 999);
      createdAtFilter.$lte = lastDay;
    }

    // Add date filter to match query if dates are provided
    if (Object.keys(createdAtFilter).length > 0) {
      matchQuery.createdAt = createdAtFilter;
    }

    // Location filters
    if (state) {
      matchQuery.$or = [
        { 'storeDetails.contactInfo.state': state },
        { 'customerDetails.contactInfo.state': state }
      ];
    }
    if (city) {
      matchQuery.$or = [
        { 'storeDetails.contactInfo.city': city },
        { 'customerDetails.contactInfo.city': city }
      ];
    }

    if (selectedPartner) {
      matchQuery.oemUserName = selectedPartner;
    }

    // Search text filter
    if (searchText) {
      const searchNumber = searchText.replace(/\D/g, '').slice(-10);
      matchQuery.$or = [
        { customerId: searchText },
        { storeId: searchText },
        {
          'storeDetails.contactInfo.phoneNumber.primary': new RegExp(
            searchNumber,
            'i'
          )
        },
        {
          'customerDetails.contactInfo.phoneNumber': new RegExp(
            searchNumber,
            'i'
          )
        }
      ];
    }

    const inviteUsers = await CustomerRedeemCoupon.aggregate([
      {
        $lookup: {
          from: 'stores', // The customer collection name
          localField: 'storeId',
          foreignField: 'storeId',
          as: 'storeDetails'
        }
      },
      {
        $unwind: { path: '$storeDetails', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'customers', // The customer collection name
          localField: 'customerId',
          foreignField: 'customerId',
          as: 'customerDetails'
        }
      },
      {
        $unwind: {
          path: '$customerDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      { $sort: { createdAt: -1 } },
      { $match: matchQuery },
      { $skip: pageNo * pageSize },
      { $limit: pageSize }
    ]);
    return inviteUsers;
  }
}
