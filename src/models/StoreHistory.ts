import { model, ObjectId, Schema, Types } from 'mongoose';

export interface IStoreHistory {
  fieldName?: string;
  previousValue?: string;
  currentValue?: string;
}

export const storeHistorySchema: Schema = new Schema(
  {
    fieldName: {
      type: String
    },
    previousValue: {
      type: String
    },
    currentValue: {
      type: String
    }
  },
  {
    _id: false,
    strict: false
  }
);

export interface IStoreUpdateHistory {
  _id?: Types.ObjectId;
  storeId?: string;
  storeHistory: IStoreHistory[];
}

const storeUpdateSchema: Schema = new Schema<IStoreUpdateHistory>(
  {
    storeId: {
      type: String
    },
    storeHistory: {
      type: [storeHistorySchema]
    }
  },
  { timestamps: true, strict: false }
);

const StoreHistory = model<IStoreUpdateHistory>(
  'storeupdates',
  storeUpdateSchema
);

export default StoreHistory;
