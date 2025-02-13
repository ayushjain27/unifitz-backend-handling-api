import { model, Schema, Types } from 'mongoose';

export interface INotification {
  _id?: Types.ObjectId;
  title: string;
  body: string;
  phoneNumber: string;
  type: string;
  role: string;
  storeId: string;
  customerId: string;
  status: string;
  dataId: string;
}

const notificationSchema: Schema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    type: {
        type: String
    },
    role: {
        type: String
    },
    storeId: {
        type: String
    },
    customerId: {
        type: String
    },
    status: {
      type: String,
      default: 'ACTIVE'
    },
    dataId: {
      type: String
    }
  },
  { timestamps: true, strict: false }
);

// storeSchema.index({ 'contactInfo.geoLocation': '2dsphere' }, { sparse: true });

const Notification = model<INotification>('notification', notificationSchema);

export default Notification;
