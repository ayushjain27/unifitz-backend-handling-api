import { Document, Model, model, Schema, Types } from 'mongoose';

export interface IDistributorPartnersReview {
  _id?: string;
  userName: string;
  ownerName: string;
  ownerPhoneNumber: string;
  review: string;
  rating: number;
  storeId: string;
  // isHide?: boolean;
}

const distributorPartnersReviewSchema: Schema = new Schema(
  {
    userName: {
      type: String
    },
    ownerName: {
      type: String
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
    }
    // isHide: {
    //   type: Boolean,
    //   default: false
    // }
  },
  { timestamps: true }
);

const DistributorPartnersReview = model<IDistributorPartnersReview>(
  'distributor-partners-reviews',
  distributorPartnersReviewSchema
);

export default DistributorPartnersReview;
