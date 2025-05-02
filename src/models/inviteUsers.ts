import { model, Schema } from 'mongoose';

export interface IInviteUsers {
  phoneNumber: string;
  customerId: string;
  count?: number;
  status?: string;
}

const invitesUserSchema: Schema = new Schema<IInviteUsers>(
  {
    customerId: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    count: {
      type: Number
    },
    status: {
      type: String,
      default: 'INACTIVE'
    }
  },
  { timestamps: true }
);

export const InviteUsers = model<IInviteUsers>(
  'invitesUser',
  invitesUserSchema
);
