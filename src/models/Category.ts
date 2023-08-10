import { model, Schema, Types } from 'mongoose';

export interface ICategory {
  _id?: Types.ObjectId;
  catalogName?: string;
  catalogType?: string;
  tree?: string;
  parent?: string;
  catalogWebIcon?: string;
  catalogIcon?: string;
}

const categorySchema: Schema = new Schema<ICategory>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true
    },
    catalogName: {
      type: String,
      required: true
    },
    catalogType: {
      type: String,
      required: true
    },
    tree: {
      type: String,
      required: true
    },
    parent: {
      type: String,
      required: true
    },
    catalogWebIcon: {
      type: String
    },
    catalogIcon: {
      type: String
    }
  },
  { timestamps: true }
);

categorySchema.index({ 'contactInfo.geoLocation': '2dsphere' });

const Category = model<ICategory>('catalogs', categorySchema);

export default Category;
