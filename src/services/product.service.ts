/* eslint-disable no-console */
import ProductReview, { IProductReview } from './../models/ProductReview';
import { injectable } from 'inversify';
import _ from 'lodash';
import container from '../config/inversify.container';
import mongoose, { Types } from 'mongoose';
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
import { IPrelistProduct } from '../models/PrelistProduct';
import { PrelistPoduct } from '../models/PrelistProduct';

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
      store = await Store.findOne({ storeId }, { verificationDetails: 0 });
    }
    if (!store) {
      Logger.error('<Service>:<ProductService>:< store id not found>');
      throw new Error('Store not found');
    }
    let newProd: IProduct = productPayload;
    newProd.oemUserName = store?.oemUserName || '';

    newProd.allowMarketPlaceHosting = !_.isEmpty(newProd.oemUserName);

    newProd.isActive = true;
    newProd = await Product.create(newProd);
    Logger.info('<Service>:<ProductService>:<Product created successfully>');
    return newProd;
  }

  async createPreListProduct(
    productPayload: IPrelistProduct
  ): Promise<IPrelistProduct> {
    Logger.info(
      '<Service>:<PrelistProductService>: <Prelist Product Creation: creating new prelist product>'
    );
    let newProd: IPrelistProduct = productPayload;
    newProd = await PrelistPoduct.create(newProd);
    Logger.info(
      '<Service>:<PrelistProductService>:<Prelist Product created successfully>'
    );
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
      const fileName: 'first' | 'second' | 'third' | 'profile' =
        file.originalname?.split('.')[0] || 'profie';
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

  async searchAndFilterPrelistProductPaginated(searchReqBody: {
    productCategory: string;
    productSubCategory: string;
    itemName: string;
    pageNo: number;
    pageSize: number;
    offerType: string;
  }): Promise<IPrelistProduct[]> {
    Logger.info(
      '<Service>:<ProductService>:<Search and Filter prelist product service initiated>'
    );
    const query = {
      // 'basicInfo.businessName': new RegExp(searchReqBody.storeName, 'i'),
      itemName: new RegExp(searchReqBody.itemName, 'i'),
      offerType: searchReqBody.offerType,
      'productCategory.catalogName': searchReqBody.productCategory,
      'productSubCategory.catalogName': searchReqBody.productSubCategory
      // profileStatus: 'ONBOARDED'
    };
    if (!searchReqBody.itemName) {
      delete query['itemName'];
    }
    if (!searchReqBody.offerType) {
      delete query['offerType'];
    }
    if (!searchReqBody.productCategory) {
      delete query['productCategory.catalogName'];
    }
    if (!searchReqBody.productSubCategory) {
      delete query['productSubCategory.catalogName'];
    }
    Logger.debug(query);

    const prelistProduct: any = await PrelistPoduct.aggregate([
      {
        $match: query
      },
      {
        $skip: searchReqBody.pageNo * searchReqBody.pageSize
      },
      {
        $limit: searchReqBody.pageSize
      }
    ]);

    return prelistProduct;
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

  async getPrelistProductByProductId(
    productId: string
  ): Promise<IPrelistProduct> {
    Logger.info(
      '<Service>:<ProductService>: <Product Fetch: Get prelist product by product id>'
    );
    const product: IPrelistProduct = await PrelistPoduct.findOne({
      _id: new Types.ObjectId(productId)
    }).lean();
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

  async deletePrelistProduct(productId: string): Promise<unknown> {
    Logger.info(
      '<Service>:<ProductService>: <Product Delete: deleting prelist product by product id>'
    );
    const res = await PrelistPoduct.deleteMany({
      _id: new Types.ObjectId(productId)
    });
    Logger.info(
      '<Service>:<ProductService>:<Prelist Product deleted successfully>'
    );
    return res;
  }

  async deleteMultiProduct(productIdList: string[]): Promise<unknown> {
    Logger.info(
      '<Service>:<ProductService>: <Product Delete: deleting product by product id>'
    );
    const res = await Product.deleteMany({
      _id: { $in: productIdList }
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
      store = await Store.findOne({ storeId }, { verificationDetails: 0 });
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

  async duplicateProductToStores(productId: string, storeIdList: string[]) {
    Logger.info(
      '<Service>:<ProductService>:<Duplicate Product To multiple stores>'
    );

    const product: IProduct = await Product.findOne({
      _id: new Types.ObjectId(productId)
    })?.lean();
    if (_.isEmpty(product)) {
      throw new Error('Product does not exist');
    }
    const db = mongoose.connection.db;
    const bulkOps: any = [];
    delete product?._id;
    const newProdList: IProduct[] = [];
    _.forEach(storeIdList, (storeId) => {
      // const insertDoc = {
      //   insertOne: {
      //     document: { ...product, storeId }
      //   }
      // };
      newProdList.push({ ...product, storeId });
      // bulkOps.push(insertDoc);
    });
    // const result = await db.collection('product').bulkWrite(bulkOps);
    const result = await Product.insertMany(newProdList);
    return {
      message: 'Product duplicated successfully',
      success: true,
      result
    };
  }

  async createProductFromPrelist(prelistId: string, productData: any[]) {
    Logger.info('<Service>:<ProductService>:<Create Product form prelist>');

    const preListProduct: IPrelistProduct = await PrelistPoduct.findOne({
      _id: new Types.ObjectId(prelistId)
    })?.lean();

    if (_.isEmpty(preListProduct)) {
      throw new Error('Prelist Product does not exist');
    }

    const bulkWrite: any = [];
    _.forEach(productData, (pData) => {
      const newProd = this.createProdByPrelist(preListProduct, pData);
      bulkWrite.push({
        insertOne: {
          document: newProd
        }
      });
    });
    if (bulkWrite.length > 0) {
      const res = await Product.bulkWrite(bulkWrite);
      return res;
    }
    return null;
  }

  private createProdByPrelist(prelistProd: IPrelistProduct, pData: any) {
    const upProd = { ...prelistProd, ...pData } as IProduct;
    upProd.prelistId = prelistProd._id;
    delete upProd._id;

    return upProd;
  }

  async updatePrelistProductImages(productId: string, req: Request | any) {
    Logger.info('<Service>:<ProductService>:<Product image uploading>');
    const prelistProduct: IPrelistProduct = await PrelistPoduct.findOne({
      _id: new Types.ObjectId(productId)
    })?.lean();
    if (_.isEmpty(prelistProduct)) {
      throw new Error('Product does not exist');
    }
    const files: Array<any> = req.files;

    const productImageList: Partial<IProductImageList> | any =
      prelistProduct.productImageList || {
        profile: {},
        first: {},
        second: {},
        third: {}
      };
    if (!files) {
      throw new Error('Files not found');
    }
    for (const file of files) {
      const fileName: 'first' | 'second' | 'third' | 'profile' =
        file.originalname?.split('.')[0] || 'profie';
      const { key, url } = await this.s3Client.uploadFile(
        productId,
        fileName,
        file.buffer
      );

      productImageList[fileName] = { key, docURL: url };
    }
    const res = await PrelistPoduct.findOneAndUpdate(
      { _id: productId },
      { $set: { productImageList } },
      { returnDocument: 'after' }
    );
    return res;
  }

  async searchAndFilterProduct(searchQuery: string): Promise<IProduct[]> {
    Logger.info(
      '<Service>:<ProductService>:<Search and Filter product service initiated>'
    );

    const regexQuery = new RegExp(searchQuery, 'i');

    const product: any = await Product.aggregate([
      {
        $lookup: {
          from: 'stores',
          localField: 'storeId',
          foreignField: 'storeId',
          as: 'storeInfo'
        }
      },
      { $unwind: { path: '$storeInfo' } },
      { $project: { 'storeInfo.verificationDetails.verifyObj': 0 } },
      {
        $match: {
          $or: [
            { itemName: regexQuery },
            { 'productCategory.catalogName': regexQuery },
            { 'productSubCategory.catalogName': regexQuery },
            { productBrand: regexQuery },
            { 'storeInfo.basicInfo.businessName': regexQuery }
          ]
        }
      },
      {
        $addFields: {
          productCategoryLength: {
            $size: {
              $ifNull: ['$productCategory.catalogName', []]
            }
          },
          productSubCategoryLength: {
            $size: {
              $ifNull: ['$productSubCategory.catalogName', []]
            }
          },
          matchedFieldStoreName: {
            $cond: {
              if: {
                $regexMatch: {
                  input: { $toString: '$storeInfo.basicInfo.businessName' },
                  regex: regexQuery
                }
              },
              then: ['$storeInfo.basicInfo.businessName'],
              else: []
            }
          },
          matchedFieldCategoryName: {
            $reduce: {
              input: {
                $ifNull: ['$productCategory.catalogName', []]
              },
              initialValue: [],
              in: {
                $cond: {
                  if: {
                    $regexMatch: {
                      input: { $toString: '$$this' },
                      regex: regexQuery
                    }
                  },
                  then: { $concatArrays: ['$$value', ['$$this']] },
                  else: '$$value'
                }
              }
            }
          },
          matchedFieldSubCategoryName: {
            $reduce: {
              input: {
                $ifNull: ['$productSubCategory.catalogName', []]
              },
              initialValue: [],
              in: {
                $cond: {
                  if: {
                    $regexMatch: {
                      input: { $toString: '$$this' },
                      regex: regexQuery
                    }
                  },
                  then: { $concatArrays: ['$$value', ['$$this']] },
                  else: '$$value'
                }
              }
            }
          },
          matchedFieldItemName: {
            $cond: {
              if: {
                $regexMatch: {
                  input: { $toString: '$itemName' },
                  regex: regexQuery
                }
              },
              then: ['$itemName'],
              else: []
            }
          },
          matchedFieldProductBrand: {
            $cond: {
              if: {
                $regexMatch: {
                  input: { $toString: '$productBrand' },
                  regex: regexQuery
                }
              },
              then: ['$productBrand'],
              else: []
            }
          }
        }
      },
      {
        $limit: 10
      }
    ]);

    return product;
  }
}
