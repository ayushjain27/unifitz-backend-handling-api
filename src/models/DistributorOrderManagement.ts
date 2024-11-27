import { Document, model, ObjectId, Schema, Types } from 'mongoose';

export interface ICartInfo {
  cartId: ObjectId;
  productId: ObjectId;
  status: string;
  oemUserName: string;
}

export const cartSchema: Schema = new Schema(
  {
    cartId: { type: Types.ObjectId, required: true },
    productId: { type: Types.ObjectId, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING'
    },
    oemUserName: {
      type: String
    }
  },
  { _id: false }
);

export interface IDistributorOrderManagement {
  _id?: string;
  customerOrderId?: Types.ObjectId;
  items?: ICartInfo[];
  totalAmount: string;
  oemUserName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const orderSchema: Schema = new Schema(
  {
    items: {
      type: [cartSchema]
    },
    customerOrderId: {
      type: Types.ObjectId
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING'
    },
    totalAmount: {
      type: String
    },
    oemUserName: {
      type: String
    }
  },
  { timestamps: true }
);

const DistributorOrder = model<IDistributorOrderManagement & Document>(
  'distributors-orders',
  orderSchema
);

export default DistributorOrder;
