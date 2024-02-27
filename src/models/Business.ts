import { Document, model, Schema } from 'mongoose';
import { ICatalogMap, storeCatalogMapSchema } from './Store';

export const businessDocumentSchema: Schema = new Schema<IBusinessImage>({
  docURL: {
    type: String
  },
  key: {
    type: String
  }
});

export interface IBusiness {
  _id?: string;
  brandName: string;
  organizerName: string;
  // url?: string;
  externalUrl?: string;
  status?: string;
  category?: ICatalogMap[];
  subCategory?: ICatalogMap[];
  businessImage?: IBusinessImage;
  startDate?: Date;
  endDate?: Date;
  state: string; //<String>
  city: string;
  phoneNumber: string;
  email: string;
  address: string;
  businessId: string;
  businessType: string;
}

export interface IBusinessImage {
  docURL: string;
  key: string;
}

export enum BusinessStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED'
}

export enum BusinessProfileStatus {
  PARTNER = 'PARTNER',
  CUSTOMER = 'CUSTOMER'
}

const businessSchema: Schema = new Schema(
  {
    brandName: {
      type: String
    },
    organizerName: {
      type: String
    },
    status: {
      type: String,
      enum: BusinessStatus,
      default: BusinessStatus.ACTIVE
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    category: {
      type: [storeCatalogMapSchema],
      required: true
    },
    subCategory: {
      type: [storeCatalogMapSchema],
      required: false
    },
    businessImage: {
      type: businessDocumentSchema
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
    businessId: {
      type: String
    },
    businessType: {
      type: String,
      required: true,
      enum: BusinessProfileStatus
    }
  },
  { timestamps: true }
);

// businessSchema.index({ geoLocation: '2dsphere' });

const BusinessModel = model<IBusiness & Document>('business', businessSchema);

export default BusinessModel;
