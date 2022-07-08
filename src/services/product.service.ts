import { injectable } from 'inversify';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import Request from '../types/request';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Product, { IProduct } from './../models/Product';
import Store, { IStore } from '../models/Store';
import { S3Service } from './s3.service';

@injectable()
export class ProductService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async create(productPayload: IProduct, req: Request): Promise<IProduct> {
    Logger.info(
      '<Service>:<ProductService>: <Product Creation: creating new product>'
    );

    // check if store id exist
    const { storeId } = productPayload;
    const file = req.file;
    let store: IStore;
    if (storeId) {
      store = await Store.findOne({ storeId });
    }
    if (!store) {
      Logger.error(
        '<Service>:<ProductService>:<Upload file - store id not found>'
      );
      throw new Error('Store not found');
    }
    let newProd: IProduct = productPayload;

    if (file) {
      const { key, url } = await this.s3Client.uploadFile(
        storeId,
        file.originalname,
        file.buffer
      );
      newProd.refImage = { key, docURL: url };
    }
    newProd = await Product.create(newProd);
    Logger.info('<Service>:<ProductService>:<Product created successfully>');
    return newProd;
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

  async update(
    productPayload: IProduct,
    productId: string,
    req: Request
  ): Promise<IProduct> {
    Logger.info(
      '<Service>:<ProductService>: <Product Update: updating product>'
    );

    // check if store id exist
    const { storeId } = productPayload;
    const file = req.file;
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

    if (file) {
      const { key, url } = await this.s3Client.uploadFile(
        storeId,
        file.originalname,
        file.buffer
      );
      updatedProd.refImage = { key, docURL: url };
    }
    updatedProd = await Product.findOneAndUpdate(
      { _id: new Types.ObjectId(productId) },
      updatedProd
    );
    Logger.info('<Service>:<ProductService>:<Product created successfully>');
    return updatedProd;
  }
}
