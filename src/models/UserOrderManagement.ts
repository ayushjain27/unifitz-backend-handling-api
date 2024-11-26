import { Document, model, Schema, ObjectId, Types } from 'mongoose';

export interface IUserInfo {
  userId?: Types.ObjectId;
  name: string;
  email?: string;
  phoneNumber: string;
}

export const userSchema: Schema = new Schema(
  {
    userId: { type: Types.ObjectId },
    name: { type: String },
    email: { type: String },
    phoneNumber: { type: String }
  },
  { _id: false }
);

export interface ICartInfo {
  cartId: ObjectId;
  productId: ObjectId;
  status: string;
  oemUserName: string;
  deliveryDate: Date;
}

export const cartSchema: Schema = new Schema(
  {
    cartId: { type: Types.ObjectId, ref: 'productcarts' },
    productId: { type: Types.ObjectId, ref: 'partnersproducts' },
    status: { type: String },
    oemUserName: {
      type: String
    },
    deliveryDate: {
      type: Date
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
      enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING'
    },
    totalAmount: { type: Number, required: true },
    shippingAddress: {
      type: String,
      required: true
    },
    storeId: {
      type: String
    },
    customerId: {
      type: String
    },
    userId: {
      type: Types.ObjectId,
      required: true
    }
  },
  { timestamps: true }
);

const UserOrder = model<IUserOrderManagement & Document>('orders', orderSchema);

export default UserOrder;
