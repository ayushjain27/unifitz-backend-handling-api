import mongoose, { model, Schema } from 'mongoose';

export enum TemperatureStatus {
  COLD = 'COLD',
  WARM = 'WARM',
  HOT = 'HOT'
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

export interface ITestDrive {
  _id?: string;
  vehicleId: string;
  vehicleName: string;
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
  temperatureStatus: string;
}

const testDriveSchema: Schema = new Schema<ITestDrive>(
  {
    vehicleId: {
      type: String
    },
    userName: {
      type: String
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
    temperatureStatus: {
      type: String,
      enum: TemperatureStatus,
      default: TemperatureStatus.COLD
    }
  },
  { timestamps: true }
);

testDriveSchema.index({ geoLocation: '2dsphere' });

const TestDrive = model<ITestDrive>('testdrive', testDriveSchema);

export default TestDrive;
