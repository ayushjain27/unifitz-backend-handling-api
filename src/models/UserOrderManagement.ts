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
  pendingDate?: Date;
  cancelDate?: Date;
  shippingDate?: Date;
  deliveryDate?: Date;
  processingDate?: Date;
  cancelReason?: string;
  courierCompanyName?: string;
  trackingNumber?: string;
}

export const cartSchema: Schema = new Schema(
  {
    cartId: { type: Types.ObjectId, ref: 'productcarts' },
    productId: { type: Types.ObjectId, ref: 'partnersproducts' },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING'
    },
    oemUserName: {
      type: String
    },
    pendingDate: {
      type: Date
    },
    processingDate: {
      type: Date
    },
    cancelDate: {
      type: Date
    },
    shippingDate: {
      type: Date
    },
    deliveryDate: {
      type: Date
    },
    cancelReason: {
      type: String
    },
    courierCompanyName: {
      type: String
    },
    trackingNumber: {
      type: String
    }
  },
  { _id: false }
);

export interface IPaymentMode {
  paymentType: string;
  totalPayment: number;
  advancePayment: number;
  balancePayment: number;
  comment: string;
  oemUserName: string;
  dueDate: Date;
  paymentId: Types.ObjectId;
  paymentReceived: boolean;
}

export const paymentModeSchema: Schema = new Schema({
  paymentType: {
    type: String,
    required: true
  },
  totalPayment: {
    type: Number,
    required: true
  },
  advancePayment: {
    type: Number,
    required: true
  },
  balancePayment: {
    type: Number,
    required: true
  },
  comment: {
    type: String
  },
  oemUserName: {
    type: String,
    ref: 'admin_user'
  },
  dueDate: {
    type: Date
  },
  paymentReceived: {
    type: Boolean,
    default: false
  },
  paymentId: {
    type: Types.ObjectId,
    required: true
  }
});

export interface IUserOrderManagement {
  _id?: string;
  userDetail: IUserInfo;
  items: ICartInfo[];
  paymentMode?: IPaymentMode[];
  totalAmount: number;
  status: string;
  shippingAddress: string;
  userId: Types.ObjectId;
  storeId: string;
  customerId: string;
  customerOrderId: string;
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
    paymentMode: {
      type: [paymentModeSchema]
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'PROCESSING',
        'PARTIAL DELIVERED',
        'DELIVERED',
        'CANCELLED'
      ],
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
    },
    customerOrderId: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const UserOrder = model<IUserOrderManagement & Document>('orders', orderSchema);

export default UserOrder;
