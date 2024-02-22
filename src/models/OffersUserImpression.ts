import { Document, model, Schema } from 'mongoose';

export interface IOfferImpression extends Document {
  _id?: string;
  offerId?: string;
  offerName?: string;
  userId: string;
  userName: string;
  email: string;
  phoneNumber: string;
  offerType: string;
}

const offerUserImpressionSchema: Schema = new Schema<IOfferImpression>(
  {
    offerId: {
      type: String
    },
    offerName: {
      type: String
    },
    userId: {
      type: String
    },
    userName: {
      type: String
    },
    email: {
      type: String
    },
    phoneNumber: {
      type: String
    },
    offerType: {
      type: String
    }
  },
  { timestamps: true }
);

// offerUserImpressionSchema.index({ geoLocation: '2dsphere' });

const OfferImpressionModel = model<IOfferImpression & Document>(
  'offerimpressions',
  offerUserImpressionSchema
);

export default OfferImpressionModel;
