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
    modelName: {
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

export interface IVehiclesInfo extends Document {
  vehicleImage: string;
  vehicleNumber: string;
  category: string;
  brand: string;
  modelName: string;
  fuel: string;
  year: string;
  ownership: string;
}

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
  nameSalutation: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  profileImageUrl: string;
  dob: Date;
  contactInfo: IContactInfo;
  /* eslint-disable */
  vehiclesInfo: [IVehiclesInfo];
  createdAt?: Date;
  updatedAt?: Date;
}

const customerSchema: Schema = new Schema(
  {
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

    vehiclesInfo: {
      type: [customerVehicleInfoSchema]
    }
  },
  { timestamps: true }
);

const Customer: Model<ICustomer> = model('customers', customerSchema);

export default Customer;
