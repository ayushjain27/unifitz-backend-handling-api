import { model, ObjectId, Schema, Types } from 'mongoose';
import { DocType } from '../enum/docType.enum';
import { emergencyContactDetailsSchema, IEmergencyContactDetails } from './EmergencyContactDetails';

export interface IPhilosophy {
  title: string;
  paragraphs: string;
}

export const philosophySchema: Schema = new Schema(
  {
    title: {
      type: String,
    },
    paragraphs: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export interface IAboutContent {
  title?: string;
  description?: string;
  quote?: string;
  author?: string;
  userName?: string;
  role?: string;
  philosophy?: IPhilosophy;
}

const aboutContentSchema: Schema = new Schema<IAboutContent>(
  {
    title: {
      type: String
    },
    description: {
      type: String
    },
    quote: {
      type: String
    },
    author: {
      type: String
    },
    userName: {
      type: String
    },
    role: {
      type: String
    },
    philosophy: { type: philosophySchema }
  },
  { timestamps: true, strict: false }
);

const AboutContent = model<IAboutContent>('aboutContent', aboutContentSchema);

export default AboutContent;
