import { model, Schema } from 'mongoose';

export interface IState {
  name: string;
}

export const stateSchema: Schema = new Schema({
  name: {
    type: String
  }
});

export interface ICity {
  name: string;
}

export const citySchema: Schema = new Schema({
  name: {
    type: String
  }
});
export interface IDeliveryPartners {
  _id?: string;
  nameSalutation: string;
  firstName: string;
  lastName: string;
  partnerId: string;
  phoneNumber: { primary: string; secondary: string };
  emergencyDetails: {
    primary: {
      name: string;
      phoneNumber: string;
    };
    secondary: {
      name: string;
      phoneNumber: string;
    };
  };
  address: string;
  employeeId: string;
  userName: string;
  password: string;
  security: string;
  profileImageUrl: string;
  vehicleType: string;
  wareHouseInfo: string;
  role: string;
  state?: IState[];
  city?: ICity[];
}

const deliveryPartnersSchema: Schema = new Schema(
  {
    nameSalutation: {
      type: String,
      required: true
    },
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    partnerId: {
      type: String,
      required: true
    },
    password: {
      type: String
    },
    security: {
      type: String
    },
    vehicleType: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: { primary: String, secondary: String }
    },
    emergencyDetails: {
      primary: {
        type: { name: String, phoneNumber: String }
      },
      secondary: {
        type: { name: String, phoneNumber: String }
      }
    },
    address: {
      type: String
    },
    userName: {
      type: String
    },
    employeeId: {
      type: String
    },
    profileImageUrl: {
      type: String
    },
    state: {
      type: [stateSchema]
    },
    city: {
      type: [citySchema]
    },
    wareHouseInfo: {
      type: String
    },
    role: {
      type: String,
      default: "DELIVERY_PARTNER"
    }
  },
  { timestamps: true }
);

const DeliveryPartners = model<IDeliveryPartners>('deliveryPartners', deliveryPartnersSchema);

export default DeliveryPartners;
