import { Document, model, Schema } from 'mongoose';

export interface IBanner extends Document {
  url: string;
  title: string;
  description: string;
  altText: string;
  slugUrl: string;
  status: string;
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
    }
  },
  { timestamps: true }
);

const Banner = model<IBanner & Document>('banner', bannerSchema);

export default Banner;
