import { model, Schema } from 'mongoose';

export interface IRewards {
  title: string;
  description: string;
  quantity?: number;
  quantityLeft?: number;
  totalUsers?: number;
  status?: string;
  userName?: string;
  employeeId?: string;
  selectedAllStore?: boolean;
  rewardsImageUrl?: string;
  totalMonths?: number;
  storeList?: string[]; 
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
    totalUsers: {
      type: Number
    },
    status: {
      type: String,
      default: 'INACTIVE'
    },
    selectedAllStore: {
      type: Boolean,
      default: false
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
    totalMonths: {
      type: Number
    },
    storeList: {
      type: [String], // Fixed array of strings
      default: []
    }
  },
  { timestamps: true }
);

export const Rewards = model<IRewards>(
  'rewards',
  rewardsSchema
);

export default Rewards;