import { Document, model, Schema, ObjectId, Types } from 'mongoose';

export interface IUserInfo {
  userId?:  Types.ObjectId;
  name: string;
  email?: string;
  phoneNumber: string;
}

export const userSchema: Schema = new Schema(
  {
    userId: { type: Types.ObjectId, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true }
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

export interface IUserOrderManagement {
  _id?: string;
  userDetail: IUserInfo;
  items: ICartInfo[];
  totalAmount: number;
  status: string;
  shippingAddress: string;
  userId: Types.ObjectId;
  storeId: string;
  customerId: string;
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
    status: {
      type: String,
      enum: ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING'
    },
    totalAmount: { type: Number, required: true },
    shippingAddress: {
      type: String,
      required: true
    },
    storeId: {
      type: String,
    },
    customerId: {
      type: String
    },
    userId: {
      type: Types.ObjectId,
      required: true
    },
  },
  { timestamps: true }
);

const UserOrder = model<IUserOrderManagement & Document>('orders', orderSchema);

export default UserOrder;
