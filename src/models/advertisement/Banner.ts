import { Document, model, Schema } from 'mongoose';

export interface IBanner extends Document {
  url: string;
  title: string;
  description: string;
  altText: string;
  slugUrl: string;
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
    }
  },
  { timestamps: true }
);

const Banner = model<IBanner & Document>('banner', bannerSchema);

export default Banner;
