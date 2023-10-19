import { model, Schema } from 'mongoose';

export enum Role {
  MECHANIC = 'mechanic'
}

export interface IEmployee {
  _id?: string;
  storeId: string;
  name: string;
  role: Role;
  address?: string;
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
      enum: Role,
      required: true
    },
    address: {
      type: String
    }
  },
  { timestamps: true }
);

export const Employee = model<IEmployee>('employee', employeeSchema);
