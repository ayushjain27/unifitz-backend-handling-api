import { Document, model, Schema, Types } from 'mongoose';

export interface IEmployeeStatus {
  employeeId?: string;
  status?: string;
  oemUserName?: string;
  employeeName?: string;
  createdAt: Date;
}

export const employeeStatusSchema: Schema = new Schema({
  employeeId: { type: String },
  employeeName: { type: String },
  status: { type: String },
  oemUserName: { type: String },
  createdAt: { type: Date }
});

export interface ICartInfo {
  cartId: Types.ObjectId;
  productId: Types.ObjectId;
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
  trackingLink?: string;
  deliveryPartner?: string;
  deliveryType?: string;
  deliveryPhoneNumber?: string;
  selectedVehicleType?: string;
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
    trackingLink: {
      type: String
    },
    deliveryPartner: {
      type: String
    },
    deliveryType: {
      type: String
    },
    deliveryPhoneNumber: {
      type: String
    },
    selectedVehicleType: {
      type: String
    },
    employeeStatus: {
      type: [employeeStatusSchema]
    }
  },
  { _id: false }
);

export interface IPaymentMode {
  _id: Types.ObjectId;
  paymentType: string;
  totalPayment: number;
  advancePayment: number;
  balancePayment: number;
  comment: string;
  oemUserName: string;
  employeeId: string;
  employeeName: string;
  dueDate: Date;
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
    type: String
  },
  employeeId: {
    type: String
  },
  employeeName: {
    type: String
  },
  dueDate: {
    type: Date
  },
  paymentReceived: {
    type: Boolean,
    default: false
  }
});

export interface IDistributorOrderManagement {
  _id?: string;
  customerOrderId?: Types.ObjectId;
  items?: ICartInfo[];
  paymentMode?: IPaymentMode[];
  totalAmount: string;
  oemUserName?: string;
  distributorOrderId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const orderSchema: Schema = new Schema(
  {
    items: {
      type: [cartSchema]
    },
    paymentMode: {
      type: [paymentModeSchema]
    },
    customerOrderId: {
      type: Types.ObjectId
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'PROCESSING',
        'SHIPPED',
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
    },
    distributorOrderId: {
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
