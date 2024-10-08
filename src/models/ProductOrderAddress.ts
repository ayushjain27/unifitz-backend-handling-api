import { model, Schema, ObjectId, Types } from 'mongoose';

/**
 * Interface to model the Customer Schema for TypeScript.
 */
export interface IProductOrderAddress {
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
  userId: Types.ObjectId;
  phoneNumber: string;
  app: string;
  storeId?: string;
  customerId?: string;
}

const productOrderAddressSchema: Schema = new Schema(
  {
    address: {
        type: String,
        required: true
    },
    userId: {
      type: Types.ObjectId,
      required: true
    },
    app: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    storeId: {
      type: String,
      required: false
    },
    customerId: {
      type: String,
      required: false
    }
  },
  { timestamps: true, strict: false }
);

const ProductOrderAddress = model<IProductOrderAddress>(
  'product-Order-Address',
  productOrderAddressSchema
);

export default ProductOrderAddress;
