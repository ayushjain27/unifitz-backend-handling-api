import { model, ObjectId, Schema, Types } from 'mongoose';

export interface INavigationItems {
  id?: string;
  label?: string;
  userName?: string;
  role?: string;
}

const navigationItemsSchema: Schema = new Schema<INavigationItems>(
  {
    id: {
      type: String
    },
    label: {
      type: String
    },
    userName: {
      type: String
    },
    role: {
      type: String
    },
  },
  { timestamps: true, strict: false }
);

const NavigationItems = model<INavigationItems>('navigationItems', navigationItemsSchema);

export default NavigationItems;
