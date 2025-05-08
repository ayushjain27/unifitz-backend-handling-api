import { model, Schema } from 'mongoose';

export interface IStoreOverallEventCollectionPerDayPerStore {
  _id?: string;
  date: Date;
}

const storeOverallEventCollectionPerDayPerStoreSchema: Schema =
  new Schema<IStoreOverallEventCollectionPerDayPerStore>(
    {
      date: {
        type: Date
      }
    },
    { timestamps: true, strict: false }
  );

export const StoreOverallEventCollectionPerDayPerStore =
  model<IStoreOverallEventCollectionPerDayPerStore>(
    'overalleventcollection',
    storeOverallEventCollectionPerDayPerStoreSchema
  );
