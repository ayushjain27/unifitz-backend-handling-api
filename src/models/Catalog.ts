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
  catalogIcon?: string;
  status?: string;
  displayOrder: number;
  catalogWebIcon?: string;
  documents: IDocuments;
}

export interface IDocuments {
  profile: { key: string; docURL: string };
  catalogIcon: { key: string; docURL: string };
  catalogWebIcon: { key: string; docURL: string };
  categoryImageList: {
    first: { key: string; docURL: string };
    second: { key: string; docURL: string };
    third: { key: string; docURL: string };
  };

  // storeDocuments: {
  //   primary: { key: string; docURL: string };
  //   secondary: { key: string; docURL: string };
  // };
  // storeImages: {
  //   primary: { key: string; docURL: string };
  //   secondary: { key: string; docURL: string };
  // };
}

// const categoryDocumentsSchema: Schema = new Schema<IDocuments>(
//   {
//     profile: {
//       key: String,
//       docURL: String
//     },
//     categoryImageList: {
//       type: {
//         first: { key: String, docURL: String },
//         second: { key: String, docURL: String },
//         third: { key: String, docURL: String }
//       }
//     }
//   },
//   {
//     _id: false,
//     strict: false
//   }
// );

export const catalogSchema: Schema = new Schema(
  {
    catalogName: {
      type: String,
      required: true
    },
    displayOrder: {
      type: Number
    },
    tree: {
      type: String,
      required: true
    },
    status: {
      type: String,
      default: 'ACTIVE'
    },
    parent: {
      type: String,
      required: true
    },
    catalogType: {
      type: String,
      required: true
    },
    catalogIcon: {
      type: String,
      required: false
    },
    catalogWebIcon: {
      type: String,
      required: false
    }
  },
  { timestamps: true }
);

const Catalog = model<ICatalog & Document>('catalog', catalogSchema);

export const ProductCatalog = model<ICatalog & Document>(
  'productCatalog',
  catalogSchema
);

export default Catalog;
