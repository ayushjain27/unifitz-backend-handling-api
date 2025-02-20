import { Document, Model, model, Schema } from 'mongoose';

/**
 * Interface to model the Admin Schema for TypeScript.
 * @param deviceId:string
 * @param fcmToken:string
 * @param createdDate:Date
 */
export interface IFcmToken extends Document {
  phoneNumber: string;
  fcmToken: string;
  role: string;
}

const fcmTokenSchema: Schema = new Schema(
  {
    phoneNumber: {
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

const FcmToken = model<IFcmToken & Document>('fcmToken', fcmTokenSchema);

export default FcmToken;
