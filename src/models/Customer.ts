import { Document, model, Schema, Types } from 'mongoose';
import { DocType } from '../enum/docType.enum';
import { emergencyContactDetailsSchema, IEmergencyContactDetails } from './EmergencyContactDetails';

export interface IContactInfo extends Document {
  address: string;
  state: string;
  city: string;
  pincode: string;
}

export interface IVerificationDetails {
  documentType: DocType;
  gstAdhaarNumber?: string;
  verifyObj: unknown;
  verifyName: string;
  verifyAddress: string;
}

export const verificationDetailsSchema: Schema =
  new Schema<IVerificationDetails>(
    {
      gstAdhaarNumber: {
        type: String
      },
      verifyName: {
        type: String
      },
      verifyAddress: {
        type: String
      },
      documentType: {
        type: String
      }
    },

    {
      _id: false
    }
  );

export const customerContactSchema: Schema = new Schema(
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
  geoLocation: {
    // kind: string;
    type: string;
    coordinates: number[];
  };
  isVerified?: boolean;
  verificationDetails?: IVerificationDetails;
  customerId: string;
  emergencyDetails?: IEmergencyContactDetails[];
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
      type: String
    },
    fullName: {
      type: String
    },
    phoneNumber: {
      type: String
    },
    email: {
      type: String
    },
    profileImageUrl: {
      type: String
    },
    dob: {
      type: String
    },
    contactInfo: {
      type: customerContactSchema
    },
    verificationDetails: {
      type: verificationDetailsSchema
    },
    isVerified: {
      type: Boolean
    },
    geoLocation: {
      // kind: String,
      type: { type: String, default: 'Point' },
      coordinates: [{ type: Number }]
    },
    customerId: {
      type: String
    },
    emergencyDetails: {
      type: [emergencyContactDetailsSchema]
    }
  },
  { timestamps: true }
);

customerSchema.index({ 'geoLocation': '2dsphere' }, { sparse: true });

const Customer = model<ICustomer & Document>('customers', customerSchema);

export default Customer;
