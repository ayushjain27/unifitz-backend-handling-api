import { model, Schema } from 'mongoose';

export interface IParkAssistChatMessage {
  message: string;
  vehicleNumber: string;
  senderId: string;
  receiverId: string;
  platform: string;
}

export const parkAssistChatMessageSchema: Schema = new Schema(
  {
    message: {
      type: String,
      required: true
    },
    vehicleNumber: {
      type: String,
      required: true
    },
    senderId: {
      type: String,
      required: true
    },
    receiverId: {
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

export const PakAssistChatMessage = model<IParkAssistChatMessage>(
  'parkAssistChatMessage',
  parkAssistChatMessageSchema
);

export default PakAssistChatMessage;
