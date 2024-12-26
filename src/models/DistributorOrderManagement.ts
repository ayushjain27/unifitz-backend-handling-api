import { Document, model, ObjectId, Schema, Types } from 'mongoose';

export interface IEmployeeStatus {
  employeeId?: string;
  status?: string;
  oemUserName?: string;
  employeeName?: string;
  createAt: Date;
}

export const employeeStatusSchema: Schema = new Schema({
  employeeId: { type: String },
  employeeName: { type: String },
  status: { type: String },
  oemUserName: { type: String },
  createdAt: { type: Date }
});

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
  employeeStatus?: IEmployeeStatus[];
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
    },
    employeeStatus: {
      type: [employeeStatusSchema]
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
      enum: [
        'PENDING',
        'PROCESSING',
        'PARTIAL DELIVERED',
        'DELIVERED',
        'CANCELLED'
      ],
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
