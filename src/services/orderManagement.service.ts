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
import _, { isEmpty } from 'lodash';
import DistributorOrder from '../models/DistributorOrderManagement';
import ProductCartModel from '../models/ProductCart';
import { SQSService } from './sqs.service';
import { SQSEvent } from '../enum/sqsEvent.enum';
import { AdminRole } from './../models/Admin';
import { SPEmployeeService } from './spEmployee.service';
import Customer, { ICustomer } from '../models/Customer';
import Store, { IStore } from './../models/Store';
import { StaticIds } from '../models/StaticId';
import { SparePost } from '../models/SparePostRequirement';
import { SparePostStatus } from '../models/SparePostStatus';

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
      customerId: '',
      customerOrderId: ''
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
      params.customerId = String(customer?._id);
      params.userDetail = {
        userId: new Types.ObjectId(customer?._id as string),
        name: customer?.fullName,
        email: customer?.email,
        phoneNumber: customer?.phoneNumber
      };
    }

    const lastCreatedOrderId = await StaticIds.find({}).limit(1).exec();

    const newOrderId = String(
      parseInt(lastCreatedOrderId[0].customerOrderId) + 1
    );

    await StaticIds.findOneAndUpdate({}, { customerOrderId: newOrderId });
    params.customerOrderId = newOrderId;

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

    let userDetailsForNotification = {};
    if(requestBody.userRole === 'STORE_OWNER'){
    userDetailsForNotification = await this.storeService.getStoreByUserId(user._id);
    }else{
    const phoneNumber = requestBody.phoneNumber.slice(-10);
    userDetailsForNotification = await this.customerService.getByPhoneNumber(phoneNumber);
    }

    const result = JSON.stringify(userDetailsForNotification);
    const dataSend = JSON.parse(result);
    // console.log(customerDetails,"fmerkmdf")

    const data = {
      title: `Order Created! #ORD${newOrderId}`,
      body: 'You have created a new order. Your Order is in Pending State.',
      phoneNumber: requestBody.userRole === 'STORE_OWNER' ? dataSend?.contactInfo?.phoneNumber?.primary : dataSend?.phoneNumber,
      role: requestBody.userRole === 'STORE_OWNER' ? 'STORE_OWNER' : 'USER',
      type: 'ORDER_STATUS',
    };
    console.log(data,"data send");
    const notificationMessage = await this.sqsService.createMessage(
      SQSEvent.NOTIFICATION,
      data
    );

    let email = requestBody.userRole === 'STORE_OWNER' ? dataSend?.contactInfo?.email : dataSend?.email;
    if(!isEmpty(email)){
      const templateData = {
        orderId: newOrderId,
        name: dataSend?.basicInfo?.ownerName
      };
    const emailNotificationData = {
      to: email,
      templateData: templateData,
      templateName: 'NewOrder'
    };

    const emailNotification = await this.sqsService.createMessage(
      SQSEvent.EMAIL_NOTIFICATION,
      emailNotificationData
    );
  }

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
      .populate('items.cartId') // Populate cartId in each item
      .populate('items.productId')
      .populate({
        path: 'paymentMode.oemUserName', // Field to populate
        model: 'admin_user', // Target collection
        match: {}, // Optional: Add filters if needed
        localField: 'oemUserName', // Field in paymentModeSchema
        foreignField: 'userName' // Corresponding field in admin_user collection
      }); // Populate productId in each item
    // const orderResponse: any = [];
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
      query.customerId = String(customer._id);
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
          customerOrderId: { $first: '$customerOrderId' },
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
        $set: updateFields,
        ...(requestBody.employeeStatus && {
          $push: {
            'items.$[item].employeeStatus': requestBody.employeeStatus
          }
        })
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
        (status) => status === 'SHIPPED'
      )
    ) {
      overallStatus = 'SHIPPED'; // If any item is PROCESSING, the order is PROCESSING
    } else if (
      itemStatuses.some(
        (status) => status === 'PROCESSING'
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
        (status) => status === 'SHIPPED'
      )
    ) {
      overallOrderStatus = 'SHIPPED'; // If any item is PROCESSING, the order is PROCESSING
    } else if (
      ordersItemStatuses.some(
        (status) => status === 'PROCESSING'
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
    employeeId?: string,
    firstDate?: string,
    lastDate?: string,
    storeId?: string,
    adminFilterOemId?: string,
    state?: string,
    city?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<OrderManagementService>:<Search and Filter distributors orders service initiated>'
    );
    const query: any = {
      status: status
    };

    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);

    const queryTwo: any = {
      'createdAt': {
        $gte: firstDay,
        $lte: nextDate
      },
      'storeDetails.storeId': storeId,
      'oemUserName': adminFilterOemId,
      'storeDetails.contactInfo.state': state,
      'storeDetails.contactInfo.city': city,
    }
    if (firstDate === null || lastDate === null) {
      delete queryTwo['createdAt'];
    }
    if (!storeId) {
      delete queryTwo['storeDetails.storeId'];
    }
    if (!adminFilterOemId) {
      delete queryTwo['oemUserName'];
    }
    if (!state) {
      delete queryTwo['storeDetails.contactInfo.state'];
    }
    if (!city) {
      delete queryTwo['storeDetails.contactInfo.city'];
    }
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
      // console.log(employeeDetails, 'dfwklm');
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
      // { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },

      // // Lookup cart details
      // {
      //   $lookup: {
      //     from: 'productcarts',
      //     localField: 'items.cartId',
      //     foreignField: '_id',
      //     as: 'items.cartDetails'
      //   }
      // },

      // // Lookup product details
      // {
      //   $lookup: {
      //     from: 'partnersproducts',
      //     localField: 'items.productId',
      //     foreignField: '_id',
      //     as: 'items.productDetails'
      //   }
      // },

      // // Unwind lookup results
      // {
      //   $unwind: {
      //     path: '$items.cartDetails',
      //     preserveNullAndEmptyArrays: true
      //   }
      // },
      // {
      //   $unwind: {
      //     path: '$items.productDetails',
      //     preserveNullAndEmptyArrays: true
      //   }
      // },
      // // Group data back into a single document
      // {
      //   $group: {
      //     _id: '$_id',
      //     items: { $push: '$items' },
      //     customerOrderId: { $first: '$customerOrderId' },
      //     status: { $first: '$status' },
      //     totalAmount: { $first: '$totalAmount' },
      //     oemUserName: { $first: '$oemUserName' },
      //     createdAt: { $first: '$createdAt' },
      //     updatedAt: { $first: '$updatedAt' }
      //   }
      // },

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
      { $match: queryTwo },
      // {
      //   $lookup: {
      //     from: 'admin_users', // Collection name for oemusers
      //     localField: 'oemUserName', // Field in distributor data
      //     foreignField: 'userName', // Corresponding field in stores collection
      //     as: 'oemDetails'
      //   }
      // },
      // // Unwind oemDetails to include it as a flat structure
      // {
      //   $unwind: {
      //     path: '$oemDetails',
      //     preserveNullAndEmptyArrays: true
      //   }
      // },
      // Optionally sort before pagination
      { $sort: { createdAt: -1 } }, // 1 for ascending order

      // Pagination: Skip and Limit
      { $skip: pageNo * pageSize },
      { $limit: pageSize }
    ]);

    return orders;
  }

  async getDistributorOrdersCount(
    userName?: string,
    role?: string,
    oemId?: string,
    userType?: string,
    status?: string,
    verifiedStore?: string,
    employeeId?: string,
    firstDate?: string,
    lastDate?: string,
    storeId?: string,
    adminFilterOemId?: string,
    state?: string,
    city?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<OrderManagementService>:<Search and Filter orders count service initiated>'
    );
    const query: any = {};
    const userRoleType = userType === 'OEM' ? true : false;
    let pending: any = 0;
    let processing: any = 0;
    let shipped: any = 0;
    let partialDelivered: any = 0;
    let delivered: any = 0;
    let cancelled: any = 0;

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

    const overallStatus = {
      status: status
    };
    if (!status) {
      delete query['status'];
      delete overallStatus['status'];
    }

    if (role === 'EMPLOYEE') {
      const userName = oemId;
      const employeeDetails =
        await this.spEmployeeService.getEmployeeByEmployeeId(
          employeeId,
          userName
        );
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

    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);

    const queryTwo: any = {
      'createdAt': {
        $gte: firstDay,
        $lte: nextDate
      },
      'storeDetails.storeId': storeId,
      'oemUserName': adminFilterOemId,
      'storeDetails.contactInfo.state': state,
      'storeDetails.contactInfo.city': city,
    }
    if (!firstDate || !lastDate) {
      delete queryTwo['createdAt'];
    }
    if (!storeId) {
      delete queryTwo['storeDetails.storeId'];
    }
    if (!adminFilterOemId) {
      delete queryTwo['oemUserName'];
    }
    if (!state) {
      delete queryTwo['storeDetails.contactInfo.state'];
    }
    if (!city) {
      delete queryTwo['storeDetails.contactInfo.city'];
    }

    const aggregatedFilter = [{
      $lookup: {
        from: 'orders',
        localField: 'customerOrderId',
        foreignField: '_id',
        as: 'customerOrderDetails'
      }
    },
    {
      $unwind: {
        path: '$customerOrderDetails',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'stores',
        localField: 'customerOrderDetails.storeId',
        foreignField: 'storeId',
        as: 'storeDetails'
      }
    },
    {
      $unwind: {
        path: '$storeDetails',
        preserveNullAndEmptyArrays: true
      }
    }];

    // const total = await DistributorOrder.aggregate(
    //   [
    //     {
    //       $match: { ...overallStatus }
    //     },
    //     ...aggregatedFilter,
    //     { $match: queryTwo },
    //     { $count: 'totalCount' }
    //   ]);

    if (status === 'PENDING' || !status) {
      pending = await DistributorOrder.aggregate([
        {
          $match: {
            status: 'PENDING',
            ...query
          }
        },
        ...aggregatedFilter,
        { $match: queryTwo },
        { $count: 'pendingCount' }
      ]);
    }
    if (status === 'PROCESSING' || !status) {
      processing = await DistributorOrder.aggregate(
        [
          {
            $match: {
              status: 'PROCESSING',
              ...query
            }
          },
          ...aggregatedFilter,
          { $match: queryTwo },
          { $count: 'processingCount' }
        ]);
    }
    if (status === 'SHIPPED' || !status) {
      shipped = await DistributorOrder.aggregate(
        [
          {
            $match: {
              status: 'SHIPPED',
              ...query
            }
          },
          ...aggregatedFilter,
          { $match: queryTwo },
          { $count: 'shippedCount' }
        ]);
    }
    if (status === 'PARTIAL DELIVERED' || !status) {
      partialDelivered = await DistributorOrder.aggregate(
        [
          {
            $match: {
              status: 'PARTIAL DELIVERED',
              ...query
            }
          },
          ...aggregatedFilter,
          { $match: queryTwo },
          { $count: 'partialCount' }
        ]);
    }
    if (status === 'DELIVERED' || !status) {
      delivered = await DistributorOrder.aggregate(
        [
          {
            $match: {
              status: 'DELIVERED',
              ...query
            }
          },
          ...aggregatedFilter,
          { $match: queryTwo },
          { $count: 'deliveredCount' }
        ]);
    }
    if (status === 'CANCELLED' || !status) {
      cancelled = await DistributorOrder.aggregate(
        [
          {
            $match: {
              status: 'CANCELLED',
              ...query
            }
          },
          ...aggregatedFilter,
          { $match: queryTwo },
          { $count: 'cancelledCount' }
        ]);
    }

    const totalCounts = {
      pending: pending.length > 0 ? pending[0].pendingCount : 0,
      shipped: shipped.length > 0 ? shipped[0].shippedCount : 0,
      processing: processing.length > 0 ? processing[0].processingCount : 0,
      partialDelivered: partialDelivered.length > 0 ? partialDelivered[0].partialCount : 0,
      delivered: delivered.length > 0 ? delivered[0].deliveredCount : 0,
      cancelled: cancelled.length > 0 ? cancelled[0].cancelledCount : 0
    };
    const totalRes = { ...totalCounts, total: Object.values(totalCounts).reduce((total, count) => total + count, 0)}
