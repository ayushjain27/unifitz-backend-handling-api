import { Document, Model, model, Schema } from 'mongoose';

const customerVehicleInfoSchema: Schema = new Schema(
  {
    vehicleImage: {
      type: String
    },
    vehicleNumber: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    brand: {
      type: String,
      required: true
    },
    model: {
      type: String,
      required: true
    },
    fuel: {
      type: String,
      required: true
    },
    year: {
      type: String,
      required: true
    },
    ownership: {
      type: String,
      required: true
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
  salutationName: string;
  fullName: string;
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
    salutationName: {
      type: String,
      required: true
    },
    fullName: {
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
