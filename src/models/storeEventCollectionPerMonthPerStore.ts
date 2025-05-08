import { model, Schema } from 'mongoose';

export interface IStoreEventCollectionPerMonthPerStore {
  _id?: string;
  storeId: string;
  startDate: Date;
  endDate: Date;
}

const storeEventCollectionPerMonthPerStoreSchema: Schema = new Schema<IStoreEventCollectionPerMonthPerStore>(
  {
    storeId: {
      type: String,
      required: true
    },
    startDate: {
      type: Date
  },
    endDate: {
      type: Date
  },
  },
  { timestamps: true, strict: false }
);

export const StoreEventCollectionPerMonthPerStore = model<IStoreEventCollectionPerMonthPerStore>('eventlogscollection', storeEventCollectionPerMonthPerStoreSchema);
