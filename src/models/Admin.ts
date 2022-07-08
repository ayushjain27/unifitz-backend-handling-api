import { Document, Model, model, Schema } from 'mongoose';

/**
 * Interface to model the Admin Schema for TypeScript.
 * @param userName:string
 * @param password:string
 * @param role:string
 * @param createdDate:Date
 */
export interface IAdmin extends Document {
  userName: string;
  password: string;
  role: string;
}

const adminSchema: Schema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      index: { unique: true }
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true,
      enum: ['ADMIN'],
      default: 'ADMIN'
    }
  },
  { timestamps: true }
);

const Admin = model<IAdmin & Document>('admin_user', adminSchema);

export default Admin;
