import { model, Schema } from 'mongoose';

export interface ISPEmployee {
  _id?: string;
  nameSalutation: string;
  name: string;
  designation: string;
  employeeId: string;
  email: string;
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
  dateOfBirth: Date;
  userName: string;
  profileImageUrl: string;
  accessList: object;
}

const spEmployeeSchema: Schema = new Schema(
  {
    nameSalutation: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    designation: {
      type: String,
      required: true
    },
    employeeId: {
      type: String,
      required: true
    },
    email: {
      type: String
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
    dateOfBirth: {
      type: Date
    },
    userName: {
      type: String
    },
    profileImageUrl: {
      type: String
    },
    accessList: {
      type: Object
    }
  },
  { timestamps: true }
);

const SPEmployee = model<ISPEmployee>('spEmployee', spEmployeeSchema);

export default SPEmployee;
