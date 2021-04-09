import { Document, Model, model, Schema } from 'mongoose';

/**
 * Interface to model the User Schema for TypeScript.
 * @param email:string
 * @param password:string
 * @param avatar:string
 */
export interface IUser extends Document {
  email: string;
  password: string;
  avatar: string;
}

const userSchema: Schema = new Schema({
  mobileNumber: {
    type: String,
    required: true,
    unique: true,
    index: { unique: true }
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdDate: {
    type: Date,
    default: Date.now
  }
});

const User: Model<IUser> = model('User', userSchema);

export default User;
