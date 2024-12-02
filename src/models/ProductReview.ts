import { Document, model, Schema, Types } from 'mongoose';

export interface IProductReview {
  userId?: Types.ObjectId;
  productId: Types.ObjectId;
  review: string;
  rating: number;
  storeId?: string;
  name?: string;
  userName?: string;
}

const productReviewSchema: Schema = new Schema<IProductReview>(
  {
    userId: {
      type: Schema.Types.ObjectId
      // required: true
    },
    productId: {
      type: Schema.Types.ObjectId,
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
    storeId: {
      type: String
    },
    name: {
      type: String
    },
    userName: {
      type: String
    }
  },
  { timestamps: true }
);

const ProductReview = model<IProductReview & Document>(
  'product-reviews',
  productReviewSchema
);

export default ProductReview;
