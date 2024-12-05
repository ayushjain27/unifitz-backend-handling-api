/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { injectable } from 'inversify';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { S3Service } from './s3.service';
import { UserService } from './user.service';
import { StoreService } from './store.service';
import { CustomerService } from './customer.service';
import {
  OrderRequest,
  OrderStatusRequest
} from '../interfaces/orderRequest.interface';
import UserOrder, { IUserOrderManagement } from '../models/UserOrderManagement';
import { isEmpty } from 'lodash';
import DistributorOrder from '../models/DistributorOrderManagement';
import ProductCartModel from '../models/ProductCart';
import { SQSService } from './sqs.service';
import { SQSEvent } from '../enum/sqsEvent.enum';
import { AdminRole } from './../models/Admin';
import { SPEmployeeService } from './spEmployee.service';

@injectable()
export class OrderManagementService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private userService = container.get<UserService>(TYPES.UserService);
  private storeService = container.get<StoreService>(TYPES.StoreService);
  private customerService = container.get<CustomerService>(
    TYPES.CustomerService
  );
  private spEmployeeService = container.get<SPEmployeeService>(
    TYPES.SPEmployeeService
  );
  private sqsService = container.get<SQSService>(TYPES.SQSService);

  async create(requestBody: OrderRequest): Promise<IUserOrderManagement> {
    Logger.info('<Service>:<OrderManagementService>: <Order Request created>');

    // Complete the delete request body

    const params: IUserOrderManagement = {
      ...requestBody,
      userId: new Types.ObjectId(),
      userDetail: undefined,
      status: 'PENDING',
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
      if (isEmpty(customer)) {
        throw new Error('Customer not found');
      }
      params.customerId = customer?._id;
      params.userDetail = {
        userId: customer?._id,
        name: customer?.fullName,
        email: customer?.email,
        phoneNumber: customer?.phoneNumber
      };
    }

    const userOrderRequest = await UserOrder.create(params);
    requestBody.items.forEach(async (item) => {
      await ProductCartModel.findOneAndUpdate(
        { _id: item.cartId },
        { $set: { status: 'INACTIVE' } }
      );
    });

    const sqsMessage = await this.sqsService.createMessage(
      SQSEvent.CREATE_DISTRIBUTOR_ORDER,
      userOrderRequest?._id
    );
    console.log(sqsMessage, 'Message');

    // if (!isEmpty(userOrderRequest)) {

    // const groupedData = groupBy(requestBody.items, 'oemUserName');
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

    // await groupedData.map(async (itemGroup) => {
    //   const totalAmount = itemGroup.reduce(
    //     (sum: any, item: { price: any }) => sum + item.price,
    //     0
    //   );

    //   const distributorOrderData = {
    //     orderId: userOrderRequest._id,
    //     orders: itemGroup,
    //     oemUserName: itemGroup[0]?.username, // Assuming username is the grouping field
    //     totalAmount // Include totalAmount here
    //   };

    //   await DistributorOrder.create(distributorOrderData); // Assuming DistributorOrder model
    // });
    // }

    return userOrderRequest;
  }

  async getOrderById(orderId: string): Promise<IUserOrderManagement> {
    Logger.info('<Service>:<OrderManagementService>:<Get order by id>');
    const orderResponse: IUserOrderManagement = await UserOrder.findOne({
      _id: new Types.ObjectId(orderId)
    })
      .lean()
      .populate('items.cartId') // Populate cartId in each item
      .populate('items.productId'); // Populate productId in each item
    return orderResponse;
  }

  async getUserAllOrders(
    phoneNumber: string,
    userRole: string,
    pageNo: number,
    pageSize: number,
    status: string
  ): Promise<IUserOrderManagement[]> {
    const query: { storeId?: string; customerId?: string; status?: string } =
      {};

    // Add status to the query object
    if (!isEmpty(status)) {
      query.status = status;
    }

    const userPayload = {
      phoneNumber: `+91${phoneNumber.slice(-10)}`,
      role: userRole
    };

    // Get the user details
    const user = await this.userService.getUserByPhoneNumber(userPayload);

    if (!user) {
      throw new Error('User not found');
    }

    // Define query for either storeId or customerId based on user role
    if (userRole === 'STORE_OWNER') {
      const store = await this.storeService.getStoreByUserId(user._id);
      if (!store) {
        throw new Error('Store not found');
      }
      query.storeId = store.storeId;
    } else {
      const customer = await this.customerService.getByPhoneNumber(
        `+91${phoneNumber.slice(-10)}`
      );
      if (!customer) {
        throw new Error('Customer not found');
      }
      query.customerId = customer._id;
    }

    Logger.info(
      '<Service>:<OrderManagementService>:<Get user all orders by id>'
    );

    const orderResponse: any = await UserOrder.aggregate([
      {
        $match: query
      },
      {
        $unwind: '$items' // Unwind the items array to populate each individually
      },
      {
        $lookup: {
          from: 'productcarts',
          localField: 'items.cartId',
          foreignField: '_id',
          as: 'items.cartDetails'
        }
      },
      {
        $lookup: {
          from: 'partnersproducts',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'items.productDetails'
        }
      },
      {
        $unwind: '$items.cartDetails' // Unwind single cartDetail (since it’s a 1-to-1 relationship)
      },
      {
        $unwind: '$items.productDetails' // Unwind single productDetail (since it’s a 1-to-1 relationship)
      },
      {
        $group: {
          _id: '$_id',
          userDetail: { $first: '$userDetail' },
          status: { $first: '$status' },
          totalAmount: { $first: '$totalAmount' },
          shippingAddress: { $first: '$shippingAddress' },
          storeId: { $first: '$storeId' },
          customerId: { $first: '$customerId' },
          userId: { $first: '$userId' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
          items: { $push: '$items' } // Re-assemble items as an array after lookups
        }
      },
      { $sort: { createdAt: -1 } }, // 1 for ascending order
      {
        $skip: pageNo * pageSize
      },
      {
        $limit: pageSize
      }
    ]);

    return orderResponse;
  }

  async updateCartStatus(requestBody: OrderStatusRequest): Promise<any> {
    Logger.info(
      '<Service>:<OrderManagementService>: <Order Request Cart Status initiated>'
    );

    const distributorOrder = await DistributorOrder.findOne({
      _id: new Types.ObjectId(requestBody?.distributorId)
    });

    if (isEmpty(distributorOrder)) {
      throw new Error('Order not found');
    }

    const updateFields: any = {
      'items.$[item].status': requestBody.status, // Update the status
      'items.$[item].cancelReason': requestBody.cancelReason,
      'items.$[item].courierCompanyName': requestBody?.courierCompanyName,
      'items.$[item].trackingNumber': requestBody?.trackingNumber
    };

    // Dynamically add date fields based on status
    if (requestBody.status === 'PROCESSING') {
      updateFields['items.$[item].processingDate'] = new Date();
    }
    if (requestBody.status === 'CANCELLED') {
      updateFields['items.$[item].cancelDate'] = new Date();
    }
    if (requestBody.status === 'SHIPPED') {
      updateFields['items.$[item].shippingDate'] = new Date();
    }
    if (requestBody.status === 'DELIVERED') {
      updateFields['items.$[item].deliveryDate'] = new Date();
    }

    const updatedDistributorOrder = await DistributorOrder.updateOne(
      { _id: new Types.ObjectId(requestBody.distributorId) }, // Match the order
      {
        $set: updateFields
      },
      {
        arrayFilters: [
          { 'item.cartId': new Types.ObjectId(requestBody.cartId) } // Match the specific cartId
        ]
      }
    );

    const order = await UserOrder.findOne({
      _id: new Types.ObjectId(requestBody.orderId)
    });

    if (isEmpty(order)) {
      throw new Error('Order not found');
    }

    const updatedOrder = await UserOrder.updateOne(
      { _id: new Types.ObjectId(requestBody.orderId) }, // Match the order
      {
        $set: updateFields
      },
      {
        arrayFilters: [
          { 'item.cartId': new Types.ObjectId(requestBody.cartId) } // Match the specific cartId
        ]
      }
    );

    if (updatedOrder.modifiedCount > 0) {
      console.log('Item updated successfully');
    } else {
      console.log('No matching item found for the given cartId');
    }

    const updatedDistributorOrderStatus = await DistributorOrder.findOne({
      _id: new Types.ObjectId(requestBody?.distributorId)
    });

    const itemStatuses = updatedDistributorOrderStatus.items.map(
      (item) => item.status
    );
    let overallStatus = 'PENDING'; // Default to PENDING if no other status is found

    if (itemStatuses.every((status) => status === 'CANCELLED')) {
      overallStatus = 'CANCELLED'; // If any item is CANCELLED, the whole order is CANCELLED
    } else if (itemStatuses.every((status) => status === 'DELIVERED')) {
      overallStatus = 'DELIVERED'; // If all items are DELIVERED, the order is DELIVERED
    } else if (itemStatuses.some((status) => status === 'DELIVERED')) {
      overallStatus = 'PARTIAL DELIVERED'; // If any item is SHIPPED, the order is SHIPPED
    } else if (
      itemStatuses.some(
        (status) => status === 'PROCESSING' || status === 'SHIPPED'
      )
    ) {
      overallStatus = 'PROCESSING'; // If any item is PROCESSING, the order is PROCESSING
    } else {
      overallStatus = 'PENDING'; // Otherwise, the order remains PENDING
    }

    const updatedDistributorOrderOverallStatus =
      await DistributorOrder.updateOne(
        { _id: new Types.ObjectId(requestBody.distributorId) }, // Match the order
        {
          $set: {
            status: overallStatus // Update the status
          }
        }
      );
    const updatedOrderStatus = await UserOrder.findOne({
      _id: new Types.ObjectId(requestBody?.orderId)
    });
    let overallOrderStatus = 'PENDING'; // Default to PENDING if no other status is found

    const ordersItemStatuses = updatedOrderStatus.items.map(
      (item) => item.status
    );

    if (ordersItemStatuses.every((status) => status === 'CANCELLED')) {
      overallOrderStatus = 'CANCELLED'; // If any item is CANCELLED, the whole order is CANCELLED
    } else if (ordersItemStatuses.every((status) => status === 'DELIVERED')) {
      overallOrderStatus = 'DELIVERED'; // If all items are DELIVERED, the order is DELIVERED
    } else if (ordersItemStatuses.some((status) => status === 'DELIVERED')) {
      overallOrderStatus = 'PARTIAL DELIVERED'; // If any item is SHIPPED, the order is SHIPPED
    } else if (
      ordersItemStatuses.some(
        (status) => status === 'PROCESSING' || status === 'SHIPPED'
      )
    ) {
      overallOrderStatus = 'PROCESSING'; // If any item is PROCESSING, the order is PROCESSING
    } else {
      overallOrderStatus = 'PENDING'; // Otherwise, the order remains PENDING
    }

    const updatedOrderOverallStatus = await UserOrder.updateOne(
      { _id: new Types.ObjectId(requestBody.orderId) }, // Match the order
      {
        $set: {
          status: overallOrderStatus // Update the status
        }
      }
    );

    return updatedOrder;
  }

  async getAllDistributorsOrdersPaginated(
    userName?: string,
    role?: string,
    userType?: string,
    status?: string,
    oemId?: string,
    pageNo?: number,
    pageSize?: number,
    employeeId?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<OrderManagementService>:<Search and Filter distributors orders service initiated>'
    );
    const query: any = {};
    const userRoleType = userType === 'OEM' ? true : false;

    if (role === AdminRole.ADMIN) {
      query.oemUserName = { $exists: userRoleType };
    }
    if (!userType) {
      delete query['oemUserName'];
    }

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    if (!status) {
      delete query['status'];
    }
    if (role === 'EMPLOYEE') {
      const userName = oemId;
      const employeeDetails =
        await this.spEmployeeService.getEmployeeByEmployeeId(
          employeeId,
          userName
        );
      console.log(employeeDetails, 'dfwklm');
      // if (employeeDetails) {
      //   query['contactInfo.state'] = {
      //     $in: employeeDetails.state.map((stateObj) => stateObj.name)
      //   };
      //   if (!isEmpty(employeeDetails?.city)) {
      //     query['contactInfo.city'] = {
      //       $in: employeeDetails.city.map((cityObj) => cityObj.name)
      //     };
      //   }
      // }
    }

    const orders: any = await DistributorOrder.aggregate([
      // Match the query
      { $match: query },

      // Unwind the items array
      { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },

      // Lookup cart details
      {
        $lookup: {
          from: 'productcarts',
          localField: 'items.cartId',
          foreignField: '_id',
          as: 'items.cartDetails'
        }
      },

      // Lookup product details
      {
        $lookup: {
          from: 'partnersproducts',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'items.productDetails'
        }
      },

      // Unwind lookup results
      {
        $unwind: {
          path: '$items.cartDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$items.productDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      // Group data back into a single document
      {
        $group: {
          _id: '$_id',
          items: { $push: '$items' },
          customerOrderId: { $first: '$customerOrderId' },
          status: { $first: '$status' },
          totalAmount: { $first: '$totalAmount' },
          oemUserName: { $first: '$oemUserName' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' }
        }
      },

      // Lookup customer order details
      {
        $lookup: {
          from: 'orders', // Collection name for customer orders
          localField: 'customerOrderId',
          foreignField: '_id',
          as: 'customerOrderDetails'
        }
      },

      // Unwind customerOrderDetails
      {
        $unwind: {
          path: '$customerOrderDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'stores', // Collection name for stores
          localField: 'customerOrderDetails.storeId', // Field in distributor data
          foreignField: 'storeId', // Corresponding field in stores collection
          as: 'storeDetails'
        }
      },
      // Unwind storeDetails to include it as a flat structure
      {
        $unwind: {
          path: '$storeDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'admin_users', // Collection name for oemusers
          localField: 'oemUserName', // Field in distributor data
          foreignField: 'userName', // Corresponding field in stores collection
          as: 'oemDetails'
        }
      },
      // Unwind oemDetails to include it as a flat structure
      {
        $unwind: {
          path: '$oemDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      // Optionally sort before pagination
      { $sort: { createdAt: 1 } }, // 1 for ascending order

      // Pagination: Skip and Limit
      { $skip: pageNo * pageSize },
      { $limit: pageSize }
    ]);

    return orders;
  }
}
