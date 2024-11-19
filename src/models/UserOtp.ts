import { model, Schema, Types } from 'mongoose';

export interface IUserOtp {
  _id?: Types.ObjectId;
  phoneNumber: string;
  role: string;
  count: number;
  lastCountReset: Date;
}

const userOtpSchema: Schema = new Schema(
  {
    phoneNumber: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true
    },
    count: {
      type: Number
    },
    lastCountReset: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const UserOtp = model<IUserOtp>('usersOtp', userOtpSchema);

export default UserOtp;
