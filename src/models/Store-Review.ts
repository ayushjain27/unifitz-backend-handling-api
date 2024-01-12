import { Document, Model, model, Schema, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  profilePhoto: string;
}
export interface IStoreReview extends Document {
  userId: Types.ObjectId;
  user: IUser;
  userPhoneNumber: string;
  storeId: string;
  review: string;
  rating: number;
  isHide?: boolean;
}

const userSchema: Schema = new Schema(
  {
    name: {
      type: String
    },
    profilePhoto: {
      type: String
    }
  },
  {
    _id: false
  }
);

const storeReviewSchema: Schema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      required: true
    },
    user: {
      type: userSchema,
      requried: true
    },
    userPhoneNumber: {
      type: String
    },
    storeId: {
      type: String,
      required: true
    },
    review: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true
    },
    isHide: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const StoreReview = model<IStoreReview & Document>(
  'store-reviews',
  storeReviewSchema
);

export default StoreReview;
