import { Document, Model, model, Schema } from 'mongoose';

/**
 * Interface to model the User Schema for TypeScript.
 * @param phoneNumber:string
 * @param role:string
 * @param createdDate:Date
 */
export interface IUser extends Document {
  phoneNumber: string;
  role: string;
  createdDate: Date;
}

const userSchema: Schema = new Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: { unique: true }
  },
  role: {
    type: String,
    required: true,
    enum: ['STORE_OWNER'],
    default: 'STORE_OWNER'
  },
  createdDate: {
    type: Date,
    default: Date.now
  }
});

const User: Model<IUser> = model('users', userSchema);

export default User;
