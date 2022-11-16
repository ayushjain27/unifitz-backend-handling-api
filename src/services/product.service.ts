import { injectable } from 'inversify';
import _ from 'lodash';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import Request from '../types/request';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Product, { IImage, IProduct } from './../models/Product';
import Store, { IStore } from '../models/Store';
import { S3Service } from './s3.service';
import { fileIndex } from '../utils/constants/common';

@injectable()
export class ProductService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async create(productPayload: IProduct): Promise<IProduct> {
    Logger.info(
      '<Service>:<ProductService>: <Product Creation: creating new product>'
    );

    // check if store id exist
    const { storeId } = productPayload;
    let store: IStore;
    if (storeId) {
      store = await Store.findOne({ storeId });
    }
    if (!store) {
      Logger.error('<Service>:<ProductService>:< store id not found>');
      throw new Error('Store not found');
    }
    let newProd: IProduct = productPayload;

    newProd = await Product.create(newProd);
    Logger.info('<Service>:<ProductService>:<Product created successfully>');
    return newProd;
  }

  async updateProductImages(productId: string, req: Request | any) {
    Logger.info('<Service>:<ProductService>:<Product image uploading>');
    const product = await Product.findOne({ productId });
    if (_.isEmpty(product)) {
      throw new Error('Product does not exist');
    }
    const files: Array<any> = req.files;

    const productImages: Partial<IImage[]> | any = product.productImageList;
    if (!files) {
      throw new Error('Files not found');
    }
    for (const file of files) {
      const fileName: 'first' | 'second' | 'third' | 'fourth' =
        file.originalname?.split('.')[0];
      const { key, url } = await this.s3Client.uploadFile(
        productId,
        fileName,
        file.buffer
      );

      if (_.isEmpty(productImages) || !productImages[fileIndex[fileName] - 1]) {
        productImages.push({ key, docURL: url });
      } else {
        productImages[fileIndex[fileName] - 1] = { key, docURL: url };
      }
    }
    const res = await Product.findOneAndUpdate(
      { _id: productId },
      { $set: { productImages } },
      { returnDocument: 'after' }
    );
    return res;
  }

  async getAllProductsByStoreId(storeId: string): Promise<IProduct[]> {
    Logger.info(
      '<Service>:<ProductService>: <Product Fetch: getting all the products by store id>'
    );

    const products: IProduct[] = await Product.find({ storeId }).lean();
    Logger.info('<Service>:<ProductService>:<Product fetched successfully>');
    return products;
  }

  async deleteProduct(productId: string): Promise<unknown> {
    Logger.info(
      '<Service>:<ProductService>: <Product Delete: deleting product by product id>'
    );
    const res = await Product.deleteMany({
      _id: new Types.ObjectId(productId)
    });
    Logger.info('<Service>:<ProductService>:<Product deleted successfully>');
    return res;
  }

  async update(productPayload: IProduct, productId: string): Promise<IProduct> {
    Logger.info(
      '<Service>:<ProductService>: <Product Update: updating product>'
    );

    // check if store id exist
    const { storeId } = productPayload;
    let store: IStore;
    let product: IProduct;
    if (productId) {
      product = await Product.findOne({
        productId: new Types.ObjectId(productId)
      });
    }
    if (!product) {
      Logger.error(
        '<Service>:<ProductService>:<Product not found with that product Id>'
      );
      throw new Error('Store not found');
    }
    if (storeId) {
      store = await Store.findOne({ storeId });
    }
    if (!store) {
      Logger.error('<Service>:<ProductService>:<Store note found>');
      throw new Error('Store not found');
    }

    let updatedProd: IProduct = productPayload;

    updatedProd = await Product.findOneAndUpdate(
      { _id: new Types.ObjectId(productId) },
      updatedProd
    );
    Logger.info('<Service>:<ProductService>:<Product created successfully>');
    return updatedProd;
  }
}
