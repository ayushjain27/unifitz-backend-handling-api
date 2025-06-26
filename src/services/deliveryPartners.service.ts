/* eslint-disable no-console */
import { injectable } from 'inversify';
import _ from 'lodash';
import bcrypt from 'bcryptjs';
import Payload from '../types/payload';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { S3Service } from './s3.service';
import { AdminRole } from '../models/Admin';
import { SQSService } from './sqs.service';
import DeliveryPartners, {
  IDeliveryPartners
} from '../models/DeliveryPartners';
import { generateToken } from '../utils';
import DeliveryOrderModel from '../models/DeliveryOrder';
import DistributorOrder, { IEmployeeStatus } from '../models/DistributorOrderManagement';
import ProductCartModel from '../models/ProductCart';
import { OrderManagementService } from './orderManagement.service';

@injectable()
export class DeliveryPartnerService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private sqsService = container.get<SQSService>(TYPES.SQSService);
  private orderManagementService = container.get<OrderManagementService>(TYPES.OrderManagementService);

  async create(deliveryPatnerPayload: IDeliveryPartners): Promise<any> {
    Logger.info(
      '<Service>:<DeliveryPartnerService>: <Delivery Partner Creation: creating new delivery partner>'
    );

    // check if store id exist
    const { userName } = deliveryPatnerPayload;

    try {
      // Find the latest delivery partner with the same userName
      const latestPartner = await DeliveryPartners.findOne({
        userName
      }).sort({ createdAt: -1 });

      if (userName === 'SERVICEPLUG') {
        if (latestPartner && latestPartner.partnerId) {
          const prefix = latestPartner.partnerId.substring(0, 11); // Get "SP2245"
          const numericPart = latestPartner.partnerId.substring(11); // Get "01"

          // Increment the numeric part and pad with leading zeros
          const incrementedNumber = String(
            parseInt(numericPart, 10) + 1
          ).padStart(numericPart.length, '0');
          const newPartnerId = prefix + incrementedNumber;

          deliveryPatnerPayload.partnerId = newPartnerId;
        } else {
          deliveryPatnerPayload.partnerId = `${deliveryPatnerPayload?.userName}00`;
        }
      } else {
        if (latestPartner && latestPartner.partnerId) {
          const prefix = latestPartner.partnerId.substring(0, 6); // Get "SP2245"
          const numericPart = latestPartner.partnerId.substring(6); // Get "01"

          // Increment the numeric part and pad with leading zeros
          const incrementedNumber = String(
            parseInt(numericPart, 10) + 1
          ).padStart(numericPart.length, '0');
          const newPartnerId = prefix + incrementedNumber;

          deliveryPatnerPayload.partnerId = newPartnerId;
        } else {
          deliveryPatnerPayload.partnerId = `${deliveryPatnerPayload?.userName}00`;
        }
      }
      const updatedPassword = await this.encryptPassword(
        deliveryPatnerPayload?.security
      );
      deliveryPatnerPayload.password = updatedPassword;
      const newDeliveryPartner = await DeliveryPartners.create(
        deliveryPatnerPayload
      );

      Logger.info(
        '<Service>:<DeliveryPartnerService>:<Delivery Partner created successfully>'
      );
      return newDeliveryPartner;
    } catch (error) {
      Logger.error(
        `<Service>:<DeliveryPartnerService>: <Error in create>: ${error.message}`
      );
      throw error;
    }
  }

  private async encryptPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    return hashed;
  }

  async uploadDeliveryPartnerImage(
    deliveryPartnerId: string,
    req: Request | any
  ) {
    Logger.info(
      '<Service>:<DeliveryPartnerService>:<Delivery Partner image uploading>'
    );
    const deliveryPartner: IDeliveryPartners = await DeliveryPartners.findOne({
      _id: new Types.ObjectId(deliveryPartnerId)
    });
    if (_.isEmpty(deliveryPartner)) {
      throw new Error('Delivery Partner does not exist');
    }
    const file: any = req.file;

    let profileImageUrl: any = deliveryPartner.profileImageUrl || '';

    if (!file) {
      throw new Error('Files not found');
    }

    const fileName = 'profile';
    const { url } = await this.s3Client.uploadFile(
      deliveryPartnerId,
      fileName,
      file.buffer
    );
    profileImageUrl = url;

    const res = await DeliveryPartners.findOneAndUpdate(
      { _id: new Types.ObjectId(deliveryPartnerId) },
      { $set: { profileImageUrl } },
      { returnDocument: 'after' }
    );
    return res;
  }

  async getDeliveryPartnersPaginated(
    pageNo: number,
    pageSize: number,
    reqPayload: any,
    role?: string,
    userName?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<DeliveryPartnerService>:<Get all delivery partners>'
    );

    let query: any = {};
    if (reqPayload?.state) {
      query['state.name'] = reqPayload?.state;
    }
    if (reqPayload?.city) {
      query['city.name'] = reqPayload?.city;
    }
    if (reqPayload?.selectedPartner) {
      query.userName = reqPayload?.selectedPartner;
    }

    if (role === AdminRole.OEM) {
      query.userName = userName;
    }

    if (role === AdminRole.EMPLOYEE && reqPayload?.oemId !== 'SERVICEPLUG') {
      query.userName = reqPayload.oemId;
    }

    const deliveryParntersResponse = await DeliveryPartners.find(query)
      .skip(pageNo * pageSize)
      .limit(pageSize);
    return deliveryParntersResponse;
  }

  async countAllDeliveryPartners(
    reqPayload: any,
    role?: string,
    userName?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<DeliveryPartnerService>:<Count all delivery partners  service initiated>'
    );

    const query: any = {};
    if (reqPayload?.state) {
      query['state.name'] = reqPayload?.state;
    }
    if (reqPayload?.city) {
      query['city.name'] = reqPayload?.city;
    }
    if (reqPayload?.selectedPartner) {
      query.userName = reqPayload?.selectedPartner;
    }

    if (role === AdminRole.OEM) {
      query.userName = userName;
    }

    if (role === AdminRole.EMPLOYEE && reqPayload.oemId !== 'SERVICEPLUG') {
      query.userName = reqPayload.oemId;
    }

    const count = await DeliveryPartners.countDocuments(query);

    return { count: count };
  }

  async getAllDeliveryPartnersByUserName(
    oemId: string,
    vehicleType: string,
    role?: string,
    userName?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<DeliveryPartnerService>:<Get all delivery partners by username service initiated>'
    );

    const query: any = {
      vehicleType: vehicleType
    };

    if (role === AdminRole.OEM) {
      query.userName = userName;
    }

    if (role === AdminRole.EMPLOYEE && oemId !== 'SERVICEPLUG') {
      query.userName = oemId;
    }

    const result = await DeliveryPartners.find(query);

    return result;
  }

  async getDeliveryPartnerDetailsByPartnerId(partnerId: string): Promise<any> {
    Logger.info(
      '<Service>:<DeliveryPartnerService>:<Count all delivery partners by username service initiated>'
    );

    const result = await DeliveryPartners.findOne({ partnerId });

    return result;
  }

  async login(userName: string, password: string): Promise<any> {
    Logger.info('<Service>:<DeliveryPartnerService>:<login service initiated>');
    const deliveryPartnerDetails = await DeliveryPartners.findOne({
      partnerId: userName
    });
    if (!deliveryPartnerDetails) {
      throw new Error('Delivery Partner not found');
    }
    if (!(await bcrypt.compare(password, deliveryPartnerDetails.password))) {
      throw new Error('Password validation failed');
    }
    const payload: Payload = {
      userId: deliveryPartnerDetails.partnerId,
      role: deliveryPartnerDetails.role
    };
    const token = await generateToken(payload);
    return { user: deliveryPartnerDetails, token };
  };

  async getAllDeliveryOrders(
    deliveryId?: string,
  ): Promise<any> {
    Logger.info('<Service>:<DeliveryPartnerService>:<Get all delivery orders initiated>');

    console.log(deliveryId,"Sdlemkd")

    const result = await DeliveryOrderModel.aggregate([
      {
        $match: {
          deliveryId: deliveryId // Filter for pending orders (corrected from "PERUDING")
        }
      },
      {
        $group: {
          _id: {
            status: "$status",
            address: "$address"
          },
          count: { $sum: 1 },
          orders: { $push: "$$ROOT" }
        }
      },
      {
        $project: {
          _id: 0,
          status: "$_id.status",
          address: "$_id.address",
          count: 1,
          orders: 1
        }
      }
    ]);

    Logger.info(
      '<Service>:<DeliveryPartnerService>:<get SparePost successful>'
    );

    return result;
  }

  async postDeliveryDone(
    requestPayload?: any,
  ): Promise<any> {
    Logger.info('<Service>:<DeliveryPartnerService>:<Post Delivery Done initiated>');

    const { items } = requestPayload;

    const result = await items.map(async(item: any)=>{
      const checkOrderId = await DistributorOrder.findOne({
        distributorOrderId: item?.orderId
      });
      if(!checkOrderId){
        throw new Error('This order not exists');
      }
      const checkProducts = await ProductCartModel.findOne({
        productOrderId: item?.productId
      })
      if(!checkProducts){
        throw new Error('This product not exists');
      };
      const data = checkOrderId.items.filter((orderItem) => 
        orderItem?.productId?.toString() === checkProducts.productId?.toString()
      );
      const userName = `${item?.deliveryId?.slice(0, 6)}`;
      const updateStatusData = {
        distributorId: checkOrderId?._id?.toString(),
        orderId: checkOrderId?.customerOrderId?.toString(),
        cartId: data[0]?.cartId?.toString(),
        productId: item?.productId,
        cancelReason: '',
        courierCompanyName: data[0]?.courierCompanyName || '',
        trackingNumber: data[0]?.trackingNumber || '',
        trackingLink: data[0]?.trackingLink || '',
        deliveryPartner: data[0]?.deliveryPartner || '',
        deliveryType: data[0]?.deliveryType || '',
        selectedVehicleType: data[0]?.selectedVehicleType || '',
        status: 'DELIVERED',
        employeeStatus: data[0]?.employeeStatus ?  data[0]?.employeeStatus : {}
      };
      const updateOrder = this.orderManagementService.updateCartStatus(updateStatusData, userName)
    })

    Logger.info(
      '<Service>:<DeliveryPartnerService>:<get SparePost successful>'
    );

    return {
      message: 'Delivered'
    };
  }
}
