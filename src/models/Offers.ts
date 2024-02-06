import { Document, model, Schema } from 'mongoose';
import { ICatalogMap, storeCatalogMapSchema } from './Store';
import { IInterestedEventAndOffer, interestedEventAndOfferSchema } from './InterestedEventsAndOffers';

export const offerDocumentSchema: Schema = new Schema<IOfferImage>({
  docURL: {
    type: String
  },
  key: {
    type: String
  }
});

export enum OfferProfileStatus {
  PARTNER = 'PARTNER',
  CUSTOMER = 'CUSTOMER'
}

export interface IOffer {
  _id?: string;
  businessName?: string;
  offerName: string;
  // url?: string;
  externalUrl?: string;
  // altText?: string;
  // slugUrl?: string;
  status?: string;
  geoLocation?: {
    type: string;
    coordinates: number[];
  };
  category?: ICatalogMap[];
  subCategory?: ICatalogMap[];
  brand?: ICatalogMap[];
  offerImage?: IOfferImage;
  startDate?: string;
  endDate?: string;
  state: string; //<String>
  city: string;
  phoneNumber: string;
  email: string;
  address: string;
  offerType: string;
  interested: IInterestedEventAndOffer[]
}

export interface IOfferImage {
  docURL: string;
  key: string;
}

export enum OfferStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED'
}

const offerSchema: Schema = new Schema(
  {
    businessName: {
      type: String
    },
    offerName: {
      type: String
    },
    status: {
      type: String,
      enum: OfferStatus,
      default: OfferStatus.ACTIVE
    },
    geoLocation: {
      // kind: String,
      type: { type: String, default: 'Point' },
      coordinates: [{ type: Number }]
    },
    startDate: {
      type: String
    },
    endDate: {
      type: String
    },
    category: {
      type: [storeCatalogMapSchema],
      required: true
    },
    subCategory: {
      type: [storeCatalogMapSchema],
      required: false
    },
    brand: {
      type: [storeCatalogMapSchema],
      required: false
    },
    offerImage: {
      type: offerDocumentSchema
    },
    state: {
      type: String
    },
    city: {
      type: String
    },
    phoneNumber: {
      type: String
    },
    email: {
      type: String
    },
    address: {
      type: String
    },
    externalUrl: {
      type: String
    },
    // altText: {
    //   type: String
    // },
    // slugUrl: {
    //   type: String
    // },
    offerType: {
      type: String,
      required: true,
      enum: OfferProfileStatus
    },
    interested:  {
      type: [interestedEventAndOfferSchema]
    }
  },
  { timestamps: true }
);

offerSchema.index({ geoLocation: '2dsphere' });

const OfferModel = model<IOffer & Document>('offer', offerSchema);

export default OfferModel;
