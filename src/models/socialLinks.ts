import { model, ObjectId, Schema, Types } from 'mongoose';

export interface ISocialLinks {
  platform?: string;
  icon?: string;
  uri?: string;
  userName?: string;
  role?: string;
}

const socialLinksSchema: Schema = new Schema<ISocialLinks>(
  {
    platform: {
      type: String
    },
    icon: {
      type: String
    },
    uri: {
      type: String
    },
    userName: {
      type: String
    },
    role: {
      type: String
    },
  },
  { timestamps: true, strict: false }
);

const SocialLinks = model<ISocialLinks>('socialLinks', socialLinksSchema);

export default SocialLinks;
