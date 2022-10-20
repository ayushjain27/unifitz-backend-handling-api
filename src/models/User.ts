import { Document, Model, model, Schema, Types } from 'mongoose';

/**
 * Interface to model the User Schema for TypeScript.
 * @param phoneNumber:string
 * @param role:string
 * @param deviceId: string
 * @param createdDate:Date
 */
export interface IUser extends Document {
  _id?: Types.ObjectId;
  phoneNumber: string;
  role: string;
  deviceId: string;
}

const userSchema: Schema = new Schema(
  {
    phoneNumber: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true,
      enum: ['STORE_OWNER', 'USER'],
      default: 'STORE_OWNER'
    },
    deviceId: {
      type: String
    }
  },
  { timestamps: true }
);
userSchema.index({ phoneNumber: 1, role: 1 }, { unique: true });

const User = model<IUser & Document>('users', userSchema);

export default User;
