import { model, ObjectId, Schema, Types } from 'mongoose';

export interface IBenefits {
  icon?: string;
  title?: string;
  description?: string;
  userName?: string;
  role?: string;
}

const benefitsSchema: Schema = new Schema<IBenefits>(
  {
    icon: {
      type: String
    },
    title: {
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
  },
  { timestamps: true, strict: false }
);

const Benefits = model<IBenefits>('benefits', benefitsSchema);

export default Benefits;
