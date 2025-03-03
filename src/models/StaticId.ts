import { model, Schema } from 'mongoose';

export interface IStaticIds {
  _id?: string;
  storeId: string;
  productId: string;
  userId: string;
  employeeId: string;
  customerId: string;
  customerOrderId: string;
  productOrderId: string;
  distributorOrderId: string;
  newVehicleOrderNo: number;
}

const staticIdsSchema: Schema = new Schema<IStaticIds>(
  {
    storeId: {
      type: String,
      required: true,
      unique: true
    },
    userId: {
      type: String,
      required: true,
      unique: true
    },
    employeeId: {
      type: String,
      required: true,
      unique: true
    },
    customerId: {
      type: String,
      required: true,
      unique: true
    },
    customerOrderId: {
      type: String,
      required: true,
      unique: true
    },
    productOrderId: {
      type: String,
      required: true,
      unique: true
    },
    distributorOrderId: {
      type: String,
      required: true,
      unique: true
    },
    newVehicleOrderNo: {
      type: Number,
      required: true,
      unique: true
    }
  },
  { timestamps: true }
);

export const StaticIds = model<IStaticIds>('staticId', staticIdsSchema);