console.log((pending.length > 0 ? pending[0].pendingCount : 0, shipped.length > 0 ? shipped[0].shippedCount : 0, processing.length > 0 ? processing[0].processingCount : 0, partialDelivered.length > 0 ? partialDelivered[0].partialCount : 0, delivered.length > 0 ? delivered[0].deliveredCount : 0, cancelled.length > 0 ? cancelled[0].cancelledCount : 0), 'numbersss');
console.log(totalRes, 'totalRes');
    return totalRes;
  }

  async getDistributorOrderById(id?: string): Promise<any> {
    Logger.info(
      '<Service>:<OrderManagementService>:<Get Order Details Fetching>'
    );
    const orders: any = await DistributorOrder.aggregate([
      // Match the query
      { $match: { _id: new Types.ObjectId(id) } },

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
          paymentMode: { $first: '$paymentMode' },
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
      }
    ]);

    return orders[0];
  }

  async updatePaymentMode(requestPayload: any): Promise<any> {
    Logger.info(
      '<Service>:<OrderManagementService>:<Updating Payment Details>'
    );
    try {
      const checkDistributorOrder = await DistributorOrder.findOne({
        _id: new Types.ObjectId(requestPayload.distributorOrderId)
      });
      if (isEmpty(checkDistributorOrder)) {
        throw new Error('Order not Found');
      }
      const distributorOrderPaymentPayload =
        await DistributorOrder.findOneAndUpdate(
          {
            _id: new Types.ObjectId(requestPayload.distributorOrderId)
          },
          {
            $set: {
              paymentMode: requestPayload
            }
          },
          { new: true }
        );

      const checkUserOrder = await UserOrder.findOne({
        _id: new Types.ObjectId(checkDistributorOrder.customerOrderId)
      });

      if (isEmpty(checkUserOrder)) {
        throw new Error('Order not Found');
      }

      const userOrderPayload = {
        paymentType: requestPayload.paymentType,
        totalPayment: requestPayload.totalPayment,
        advancePayment: requestPayload.advancePayment,
        balancePayment: requestPayload.balancePayment,
        comment: requestPayload?.comment,
        oemUserName: requestPayload.oemUserName,
        dueDate: requestPayload?.dueDate,
        paymentId: distributorOrderPaymentPayload?.paymentMode[0]?._id
      };

      if (isEmpty(checkUserOrder.paymentMode)) {
        const updateUserOrderPaymentMode = await UserOrder.findOneAndUpdate(
          {
            _id: new Types.ObjectId(checkDistributorOrder.customerOrderId)
          },
          { $set: { paymentMode: userOrderPayload } }
        );
      } else {
        const updateUserOrderPaymentMode = await UserOrder.findOneAndUpdate(
          {
            _id: new Types.ObjectId(checkDistributorOrder.customerOrderId)
          },
          { $push: { paymentMode: userOrderPayload } }
        );
      }

      return distributorOrderPaymentPayload;
    } catch (error) {
      throw new Error(error);
    }
  }

  async updatePaymentStatus(requestPayload: any): Promise<any> {
    Logger.info('<Service>:<OrderManagementService>:<Updating Payment Status>');
    try {
      const checkPaymentDetails = await DistributorOrder.findOne({
        _id: new Types.ObjectId(requestPayload.distributorOrderId)
      });

      if (!isEmpty(checkPaymentDetails)) {
        const paymentModeId = checkPaymentDetails?.paymentMode?.[0]?._id;
        // Ensure you import this for ObjectId handling

        // Step 2: Check if the payment details exist and update paymentReceived
        const updatedPaymentDetails = await DistributorOrder.findOneAndUpdate(
          {
            _id: new Types.ObjectId(requestPayload.distributorOrderId),
            paymentMode: {
              $elemMatch: {
                _id: new Types.ObjectId(paymentModeId) // Match using correct _id
              }
            }
          },
          {
            $set: {
              'paymentMode.$.paymentReceived': true // Update the specific element
            }
          },
          { new: true } // Return the updated document
        );
        // Log success or proceed with further logic
        console.log('Payment updated successfully:', updatedPaymentDetails);
      }

      const checkUserOrderPaymentDetails = await UserOrder.findOne({
        _id: new Types.ObjectId(checkPaymentDetails.customerOrderId),
        paymentMode: {
          $elemMatch: {
            paymentId: checkPaymentDetails?.paymentMode?.[0]?._id
          }
        }
      });

      if (isEmpty(checkUserOrderPaymentDetails)) {
        throw new Error('Order not Found');
      }

      console.log(checkPaymentDetails?.paymentMode?.[0]?._id, 'dekmkm');

      const updatedUserPaymentDetails = await UserOrder.findOneAndUpdate(
        {
          _id: new Types.ObjectId(checkPaymentDetails.customerOrderId),
          paymentMode: {
            $elemMatch: {
              paymentId: new Types.ObjectId(
                checkPaymentDetails?.paymentMode?.[0]?._id
              )
            }
          }
        },
        {
          $set: {
            'paymentMode.$.paymentReceived': true // Update the specific element in the paymentMode array
          }
        }
      );

      return updatedUserPaymentDetails;
    } catch (error) {
      throw new Error(error);
    }
  }

  async createSparePostRequirement(sparePostList?: any) {
    Logger.info(
      '<Service>:<OrderManagementService>:<create sparePosts service initiated>'
    );
    const query = sparePostList;

    const result = await SparePost.create(query);
    return result;
  }

  async updateAudio(fileID: string, req: Request | any): Promise<any> {
    Logger.info('<Service>:<OrderManagementService>:<Upload Audio initiated>');
    const sparePostInfo = await SparePost.findOne(
      { _id: fileID },
      { verificationDetails: 0 }
    );
    if (_.isEmpty(sparePostInfo)) {
      throw new Error('File does not exist');
    }

    const files: any = req.files;

    if (!files) {
      throw new Error('Files not found');
    }
    const audioList: any = [];

    for (const file of files) {
      const fileName = file.originalname;
      const { key, url } = await this.s3Client.uploadAudio(
        fileID,
        fileName,
        file.buffer
      );
      audioList.push({ key, docURL: url });
    }

    const audioUrl = audioList[0] || '';

    const queryJson = {
      audioUrl
    };

    console.log(queryJson, sparePostInfo, 'sparePostInfo');

    if (!audioUrl) delete queryJson['audioUrl'];

    const res = await SparePost.findOneAndUpdate(
      { _id: fileID },
      { $set: queryJson },
      {
        returnDocument: 'after',
        projection: { 'verificationDetails.verifyObj': 0 }
      }
    );
    return res;
  }

  async updateImage(fileID: string, req: Request | any): Promise<any> {
    Logger.info('<Service>:<OrderManagementService>:<Upload Audio initiated>');
    const sparePostInfo = await SparePost.findOne(
      { _id: fileID },
      { verificationDetails: 0 }
    );
    if (_.isEmpty(sparePostInfo)) {
      throw new Error('File does not exist');
    }

    const files: any = req.files;

    if (!files) {
      throw new Error('Files not found');
    }
    const imageList: any = [];

    for (const file of files) {
      const fileName = file.originalname;
      const { key, url } = await this.s3Client.uploadFile(
        fileID,
        fileName,
        file.buffer
      );
      imageList.push({ key, docURL: url });
    }

    const sparePartImage = imageList[0] || '';

    const queryJson = {
      sparePartImage
    };

    if (!sparePartImage) delete queryJson['sparePartImage'];

    const res = await SparePost.findOneAndUpdate(
      { _id: fileID },
      { $set: queryJson },
      {
        returnDocument: 'after',
        projection: { 'verificationDetails.verifyObj': 0 }
      }
    );
    return res;
  }

  async updateSparePost(reqBody: any, sparePostId: string): Promise<any> {
    Logger.info('<Service>:<OrderManagementService>:<Update SparePost details >');
    const jsonResult = await SparePost.findOne({
      _id: sparePostId
    });

    if (_.isEmpty(jsonResult)) {
      throw new Error('sparePostRequirement does not exist');
    }
    const query: any = {};
    query._id = reqBody._id;
    const res = await SparePost.findOneAndUpdate(query, reqBody, {
      returnDocument: 'after',
      projection: { 'verificationDetails.verifyObj': 0 }
    });
    return res;
  }

  async deleteSparePost(sparePostId: string) {
    Logger.info('<Service>:<OrderManagementService>:<Delete sparePost >');
    const jsonResult = await SparePost.findOne({
      _id: sparePostId
    });

    if (_.isEmpty(jsonResult)) {
      throw new Error('sparePostRequirement does not exist');
    }
    const res = await SparePost.findOneAndDelete({
      _id: new Types.ObjectId(sparePostId)
    });
    return res;
  }

  async getSparePostRequirementDetails(
    pageNo?: number,
    pageSize?: number,
    sparePostId?: string,
    platform?: string): Promise<any> {
    Logger.info('<Service>:<OrderManagementService>:<get SparePost initiated>');

    let jsonResult;

    if (platform === 'PARTNER_APP') {
      const store = await Store.findOne({ storeId: sparePostId }, { verificationDetails: 0 });
      if (!store) throw new Error('Store not found');

      jsonResult = await SparePost.aggregate([
        {
          $match: { storeId: sparePostId }
        },
        {
          $skip: pageNo * pageSize
        },
        {
          $limit: pageSize
        }
      ]);
    } else if (platform === 'CUSTOMER_APP') {
      const user = await Customer.findOne({ _id: new Types.ObjectId(sparePostId) });
      if (!user) throw new Error('User not found');

      jsonResult = await SparePost.aggregate([
        {
          $match: { customerId: sparePostId }
        },
        {
          $skip: pageNo * pageSize
        },
        {
          $limit: pageSize
        }
      ]);
    }

    if (!jsonResult) throw new Error('SparePost Requirement does not exist');

    Logger.info('<Service>:<OrderManagementService>:<get SparePost successful>');

    return jsonResult;
  }

  async getSparePostPaginated(
    pageNo?: number,
    pageSize?: number,
    storeId?: string,
    vehicleType?: string,
    userName?: string,
    role?: string,
    oemId?: string,
    firstDate?: string,
    lastDate?: string,
    adminFilterOemId?: string
  ): Promise<any> {
    Logger.info('<Service>:<OrderManagementService>:<get sparePost initiated>');
    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);

    const query: any = {
      'storeId': storeId,
      'vehicleType': vehicleType,
      'createdAt': {
        $gte: firstDay,
        $lte: nextDate
      },
    };

    const queryTwo: any = {};

    if(adminFilterOemId) {
      queryTwo.$or = [
        { 'lastStatus.oemUserName': adminFilterOemId },
        { 'lastStatus.createdOemUser': adminFilterOemId }
      ];
    }

    let filterQuery: any = {};
    if (firstDate === 'Invalid Date' ||  !firstDate  || lastDate === 'Invalid Date' || !lastDate) {
      delete query['createdAt'];
    }
    if (!storeId) delete query['storeId'];
    if (!vehicleType) delete query['vehicleType'];
    let aggregateQuery: any = [];

    if(role === 'ADMIN' || (role === 'EMPLOYEE' && oemId === 'SERVICEPLUG')) {
     aggregateQuery = [
      { $addFields: { lastStatus: { $arrayElemAt: ['$statusDetails', -1] }}},
      { $project: { 'statusDetails': 0 } },
      { $unwind: { path: '$lastStatus', preserveNullAndEmptyArrays: true } },
     ];
    }
    if(role === 'OEM' || (role === 'EMPLOYEE' && oemId !== 'SERVICEPLUG')) {
      const user = role === 'OEM' ? userName : oemId;
       filterQuery.$or = [
        { 'lastStatus.createdOemUser': { $in: [user] } },
        { 'lastStatus.oemUserName': { $in: [user] } },
      ];
      aggregateQuery = [
      { $addFields: { lastStatus: { $arrayElemAt: ['$statusDetails', -1] }}},
       { $match: filterQuery},
       { $project: { 'statusDetails': 0 } },
       { $unwind: { path: '$lastStatus', preserveNullAndEmptyArrays: true } },
      ];
     }
    console.log(query, 'queryJson', role);

    const sparePostLists = await SparePost.aggregate([
      {
        $match: query
      },
      {
        $set: {
          postKey: { $toObjectId: '$_id' }
        }
      },
      {
        $lookup: {
          from: 'spares',
          let: { postKey: '$postKey' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toObjectId: '$sparePostId' }, '$$postKey']
                }
              }
            }
          ],
          as: 'statusDetails'
        }
      },
      ...aggregateQuery,
      {
        $match: queryTwo
      },
      { $sort: { createdAt: -1 } },
      {
        $skip: pageNo * pageSize
      },
      {
        $limit: pageSize
      }
    ]);

    return sparePostLists;
  }

  async getSparePostCount(
    storeId?: string,
    vehicleType?: string,
    userName?: string,
    role?: string,
    oemId?: string,
    firstDate?: string,
    lastDate?: string,
    adminFilterOemId?: string
  ): Promise<any> {
    Logger.info('<Service>:<OrderManagementService>:<get sparePost initiated>');

    const firstDay = new Date(firstDate);
    const lastDay = new Date(lastDate);
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + 1);

    const query: any = {
      'storeId': storeId,
      'vehicleType': vehicleType,
      'createdAt': {
        $gte: firstDay,
        $lte: nextDate
      },
    };

    const queryTwo: any = {};

    if(adminFilterOemId) {
      queryTwo.$or = [
        { 'lastStatus.oemUserName': adminFilterOemId },
        { 'lastStatus.createdOemUser': adminFilterOemId }
      ];
    }

    let filterQuery: any = {};
    if (firstDate === 'Invalid Date' ||  !firstDate  || lastDate === 'Invalid Date' || !lastDate) {
      delete query['createdAt'];
    }
    if (!storeId) delete query['storeId'];
    if (!vehicleType) delete query['vehicleType'];
    let aggregateQuery: any = [];

    if(role === 'ADMIN' || (role === 'EMPLOYEE' && oemId === 'SERVICEPLUG')) {
     aggregateQuery = [
      { $addFields: { lastStatus: { $arrayElemAt: ['$statusDetails', -1] }}},
      { $project: { 'statusDetails': 0 } },
      { $unwind: { path: '$lastStatus', preserveNullAndEmptyArrays: true } },
     ];
    }
    if(role === 'OEM' || (role === 'EMPLOYEE' && oemId !== 'SERVICEPLUG')) {
      const user = role === 'OEM' ? userName : oemId;
       filterQuery.$or = [
        { 'lastStatus.createdOemUser': { $in: [user] } },
        { 'lastStatus.oemUserName': { $in: [user] } },
      ];
      aggregateQuery = [
      { $addFields: { lastStatus: { $arrayElemAt: ['$statusDetails', -1] }}},
       { $match: filterQuery},
       { $project: { 'statusDetails': 0 } },
       { $unwind: { path: '$lastStatus', preserveNullAndEmptyArrays: true } },
      ];
     }
    // console.log(query, 'queryJson', role);

    const totalCountQuery = await SparePost.aggregate([
      {
        $match: query
      },
      {
        $set: {
          postKey: { $toObjectId: '$_id' }
        }
      },
      {
        $lookup: {
          from: 'spares',
          let: { postKey: '$postKey' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toObjectId: '$sparePostId' }, '$$postKey']
                }
              }
            }
          ],
          as: 'statusDetails'
        }
      },
      ...aggregateQuery,
      {
        $match: queryTwo
      },
      {
        $count: "totalCount"
      }
    ]);
    
    const totalCount = totalCountQuery.length > 0 ? totalCountQuery[0].totalCount : 0;
    
    const sparePostCounts = {
      total: totalCount || 0
    }
    
    return sparePostCounts;
  }

  async getSparePostRequirementDetailById(spareRequirementId: string): Promise<any> {
    Logger.info('<Service>:<OrderManagementService>:<get sparePost Detail By Id initiated>');
    try {
      const spareRequirementDetail = await SparePost.findOne({
        _id: new Types.ObjectId(spareRequirementId)
      });

      if (!spareRequirementDetail) {
        throw new Error('Detail not found');
      }

      return spareRequirementDetail;
    } catch (error) {
      Logger.error(`Error fetching spare requirement: ${error.message}`);
      throw new Error(`Error retrieving spare post requirement details. ${error.message}`);
    }
  }

  async createSparePostStatus(sparePostList?: any, userName?: any, role?: any) {
    Logger.info(
      '<Service>:<OrderManagementService>:<create sparePosts service initiated>'
    );
    const query = sparePostList;
    if (role === AdminRole.OEM || (role === 'EMPLOYEE' && sparePostList?.oemId !== 'SERVICEPLUG')) {
      const user = role === 'OEM' ? userName : sparePostList?.oemId;
      query.createdOemUser = user;
    }
    const result = await SparePostStatus.create(query);
    return result;
  }

  async getSparePostStatusDetails(sparePostId?: string, userName?: string, role?: string, oemId?: string): Promise<any> {
    Logger.info('<Service>:<OrderManagementService>:<get SparePost initiated>');

    const sparePost = await SparePost.findOne({ _id: sparePostId }, { verificationDetails: 0 });
    if (!sparePost) throw new Error('SparePost not found');

    let query: any = { sparePostId: sparePostId };
    if (role === AdminRole.OEM) {
      query.$or = [
        { 'createdOemUser': { $in: [userName] } },
        { 'oemUserName': { $in: [userName] } },
      ];
    }

    if (role === AdminRole.EMPLOYEE) {
      query.$or = [
        { 'createdOemUser': { $in: [oemId] } },
        { 'oemUserName': { $in: [oemId] } },
      ];
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    const jsonResult = await SparePostStatus.find(query);

    Logger.info('<Service>:<OrderManagementService>:<get SparePost successful>');

    return jsonResult;
  }
}
