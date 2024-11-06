/* eslint-disable no-console */
import { injectable } from 'inversify';
import container from '../config/inversify.container';
import mongoose, { Types } from 'mongoose';
import Request from '../types/request';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { S3Service } from './s3.service';
import { UserService } from './user.service';
import { StoreService } from './store.service';
import { CustomerService } from './customer.service';
import { OrderRequest } from '../interfaces/orderRequest.interface';
import UserOrder, { IUserOrderManagement } from '../models/UserOrderManagement';
import { groupBy, isEmpty } from 'lodash';
import DistributorOrder from '../models/DistributorOrderManagement';

@injectable()
export class OrderManagementService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private userService = container.get<UserService>(TYPES.UserService);
  private storeService = container.get<StoreService>(TYPES.StoreService);
  private customerService = container.get<CustomerService>(
    TYPES.CustomerService
  );

  async create(requestBody: OrderRequest): Promise<IUserOrderManagement> {
    Logger.info('<Service>:<OrderManagementService>: <Order Request created>');

    // Complete the delete request body

    const params: IUserOrderManagement = {
      ...requestBody,
      userId: new Types.ObjectId(),
      userDetail: undefined,
      totalAmount: 0,
      status: '',
      storeId: '',
      customerId: ''
    };

    // Get the user and attach the user id
    const userPayload = {
      phoneNumber: `+91${requestBody.phoneNumber?.slice(-10)}`,
      role: requestBody.userRole
    };

    // Get the user details
    const user = await this.userService.getUserByPhoneNumber(userPayload);

    if (isEmpty(user)) {
      throw new Error('User not found');
    }

    params.userId = user._id;

    // If user role is store owner then get store id, else get customer id if available.

    if (requestBody.userRole === 'STORE_OWNER') {
      const store = await this.storeService.getStoreByUserId(user._id);

      if (isEmpty(store)) {
        throw new Error('Store not found');
      }
      params.storeId = store?.storeId;
      params.userDetail = {
        userId: store?.userId,
        name: store?.basicInfo?.ownerName,
        email: store?.contactInfo?.email,
        phoneNumber: store?.contactInfo?.phoneNumber?.primary
      };
    } else {
      const phoneNumber = requestBody.phoneNumber.slice(-10);
      const customer = await this.customerService.getByPhoneNumber(phoneNumber);
      params.customerId = customer?._id;
      params.userDetail = {
        userId: customer?._id,
        name: customer?.fullName,
        email: customer?.email,
        phoneNumber: customer?.phoneNumber
      };
    }

    const userOrderRequest = await UserOrder.create(params);

    if (!isEmpty(userOrderRequest)) {

      const groupedData = groupBy(requestBody.items, 'oemUserName');
      // const groupedData = requestBody.items.reduce((result, currentItem) => {
      //   const userGroup = result.find(
      //     (group) => group[0]?.oemUserName === currentItem.oemUserName
      //   );

      //   if (userGroup) {
      //     // If a group already exists for this user, add the item to that group
      //     userGroup.push(currentItem);
      //   } else {
      //     // If no group exists for this user, create a new group with the item
      //     result.push([currentItem]);
      //   }

      //   return result;
      // }, []);

      await groupedData.map(async (itemGroup) => {
        const totalAmount = itemGroup.reduce(
          (sum: any, item: { price: any }) => sum + item.price,
          0
        );

        const distributorOrderData = {
          orderId: userOrderRequest._id,
          orders: itemGroup,
          oemUserName: itemGroup[0]?.username, // Assuming username is the grouping field
          totalAmount // Include totalAmount here
        };

        await DistributorOrder.create(distributorOrderData); // Assuming DistributorOrder model
      });
    }

    return userOrderRequest;
  }

  async getOrderById(orderId: string): Promise<IUserOrderManagement> {
    Logger.info('<Service>:<OrderManagementService>:<Get order by id>');
    const orderResponse: IUserOrderManagement = await UserOrder.findOne({
      _id: new Types.ObjectId(orderId)
    }).lean();
    return orderResponse;
  }

  async getUserAllOrders(
    phoneNumber: string,
    userRole: string
  ): Promise<IUserOrderManagement[]> {
    Logger.info('<Service>:<OrderManagementService>:<Get user all orders by id>');
    const orderResponse: IUserOrderManagement[] = await UserOrder.find({
      phoneNumber: `+91${phoneNumber?.slice(-10)}`,
      userRole
    }).lean();
    return orderResponse;
  }
}
