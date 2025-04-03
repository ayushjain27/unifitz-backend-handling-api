import { model, Schema } from 'mongoose';

export interface IParkAssistChatUser {
  date: Date;
  senderId: string;
  receiverId: string;
  vehicleNumber: string;
  platform: string;
}

export const parkAssistChatUserSchema: Schema = new Schema(
  {
    date: {
      type: Date,
    },
    senderId: {
      type: String,
      required: true
    },
    receiverId: {
      type: String,
      required: true
    },
    vehicleNumber: {
      type: String,
      required: true
    },
    platform: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export const ParkAssistChatUser = model<IParkAssistChatUser>(
  'parkAssistChatUser',
  parkAssistChatUserSchema
);

export default ParkAssistChatUser;
