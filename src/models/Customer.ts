import { Document, Model, model, Schema } from 'mongoose';

const customerVehicleInfoSchema: Schema = new Schema(
  {
    vehicleImage: {
      type: String
    },
    vehicleNumber: {
      type: String
    },
    category: {
      type: String
    },
    brand: {
      type: String
    },
    model: {
      type: String
    },
    fuel: {
      type: String
    },
    year: {
      type: String
    },
    ownership: {
      type: String
    }
  },
  {
    _id: false
  }
);

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
      type: String,
      required: true
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
  nameSalutation: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  profileImageUrl: string;
  dob: Date;
  contactInfo: IContactInfo;
  /* eslint-disable */
  vehiclesInfo: any;
  createdAt?: Date;
  updatedAt?: Date;
}

const customerSchema: Schema = new Schema(
  {
    nameSalutation: {
      type: String,
      required: true
    },
    fullName: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    email: {
      type: String
    },
    profileImageUrl: {
      type: String
    },
    dob: {
      type: String,
      required: true
    },
    contactInfo: {
      type: customerContactSchema
    },

    vehiclesInfo: {
      type: [customerVehicleInfoSchema]
    }
  },
  { timestamps: true }
);

const Customer: Model<ICustomer> = model('customers', customerSchema);

export default Customer;
