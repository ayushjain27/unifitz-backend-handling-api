import { Document, Model, model, Schema, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  profilePhoto: string;
}
export interface IStoreReview extends Document {
  userId: Types.ObjectId;
  user: IUser;
  storeId: string;
  review: string;
  rating: number;
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
      required: true,
      unique: true
    },
    user: {
      type: userSchema,
      requried: true
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
    }
  },
  { timestamps: true }
);

const StoreReview: Model<IStoreReview> = model(
  'store-reviews',
  storeReviewSchema
);

export default StoreReview;
