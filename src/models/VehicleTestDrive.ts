import mongoose, { model, Schema } from 'mongoose';

export interface ITestDrive {
  _id?: string;
  vehicleId: string;
  vehicleName: string;
  brand: string;
  model: string;
  userName?: string;
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
}

const testDriveSchema: Schema = new Schema<ITestDrive>(
  {
    vehicleId: {
      type: String
    },
    vehicleName: {
      type: String
    },
    brand: {
      type: String
    },
    model: {
      type: String
    },
    userName: {
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
    }
  },
  { timestamps: true }
);

testDriveSchema.index({ geoLocation: '2dsphere' });

const TestDrive = model<ITestDrive>('testdrive', testDriveSchema);

export default TestDrive;
