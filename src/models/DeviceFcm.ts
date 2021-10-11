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
  role: string;
}

const deviceFmcSchema: Schema = new Schema(
  {
    deviceId: {
      type: String,
      required: true
    },
    fcmToken: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true,
      enum: ['STORE_OWNER', 'USER'],
      default: 'STORE_OWNER'
    }
  },
  { timestamps: true }
);
deviceFmcSchema.index({ deviceId: 1, role: 1 }, { unique: true });

const Admin: Model<IDeviceFcm> = model('device_fcm', deviceFmcSchema);

export default Admin;
