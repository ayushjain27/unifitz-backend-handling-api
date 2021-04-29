import { Document, Model, model, ObjectId, Schema } from 'mongoose';

/**
 * Interface to model the Admin Schema for TypeScript.
 * @param catalogName:string
 * @param tree:string
 * @param parent:string
 */
export interface ICatalog extends Document {
  _id: ObjectId;
  catalogName: string;
  tree: string;
  parent: string;
  catalogType: string;
}

const catalogSchema: Schema = new Schema(
  {
    catalogName: {
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
    catalogType: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const Catalog: Model<ICatalog> = model('catalog', catalogSchema);

export default Catalog;
