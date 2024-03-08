import { Document, model, Schema } from 'mongoose';
import { ICatalogMap, storeCatalogMapSchema } from './Store';

export interface ISchoolOfAuto {
  _id?: string;
  status?: string;
  schoolOfAutoType: string;
  videoName: string;
  language: string;
  description: string;
  category?: ICatalogMap[];
  subCategory?: ICatalogMap[];
  brand?: ICatalogMap[];
  videoUrl: string;
}

export enum schoolOfAutoStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED'
}

export enum profileStatus {
  PARTNER = 'PARTNER',
  CUSTOMER = 'CUSTOMER'
}

const schoolOfAutoSchema: Schema = new Schema(
  {
    videoName: {
      type: String
    },
    description: {
      type: String
    },
    status: {
      type: String,
      enum: schoolOfAutoStatus,
      default: schoolOfAutoStatus.ACTIVE
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
    videoUrl: {
      type: String
    },
    language: {
      type: String
    },
    schoolOfAutoType: {
      type: String,
      required: true,
      enum: profileStatus
    }
  },
  { timestamps: true }
);

// schoolOfAutoSchema.index({ geoLocation: '2dsphere' });

const SchoolOfAutoModel = model<ISchoolOfAuto & Document>(
  'schoolofauto',
  schoolOfAutoSchema
);

export default SchoolOfAutoModel;
