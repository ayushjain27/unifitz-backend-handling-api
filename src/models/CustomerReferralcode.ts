import { Document, model, Schema, Types } from 'mongoose';
import { DocType } from '../enum/docType.enum';
/**
 * Interface to model the Customer Schema for TypeScript.
 */
export interface ICustomerReferralCode extends Document {
  customerId: string;
  referralCode: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const customerReferralCodeSchema: Schema = new Schema(
  {
    customerId: {
      type: String
    },
    referralCode: {
      type: String
    },
    status: {
        type: String,
        default: 'PENDING'
    }
  },
  { timestamps: true }
);

const CustomerReferralCode = model<ICustomerReferralCode>('customemerReferralCode', customerReferralCodeSchema);

export default CustomerReferralCode;
