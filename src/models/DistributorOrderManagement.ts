import { Document, model, Schema, ObjectId, Types } from 'mongoose';

export interface IUserInfo {
  userId?: string;
  name: string;
  email?: string;
  phoneNumber: string;
}

export const userSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  { _id: false }
);

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
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'UNAVAILABLE']
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
    userDetail: {
      type: userSchema
    },
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
    shippingAddress: {
      type: String,
      required: true
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
