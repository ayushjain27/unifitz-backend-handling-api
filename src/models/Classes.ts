import { model, ObjectId, Schema, Types } from 'mongoose';

export interface IClasses {
  name?: string;
  level?: string;
  duration?: string;
  capacity?: string;
  description?: string;
  image?: string;
  userName?: string;
  role?: string;
}

const classesSchema: Schema = new Schema<IClasses>(
  {
    name: {
      type: String
    },
    level: {
      type: String
    },
    duration: {
      type: String
    },
    capacity: {
      type: String
    },
    description: {
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

const Classes = model<IClasses>('classes', classesSchema);

export default Classes;
