import { model, ObjectId, Schema, Types } from 'mongoose';

export interface IInstructors {
  name?: string;
  specialty?: string;
  experience?: string;
  certification?: string;
  description?: string;
  bio?: string;
  rating?: string;
  image?: string;
  userName?: string;
  role?: string;
}

const instructorsSchema: Schema = new Schema<IInstructors>(
  {
    name: {
      type: String
    },
    specialty: {
      type: String
    },
    experience: {
      type: String
    },
    certification: {
      type: String
    },
    description: {
      type: String
    },
    bio: {
      type: String
    },
    rating: {
      type: String
    },
    image: {
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

const Instructors = model<IInstructors>('instructors', instructorsSchema);

export default Instructors;
