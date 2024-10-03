import { model, Schema } from 'mongoose';

/**
 * Interface to model the Customer Schema for TypeScript.
 */
export interface IDeleteAccount {
  createdAt?: Date;
  updatedAt?: Date;
}

const deleteAccountSchema: Schema = new Schema(
  {
    
  },
  { timestamps: true }
);


const DeleteAccount = model<IDeleteAccount>('deleteAccount', deleteAccountSchema);

export default DeleteAccount;
