import { Document, Model, model, Schema, Types } from 'mongoose';

export interface IStoreReview extends Document {
  userId: Types.ObjectId;
  storeId: string;
  review: string;
  rating: number;
}

const storeReviewSchema: Schema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      required: true,
      unique: true
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
