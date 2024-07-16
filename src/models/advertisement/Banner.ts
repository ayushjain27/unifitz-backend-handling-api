import { Document, model, Schema } from 'mongoose';
import { ICatalogMap, storeCatalogMapSchema } from '../Store';

export const bannerDocumentSchema: Schema = new Schema<IBannerImage>({
  docURL: {
    type: String
  },
  key: {
    type: String
  }
});

export interface IBanner {
  _id?: string;
  url?: string;
  title?: string;
  description?: string;
  altText?: string;
  slugUrl?: string;
  status?: string;
  userType?: string;
  geoLocation?: {
    type: string;
    coordinates: number[];
  };
  location?: string;
  radius?: number;
  bannerPlace?: string;
  bannerPosition?: string;
  category?: ICatalogMap[];
  subCategory?: ICatalogMap[];
  bannerImage?: IBannerImage;
  startDate?: string;
  endDate?: string;
  externalUrl?: string;
  oemUserName?: string;
}

export interface IBannerImage {
  docURL: string;
  key: string;
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
    oemUserName: {
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
    radius: {
      type: Number
    },
    bannerPlace: {
      type: String
    },
    bannerPosition: {
      type: String
    },
    startDate: {
      type: String
    },
    endDate: {
      type: String
    },
    externalUrl: {
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
    bannerImage: {
      type: bannerDocumentSchema
    }
  },
  { timestamps: true }
);

bannerSchema.index({ geoLocation: '2dsphere' });

const Banner = model<IBanner & Document>('banner', bannerSchema);

export default Banner;
