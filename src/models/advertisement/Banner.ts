import { Document, model, Schema } from 'mongoose';
import { ICatalogMap, storeCatalogMapSchema } from '../Store';

export interface IBanner extends Document {
  url: string;
  title: string;
  description: string;
  altText: string;
  slugUrl: string;
  status: string;
  userType: string;
  geoLocation: {
    type: string;
    coordinates: number[];
  };
  location: string;
  distance: string;
  bannerPlace: string;
  bannerPosition: string;
  category: ICatalogMap[];
  subCategory: ICatalogMap[];
}

export enum UserType {
  PARTNER_APP = 'PARTNER_APP',
  CUSTOMER_APP = 'CUSTOMER_APP',
  CUSTOMER_WEB = 'CUSTOMER_WEB'
}

export enum BannerStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED'
}

const bannerSchema: Schema = new Schema(
  {
    url: {
      type: String
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    altText: {
      type: String
    },
    slugUrl: {
      type: String
    },
    status: {
      type: String,
      enum: BannerStatus,
      default: BannerStatus.ACTIVE
    },
    userType: { type: String, enum: UserType },
    geoLocation: {
      // kind: String,
      type: { type: String, default: 'Point' },
      coordinates: [{ type: Number }]
    },
    location: {
      type: String
    },
    distance: {
      type: String
    },
    bannerPlace: {
      type: String
    },
    bannerPosition: {
      type: String
    },
    category: {
      type: [storeCatalogMapSchema],
      required: true
    },
    subCategory: {
      type: [storeCatalogMapSchema],
      required: false
    }
  },
  { timestamps: true }
);

bannerSchema.index({ geoLocation: '2dsphere' });

const Banner = model<IBanner & Document>('banner', bannerSchema);

export default Banner;
