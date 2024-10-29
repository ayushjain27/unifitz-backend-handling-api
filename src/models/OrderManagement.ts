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
    }
  },
  { _id: false }
);

export interface IOrderManagement {
  _id?: string;
  userDetail: IUserInfo;
  items: ICartInfo[];
  orderDate: Date;
  totalAmount: number;
  status: string;
  shippingAddress: string;
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
    orderDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING'
    },
    totalAmount: { type: Number, required: true },
    shippingAddress: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const OrderModel = model<IOrderManagement & Document>('orders', orderSchema);

export default OrderModel;
