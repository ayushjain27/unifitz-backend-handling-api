import { model, Schema } from 'mongoose';

export interface IRewards {
  title: string;
  description: string;
  quantity?: number;
  quantityLeft?: number;
  eligibleUsers?: number;
  status?: string;
  userName?: string;
  employeeId?: string;
  selectedUserName?: string;
  rewardsImageUrl?: string;
  eligibleMonths?: number;
}

const rewardsSchema: Schema = new Schema<IRewards>(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    quantityLeft: {
      type: Number
    },
    eligibleUsers: {
      type: Number
    },
    status: {
      type: String,
      default: 'INACTIVE'
    },
    selectedUserName: {
      type: String,
    },
    userName: {
    type: String
    },
    employeeId: {
      type: String
    },
    rewardsImageUrl: {
      type: String
    },
    eligibleMonths: {
      type: Number
    }
  },
  { timestamps: true }
);

export const Rewards = model<IRewards>(
  'rewards',
  rewardsSchema
);

export default Rewards;