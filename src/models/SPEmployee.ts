import { model, Schema } from 'mongoose';

export interface ISPEmployee {
  _id?: string;
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
  photo: string;
}

const spEmployeeSchema: Schema = new Schema(
  {
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
    dateOfBirth: {
      type: Date
    },
    photo: {
      type: String
    }
  },
  { timestamps: true }
);

spEmployeeSchema.index({ geoLocation: '2dsphere' });

const SPEmployeeModel = model<ISPEmployee>('spEmployee', spEmployeeSchema);

export default SPEmployeeModel;
