import { Document, model, Schema, Types } from 'mongoose';

export interface IFavouriteStore extends Document {
  storeId: string;
  customerId: string;
  isFavourite: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const favouriteStoreSchema: Schema = new Schema(
  {
    storeId: {
      type: String,
      required: true
    },
    customerId: {
      type: String,
      required: true
    },
    isFavourite: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const FavouriteStore = model<IFavouriteStore & Document>(
  'favouriteStore',
  favouriteStoreSchema
);

export default FavouriteStore;
