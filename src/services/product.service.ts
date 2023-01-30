import ProductReview, { IProductReview } from './../models/ProductReview';
import { injectable } from 'inversify';
import _ from 'lodash';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import Request from '../types/request';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Product, {
  IImage,
  IProduct,
  IProductImageList
} from './../models/Product';
import Store, { IStore } from '../models/Store';
import { S3Service } from './s3.service';
import { CustomerService } from './customer.service';
import { ICustomer } from '../models/Customer';
import { OverallStoreRatingResponse } from '../interfaces';
import { AdminRole } from '../models/Admin';

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
    newProd.oemUserName = store?.oemUserName || '';

    newProd = await Product.create(newProd);
    Logger.info('<Service>:<ProductService>:<Product created successfully>');
    return newProd;
  }

  async updateProductImages(productId: string, req: Request | any) {
    Logger.info('<Service>:<ProductService>:<Product image uploading>');
    const product: IProduct = await Product.findOne({
      _id: new Types.ObjectId(productId)
    })?.lean();
    if (_.isEmpty(product)) {
      throw new Error('Product does not exist');
    }
    const files: Array<any> = req.files;

    const productImageList: Partial<IProductImageList> | any =
      product.productImageList || {
        profile: {},
        first: {},
        second: {},
        third: {}
      };
    if (!files) {
      throw new Error('Files not found');
    }
    for (const file of files) {
      const fileName: 'first' | 'second' | 'third' | 'fourth' =
        file.originalname?.split('.')[0] || 'first';
      const { key, url } = await this.s3Client.uploadFile(
        productId,
        fileName,
        file.buffer
      );

      productImageList[fileName] = { key, docURL: url };
    }
    const res = await Product.findOneAndUpdate(
      { _id: productId },
      { $set: { productImageList } },
      { returnDocument: 'after' }
    );
    return res;
  }

  async getAll(userName?: string, role?: string): Promise<IProduct[]> {
    const query: any = {};

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }
    const product: IProduct[] = await Product.find(query).lean();

    return product;
  }

  async getProductByProductId(productId: string): Promise<IProduct> {
    Logger.info(
      '<Service>:<ProductService>: <Product Fetch: Get product by product id>'
    );
    const product: IProduct = await Product.findOne({
      _id: new Types.ObjectId(productId)
    }).lean();
    product.overallRating = await this.getOverallRatings(productId);
    return product;
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
      updatedProd,
      { returnDocument: 'after' }
    );
    Logger.info('<Service>:<ProductService>:<Product created successfully>');
    return updatedProd;
  }

  async addProductReview(
    productReviewPayload: {
      productId: string;
      review: string;
      rating: number;
    },
    custPhoneNumber: string
  ) {
    const customerService = container.get<CustomerService>(
      TYPES.CustomerService
    );
    Logger.info(
      '<Service>:<ProductService>: <Product Review: adding product review>'
    );
    let customer: ICustomer;
    if (custPhoneNumber) {
      customer = await customerService.getByPhoneNumber(custPhoneNumber);
    }
    if (!customer) {
      Logger.error('<Service>:<ProductService>:< Customer not found>');
      throw new Error('Customer not found');
    }
    let newProdReview: IProductReview = {
      review: productReviewPayload.review || '',
      rating: productReviewPayload.rating,
      productId: new Types.ObjectId(productReviewPayload.productId),
      userId: customer._id
    };

    newProdReview = await ProductReview.create(newProdReview);
    Logger.info(
      '<Service>:<ProductService>:<Product Review Created successfully>'
    );
    return newProdReview;
  }

  async getOverallRatings(
    productId: string
  ): Promise<OverallStoreRatingResponse> {
    Logger.info('<Service>:<ProductService>:<Get Overall Ratings initiate>');
    const productReviews = await ProductReview.find({ productId });
    if (productReviews.length === 0) {
      return {
        allRatings: {
          5: 100
        },
        averageRating: 5,
        totalRatings: 1,
        totalReviews: 1
      };
    }
    let ratingsCount = 0;
    let totalRatings = 0;
    let totalReviews = 0;
    const allRatings: { [key: number]: number } = {};

    productReviews.forEach(({ rating, review }) => {
      if (rating) totalRatings++;
      if (review) totalReviews++;
      ratingsCount = ratingsCount + rating;
      if (!allRatings[rating]) {
        allRatings[rating] = 1;
      } else {
        allRatings[rating]++;
      }
    });

    for (const key in allRatings) {
      allRatings[key] = Math.trunc(
        (allRatings[key] * 100) / productReviews.length
      );
    }

    const averageRating = ratingsCount / productReviews.length;
    Logger.info(
      '<Service>:<ProductService>:<Get Overall Ratings performed successfully>'
    );
    return {
      allRatings,
      averageRating,
      totalRatings,
      totalReviews
    };
  }

  async getProductReviews(productId: string, pageNo: number, pageSize: number) {
    Logger.info('<Service>:<ProductService>:<Get Overall Ratings initiate>');

    const productReviews = await ProductReview.aggregate([
      {
        $match: {
          productId: new Types.ObjectId(productId)
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'customers',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $skip: pageNo * pageSize
      },
      {
        $limit: pageSize
      },
      {
        $project: {
          _id: 1,
          productId: 1,
          userId: 1,
          review: 1,
          rating: 1,
          createdAt: 1,
          'user.fullName': 1,
          'user.profileImageUrl': 1
        }
      }
    ]);
    return productReviews;
  }
}
