import { model, Schema } from 'mongoose';

export interface IInviteRetailer {
  contactName: string;
  shopName: string;
  phoneNumber: string;
  email: string;
  oemUserName?: string;
}

const inviteRetailer: Schema = new Schema<IInviteRetailer>(
  {
    contactName: {
      type: String
    },
    shopName: {
      type: String
    },
    oemUserName: {
      type: String
    },
    phoneNumber: {
      type: String
    },
    email: {
      type: String
    }
  },
  { timestamps: true }
);

export const InviteRetailerModel = model<IInviteRetailer>(
  'invites',
  inviteRetailer
);
