import { model, ObjectId, Schema, Types } from 'mongoose';

export interface IHeroContent {
  title?: string;
  subtitle?: string;
  description?: string;
  userName?: string;
  role?: string;
  primaryButton?: string;
  secondaryButton?: string;
}

const heroContentSchema: Schema = new Schema<IHeroContent>(
  {
    title: {
      type: String
    },
    subtitle: {
      type: String
    },
    description: {
      type: String
    },
    userName: {
      type: String
    },
    role: {
      type: String
    },
    primaryButton: {
      type: String
    },
    secondaryButton: {
      type: String
    },
  },
  { timestamps: true, strict: false }
);

const HeroContent = model<IHeroContent>('heroContent', heroContentSchema);

export default HeroContent;
