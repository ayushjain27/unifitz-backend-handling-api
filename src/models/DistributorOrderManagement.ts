import { Document, model, Schema, Types } from 'mongoose';

export interface ICartInfo {
  cartId: string;
  quantity: number;
  price: number;
  status: string;
  oemUserName: string;
}

export const cartSchema: Schema = new Schema(
  {
    cartId: { type: String, required: true },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true
    },
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
  orders?: ICartInfo[];
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
      enum: ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
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
