import { model, Schema } from 'mongoose';

/**
 * Interface to model the Customer Schema for TypeScript.
 */
export interface IDeleteAccount {
  feedback: string[];
  comments?: string;
  createdAt?: Date;
  updatedAt?: Date;
  userId: string;
  phoneNumber: string;
  app: string;
  storeId?: string;
  customerId?: string;
}

const deleteAccountSchema: Schema = new Schema(
  {
    feedback: {
      type: [String],
      required: true
    },
    comments: {
      type: String,
      required: false
    },
    userId: {
      type: String,
      required: true
    },
    app: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    storeId: {
      type: String,
      required: false
    },
    customerId: {
      type: String,
      required: false
    }
  },
  { timestamps: true, strict: false }
);

const DeleteAccount = model<IDeleteAccount>(
  'deleteAccount',
  deleteAccountSchema
);

export default DeleteAccount;
