import { model, Schema } from 'mongoose';

export interface IStoreEventCollectionPerDayPerStore {
  _id?: string;
  storeId: string;
  date: Date;
}

const storeEventCollectionPerDayPerStoreSchema: Schema = new Schema<IStoreEventCollectionPerDayPerStore>(
  {
    storeId: {
      type: String,
      required: true
    },
    date: {
        type: Date
    }
  },
  { timestamps: true, strict: false }
);

export const StoreEventCollectionPerDayPerStore = model<IStoreEventCollectionPerDayPerStore>('storeeventcollection', storeEventCollectionPerDayPerStoreSchema);
