import { model, Schema } from 'mongoose';

export interface IParkAssistChatMessage {
  message: string;
  vehicleNumber: string;
  senderId: string;
  receiverId: string;
  platform: string;
  geoLocation: {
    // kind: string;
    type: string;
    coordinates: number[];
  };
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
    },
    geoLocation: {
      // kind: String,
      type: { type: String, default: 'Point' },
      coordinates: [{ type: Number }]
    },
  },
  { timestamps: true }
);

export const ParkAssistChatMessage = model<IParkAssistChatMessage>(
  'parkAssistChatMessage',
  parkAssistChatMessageSchema
);

export default ParkAssistChatMessage;
