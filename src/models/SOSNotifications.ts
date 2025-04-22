import { model, Schema } from 'mongoose';

export interface ISOSNotifications {
  vehicleNumber: string;
  senderId: string;
  receiverId?: string;
  phoneNumber?: string;
  status: string;
  address:  string;
  geoLocation: {
    type: string;
    coordinates: number[];
  };
}

export const sosNotificationsSchema: Schema = new Schema(
  {
    vehicleNumber: {
      type: String
    },
    senderId: {
      type: String,
      ref: 'customers'
    },
    receiverId: {
      type: String,
      ref: 'customers'
    },
    phoneNumber: {
      type: String
    },
    address: {
        type: String
    },
    geoLocation: {
      // kind: String,
      type: { type: String, default: 'Point' },
      coordinates: [{ type: Number }]
    }
  },
  {
    timestamps: true,
    strict: false
  }
);

const SOSNotifications = model<ISOSNotifications>(
  'sosNotifications',
  sosNotificationsSchema
);

export default SOSNotifications;
