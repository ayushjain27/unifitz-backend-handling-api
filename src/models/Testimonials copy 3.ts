import { model, ObjectId, Schema, Types } from 'mongoose';

export interface ITestimonials {
  name?: string;
  testimonialRole?: string;
  image?: string;
  text?: string;
  care?: string;
  rating?: string;
  userName?: string;
  role?: string;
}

const testimonialsSchema: Schema = new Schema<ITestimonials>(
  {
    name: {
      type: String
    },
    testimonialRole: {
      type: String
    },
    image: {
      type: String
    },
    text: {
      type: String
    },
    care: {
      type: String
    },
    rating: {
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

const Testimonials = model<ITestimonials>('testimonials', testimonialsSchema);

export default Testimonials;
