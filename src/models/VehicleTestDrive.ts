import mongoose, { model, Schema } from 'mongoose';

export enum EnquiryStatus {
  COLD = 'COLD',
  WARM = 'WARM',
  HOT = 'HOT',
  BOOKED = 'BOOKED',
  DELIVERED = 'DELIVERED',
  CLOSED = 'CLOSED'
}
export interface IStoreInfo {
  state: string;
  city: string;
  storeId: string;
}

export const storeSchema: Schema = new Schema(
  {
    state: {
      type: String
    },
    city: {
      type: String
    },
    storeId: {
      type: String
    }
  },
  {
    _id: false
  }
);

export interface IComment {
  text: string;
  createdAt: Date;
}
export const commentSchema: Schema = new Schema(
  {
    text: { type: String },
    createdAt: { type: Date }
  },
  {
    _id: false,
    strict: false
  }
);

export interface ITestDrive {
  _id?: string;
  vehicleId: string;
  vehicleName: string;
  comment: IComment[];
  followUpdate: Date;
  userName: string;
  storeDetails: IStoreInfo;
  brand: string;
  model: string;
  userId?: string;
  email?: string;
  phoneNumber?: string;
  state?: string;
  city?: string;
  geoLocation: {
    type: string;
    coordinates: number[];
  };
  oemUserName?: string;
  partnerEmail: string;
  dealerName: string;
  notificationView: boolean;
  enquiryStatus: string;
  count?: number;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const testDriveSchema: Schema = new Schema<ITestDrive>(
  {
    vehicleId: {
      type: String
    },
    userName: {
      type: String
    },
    comment: {
      type: [commentSchema]
    },
    followUpdate: {
      type: Date
    },
    vehicleName: {
      type: String
    },
    storeDetails: {
      type: storeSchema
    },
    brand: {
      type: String
    },
    model: {
      type: String
    },
    userId: {
      type: String
    },
    email: {
      type: String
    },
    phoneNumber: {
      type: String
    },
    state: {
      type: String
    },
    city: {
      type: String
    },
    geoLocation: {
      // kind: String,
      type: { type: String, default: 'Point' },
      coordinates: [{ type: Number }]
    },
    oemUserName: {
      type: String
    },
    partnerEmail: {
      type: String
    },
    dealerName: {
      type: String
    },
    notificationView: {
      type: Boolean,
      default: false
    },
    address: {
      type: String
    },
    enquiryStatus: {
      type: String,
      enum: EnquiryStatus,
      default: EnquiryStatus.COLD
    },
    count: {
      type: Number
    }
  },
  { timestamps: true }
);

testDriveSchema.index({ geoLocation: '2dsphere' });

const TestDrive = model<ITestDrive>('testdrive', testDriveSchema);

export default TestDrive;
