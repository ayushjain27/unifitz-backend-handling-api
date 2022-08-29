import { Document, model, Schema, Types } from 'mongoose';

export interface IContactInfo extends Document {
  address: string;
  state: string;
  city: string;
  pincode: string;
}

const customerContactSchema: Schema = new Schema(
  {
    address: {
      type: String
    },
    state: {
      type: String,
      required: true
    },
    city: {
      type: String
    },
    pincode: {
      type: String
    }
  },
  {
    _id: false
  }
);

/**
 * Interface to model the Customer Schema for TypeScript.
 */
export interface ICustomer extends Document {
  userId: string;
  nameSalutation: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  profileImageUrl: string;
  dob: Date;
  contactInfo: IContactInfo;
  /* eslint-disable */
  createdAt?: Date;
  updatedAt?: Date;
}

const customerSchema: Schema = new Schema(
  {
    userId: {
      type: Types.ObjectId
    },
    nameSalutation: {
      type: String,
    },
    fullName: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
    },
    email: {
      type: String
    },
    profileImageUrl: {
      type: String
    },
    dob: {
      type: String,
    },
    contactInfo: {
      type: customerContactSchema
    },
  },
  { timestamps: true }
);

const Customer = model<ICustomer & Document>('customers', customerSchema);

export default Customer;
