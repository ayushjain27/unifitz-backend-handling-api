import { model, Schema } from 'mongoose';

export enum Status {
  PENDING = 'PENDING',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED'
}

export interface IDeliveryOrder {
  _id?: string;
  deliveryId: string;
  deliveryPhoneNumber: string;
  userName: string;
  address: string;
  orderId: string;
  productId: number;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const deliveryOrderSchema: Schema = new Schema(
  {
    deliveryId: {
      type: String,
      required: true
    },
    deliveryPhoneNumber: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    orderId: {
      type: String,
      required: true
    },
    productId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: Status,
      default: Status.PENDING
    }
  },
  { timestamps: true }
);

const DeliveryOrderModel = model<IDeliveryOrder>(
  'deliveryOrder',
  deliveryOrderSchema
);

export default DeliveryOrderModel;
