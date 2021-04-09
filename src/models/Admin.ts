import { Document, Model, model, Schema } from 'mongoose';

/**
 * Interface to model the User Schema for TypeScript.
 * @param email:string
 * @param password:string
 * @param avatar:string
 */
export interface IAdmin extends Document {
  email: string;
  password: string;
  avatar: string;
}

const userSchema: Schema = new Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
    index: { unique: true }
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'admin'],
    default: 'admin'
  },
  createdDate: {
    type: Date,
    default: Date.now
  }
});

const Admin: Model<IAdmin> = model('Admin', userSchema);

export default Admin;
