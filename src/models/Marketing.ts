import { Document, model, Schema, Types } from 'mongoose';
import { DocType } from '../enum/docType.enum';

export interface IMarketing extends Document {
  storeId: string;
  phoneNumber: string;
  fromDate: Date;
  endDate: Date;
  userType: string;
  state: string;
  city: string;
  fileType: string;
  distance: number;
  image1: { key: string; docURL: string };
  createdAt?: Date;
  updatedAt?: Date;
}

const MarketingSchema: Schema = new Schema(
  {
    storeId: {
      type: Types.ObjectId
    },
    phoneNumber: {
      type: String
    },
    fromDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    userType: {
      type: String
    },
    fileType: {
      type: String
    },
    state: {
      type: String
    },
    city: {
      type: String
    },
    distance: {
      type: Number
    },
    image1: { type: { key: String, docURL: String } }
  },
  { timestamps: true }
);

MarketingSchema.index({ geoLocation: '2dsphere' }, { sparse: true });

const Marketing = model<IMarketing & Document>('marketing', MarketingSchema);

export default Marketing;
