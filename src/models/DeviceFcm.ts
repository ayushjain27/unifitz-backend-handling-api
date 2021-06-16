import { Document, Model, model, Schema } from 'mongoose';

/**
 * Interface to model the Admin Schema for TypeScript.
 * @param deviceId:string
 * @param fcmToken:string
 * @param createdDate:Date
 */
export interface IDeviceFcm extends Document {
  deviceId: string;
  fcmToken: string;
}

const deviceFmcSchema: Schema = new Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      index: { unique: true }
    },
    fcmToken: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const Admin: Model<IDeviceFcm> = model('device_fcm', deviceFmcSchema);

export default Admin;
