import { model, Schema } from 'mongoose';

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}
export interface IEmployee {
  _id?: string;
  storeId: string;
  name: string;
  role: string;
  address?: string;
  phoneNumber: string;
  status: string;
  profilePhoto?: string;
  joiningDate?: Date;
  leavingDate?: Date;
  isAadharVerified?: boolean;
  aadharDetails?: object;
  accessList: object;
  createdAt?: Date;
  updatedAt?: Date;
}

const employeeSchema: Schema = new Schema<IEmployee>(
  {
    storeId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true
    },
    address: {
      type: String
    },
    phoneNumber: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: EmployeeStatus,
      default: EmployeeStatus.ACTIVE
    },
    joiningDate: {
      type: Date
    },
    leavingDate: {
      type: Date
    },
    profilePhoto: {
      type: String
    },
    isAadharVerified: {
      type: Boolean,
      default: false
    },
    aadharDetails: {
      type: Object
    },
    accessList: {
      type: Object
    }
  },
  { timestamps: true }
);

export const Employee = model<IEmployee>('employee', employeeSchema);
