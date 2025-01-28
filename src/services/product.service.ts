/* eslint-disable no-console */
import ProductReview, { IProductReview } from './../models/ProductReview';
import { injectable } from 'inversify';
import _, { isEmpty } from 'lodash';
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
import {
  OverallStoreRatingResponse,
  PartnersProductStoreRatingResponse
} from '../interfaces';
import Admin, { AdminRole } from '../models/Admin';
import { IPrelistProduct } from '../models/PrelistProduct';
import { PrelistPoduct } from '../models/PrelistProduct';
import ProductCartModel from '../models/ProductCart';
import {
  PartnersPoduct,
  IB2BPartnersProduct
} from '../models/B2BPartnersProduct';
import { UserService } from './user.service';
import { StoreService } from './store.service';
import ProductOrderAddress, {
  IProductOrderAddress
} from '../models/ProductOrderAddress';

@injectable()
export class ProductService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private userService = container.get<UserService>(TYPES.UserService);
  private storeService = container.get<StoreService>(TYPES.StoreService);
  private customerService = container.get<CustomerService>(
    TYPES.CustomerService
  );
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
    });
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

  async getAll(
    userName?: string,
    role?: string,
    oemId?: string
  ): Promise<IProduct[]> {
    const query: any = {};

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    console.log(userName, role, oemId);
    const product: IProduct[] = await Product.find(query);

    return product;
  }

  async getAllCount(
    userName?: string,
    role?: string,
    oemId?: string,
    searchQuery?: string,
    category?: string,
    subCategory?: string
  ): Promise<IProduct[]> {
    const query: any = {
      'productCategory.catalogName': { $in: [category] },
      'productSubCategory.catalogName': { $in: [subCategory] }
    };
    if (searchQuery) {
      query.$or = [{ storeId: searchQuery }, { itemName: searchQuery }];
    }
    if (!category) {
      delete query['productCategory.catalogName'];
    }
    if (!subCategory) {
      delete query['productSubCategory.catalogName'];
    }

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    console.log(userName, role, oemId);
    const product: IProduct[] = await Product.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: '$offerType',
          initialCount: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          total: '$initialCount',
          _id: 0
        }
      }
    ]);

    return product;
  }

  async paginatedProductAll(
    userName?: string,
    role?: string,
    oemId?: string,
    pageNo?: number,
    pageSize?: number,
    searchQuery?: string,
    category?: string,
    subCategory?: string
  ): Promise<IProduct[]> {
    const query: any = {
      'productCategory.catalogName': { $in: [category] },
      'productSubCategory.catalogName': { $in: [subCategory] }
    };
    if (!category) {
      delete query['productCategory.catalogName'];
    }
    if (!subCategory) {
      delete query['productSubCategory.catalogName'];
    }

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    if (searchQuery) {
      query.$or = [{ itemName: searchQuery }, { storeId: searchQuery }];
    }
    const product = await Product.aggregate([
      {
        $match: query
      },
      {
        $skip: pageNo * pageSize
      },
      {
        $limit: pageSize
      }
    ]);

    return product;
  }

  async searchAndFilterPrelistProductPaginated(searchReqBody: {
    productCategory: string;
    productSubCategory: string;
    itemName: string;
    pageNo: number;
    pageSize: number;
    offerType: string;
    userName?: string;
    role?: string;
    oemId?: string;
    category: string;
    subCategory: string;
    searchQuery: string;
  }): Promise<IPrelistProduct[]> {
    Logger.info(
      '<Service>:<ProductService>:<Search and Filter prelist product service initiated>'
    );
    let query: any = {};
    query = {
      // 'basicInfo.businessName': new RegExp(searchReqBody.storeName, 'i'),
      itemName: new RegExp(searchReqBody.itemName, 'i'),
      offerType: searchReqBody.offerType,
      'productCategory.catalogName': { $in: [searchReqBody.category] },
      'productSubCategory.catalogName': { $in: [searchReqBody.subCategory] }
      // oemUserName: searchReqBody?.userName
      // profileStatus: 'ONBOARDED'
    };
    if (searchReqBody?.searchQuery) {
      query.$or = [
        { itemName: searchReqBody?.searchQuery },
        { offerType: searchReqBody?.searchQuery }
      ];
    }
    if (searchReqBody.role === AdminRole.OEM) {
      query.oemUserName = searchReqBody.userName;
    }

    if (searchReqBody.role === AdminRole.EMPLOYEE) {
      query.oemUserName = searchReqBody.oemId;
    }

    if (searchReqBody.oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    if (!searchReqBody.itemName) {
      delete query['itemName'];
    }
    if (!searchReqBody.offerType) {
      delete query['offerType'];
    }
    if (!searchReqBody.category) {
      delete query['productCategory.catalogName'];
    }
    if (!searchReqBody.subCategory) {
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

  async getTotalPrelistCount(searchReqBody: {
    productCategory: string;
    productSubCategory: string;
    itemName: string;
    offerType: string;
    userName?: string;
    role?: string;
    oemId?: string;
    category: string;
    subCategory: string;
    searchQuery: string;
  }): Promise<IPrelistProduct[]> {
    Logger.info(
      '<Service>:<ProductService>:<Search and Filter prelist product service initiated>'
    );
    let query: any = {};
    query = {
      // 'basicInfo.businessName': new RegExp(searchReqBody.storeName, 'i'),
      itemName: new RegExp(searchReqBody.itemName, 'i'),
      offerType: searchReqBody.offerType,
      'productCategory.catalogName': { $in: [searchReqBody.category] },
      'productSubCategory.catalogName': { $in: [searchReqBody.subCategory] }
      // oemUserName: searchReqBody?.userName
      // profileStatus: 'ONBOARDED'
    };
    if (searchReqBody?.searchQuery) {
      query.$or = [
        { itemName: searchReqBody?.searchQuery },
        { offerType: searchReqBody?.searchQuery }
      ];
    }
    if (searchReqBody.role === AdminRole.OEM) {
      query.oemUserName = searchReqBody.userName;
    }

    if (searchReqBody.role === AdminRole.EMPLOYEE) {
      query.oemUserName = searchReqBody.oemId;
    }

    if (searchReqBody.oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    if (!searchReqBody.itemName) {
      delete query['itemName'];
    }
    if (!searchReqBody.offerType) {
      delete query['offerType'];
    }
    if (!searchReqBody.category) {
      delete query['productCategory.catalogName'];
    }
    if (!searchReqBody.subCategory) {
      delete query['productSubCategory.catalogName'];
    }
    Logger.debug(query);

    const prelistProduct: any = await PrelistPoduct.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: '$offerType',
          initialCount: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          total: '$initialCount',
          _id: 0
        }
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
    });
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
    });
    return product;
  }

  async updatePrelistProduct(
    reqBody: IPrelistProduct,
    productId: string
  ): Promise<any> {
    Logger.info('<Service>:<ProductService>:<Update Product details >');
    const productResult: IPrelistProduct = await PrelistPoduct.findOne({
      _id: productId
    });

    if (_.isEmpty(productResult)) {
      throw new Error('Product does not exist');
    }
    const query: any = {};
    query._id = reqBody._id;
    const res = await PrelistPoduct.findOneAndUpdate(query, reqBody, {
      returnDocument: 'after',
      projection: { 'verificationDetails.verifyObj': 0 }
    });
    return res;
  }

  async updateProductStatus(reqBody: {
    productId: string;
    status: string;
  }): Promise<any> {
    Logger.info('<Service>:<ProductService>:<Update product status >');

    const productResult: IPrelistProduct = await PrelistPoduct.findOneAndUpdate(
      {
        _id: new Types.ObjectId(reqBody.productId)
      },
      { $set: { status: reqBody.status } },
      { returnDocument: 'after' }
    );

    return productResult;
  }

  async getAllProductsByStoreId(storeId: string): Promise<IProduct[]> {
    Logger.info(
      '<Service>:<ProductService>: <Product Fetch: getting all the products by store id>'
    );

    const products: IProduct[] = await Product.find({ storeId });
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
        _id: new Types.ObjectId(productId)
      });
    }
    if (!product) {
      Logger.error(
        '<Service>:<ProductService>:<Product not found with that product Id>'
      );
      throw new Error('Product not found');
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
      storeId: string;
      rating: number;
      userName: string;
    },
    custPhoneNumber: string
  ) {
    const customerService = container.get<CustomerService>(
      TYPES.CustomerService
    );
    Logger.info(
      '<Service>:<ProductService>: <Product Review: adding product review>'
    );
    const { storeId } = productReviewPayload;
    let store: IStore;
    if (storeId) {
      store = await Store.findOne({ storeId }, { verificationDetails: 0 });
    }
    if (!store) {
      Logger.error('<Service>:<ProductService>:< Store id not found>');
      throw new Error('Store not found');
    }
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
      name: store?.basicInfo?.ownerName || customer?.fullName,
      storeId: productReviewPayload?.storeId,
      userId: customer?._id
        ? new Types.ObjectId(customer._id as string)
        : undefined,
      userName: productReviewPayload?.userName || ''
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
          name: 1,
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
    });
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
    });

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
    });
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
    const producttDetails = {
      ...prelistProduct,
      productImageList,
      status: 'ACTIVE',
      _id: new Types.ObjectId(productId)
    };
    const res = await PrelistPoduct.findOneAndUpdate(
      { _id: productId },
      producttDetails,
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

  async getProductByOemUserName(searchReqBody: {
    productCategory: string;
    productSubCategory: string;
    oemUserName: string;
  }): Promise<IPrelistProduct[]> {
    Logger.info(
      '<Service>:<ProductService>: <Product Fetch: Get product by OemUserName>'
    );
    const query = {
      'productCategory.catalogName': searchReqBody?.productCategory,
      'productSubCategory.catalogName': searchReqBody?.productSubCategory,
      oemUserName: searchReqBody?.oemUserName
    };
    if (!searchReqBody?.productCategory) {
      delete query['productCategory.catalogName'];
    }
    if (!searchReqBody?.productSubCategory) {
      delete query['productSubCategory.catalogName'];
    }
    if (!searchReqBody?.oemUserName) {
      delete query['oemUserName'];
    }
    Logger.debug(query);

    const product: any = await PartnersPoduct.aggregate([
      // {
      //   $geoNear: {
      //     near: {
      //       type: 'Point',
      //       coordinates: searchReqBody.coordinates as [number, number]
      //     },
      //     key: 'contactInfo.geoLocation',
      //     spherical: true,
      //     query: query,
      //     distanceField: 'contactInfo.distance',
      //     distanceMultiplier: 0.001
      //   }
      // },
      {
        $match: query
      },
      {
        $project: { 'verificationDetails.verifyObj': 0 }
      }
    ]);

    return product;
  }

  async createPartnerProduct(
    productPayload: IB2BPartnersProduct,
    userName?: string,
    role?: string
  ): Promise<any> {
    Logger.info('<Service>:<ProductService>: <creating new  partner product>');

    const newProd: any = productPayload;
    if (
      productPayload?.priceDetail?.mrp !== null &&
      productPayload?.priceDetail?.sellingPrice !== null
    ) {
      const numVal =
        (productPayload?.priceDetail?.mrp -
          productPayload?.priceDetail?.sellingPrice) /
        productPayload?.priceDetail?.mrp;

      newProd.discount = numVal * 100;
    }

    if (role === AdminRole.OEM) {
      newProd.oemUserName = userName;
    }
    const productResult = await PartnersPoduct.create(newProd);
    Logger.info(
      '<Service>:<ProductService>:<Partner Product created successfully>'
    );
    return productResult;
  }

  async partnerProductGetAll(
    userName: string,
    role?: string,
    oemId?: string
  ): Promise<any> {
    Logger.info('<Service>:<ProductService>:<get product initiated>');
    const query: any = {};

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    console.log(userName, role, oemId, 'partner');

    const product: IB2BPartnersProduct[] = await PartnersPoduct.find(query);

    return product;
  }

  async getAllProductByPaginated(
    userName: string,
    role?: string,
    oemId?: string,
    pageNo?: number,
    pageSize?: number,
    searchQuery?: string,
    category?: string,
    subCategory?: string
  ): Promise<any> {
    Logger.info('<Service>:<ProductService>:<get product initiated>');
    const query: any = {
      'productCategory.catalogName': { $in: [category] },
      'productSubCategory.catalogName': { $in: [subCategory] }
    };

    if (!category) delete query['productCategory.catalogName'];
    if (!subCategory) delete query['productSubCategory.catalogName'];

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    if (searchQuery) {
      query.$or = [
        { oemUserName: searchQuery },
        { manufactureName: searchQuery },
        { productSuggest: searchQuery }
      ];
    }
    const product = await PartnersPoduct.aggregate([
      {
        $match: query
      },
      {
        $skip: pageNo * pageSize
      },
      {
        $limit: pageSize
      }
    ]);

    return product;
  }

  async getAllPartnerProductCount(
    userName: string,
    role?: string,
    oemId?: string,
    searchQuery?: string,
    category?: string,
    subCategory?: string
  ): Promise<any> {
    Logger.info('<Service>:<ProductService>:<get product initiated>');
    const query: any = {
      'productCategory.catalogName': { $in: [category] },
      'productSubCategory.catalogName': { $in: [subCategory] }
    };

    if (!category) delete query['productCategory.catalogName'];
    if (!subCategory) delete query['productSubCategory.catalogName'];

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    if (searchQuery) {
      query.$or = [{ oemUserName: searchQuery }];
    }
    const product = await PartnersPoduct.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: '$status',
          initialCount: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          total: '$initialCount',
          _id: 0
        }
      }
    ]);

    return product;
  }

  async partnerProductFilter(
    userName: string,
    role?: string,
    oemId?: string,
    userType?: string,
    vehicleType?: string,
    vehicleModel?: string,
    brandName?: string,
    makeType?: string,
    productCategory?: any,
    productSubCategory?: any
  ): Promise<any> {
    Logger.info('<Service>:<ProductService>:<get product initiated>');
    let query: any = {};
    query = {
      // 'employeeCompanyDetails.companyType': userType,
      'vehicleType.name': { $in: [vehicleType] },
      // vehicleModel: vehicleModel,
      'colorCodeList.oemList.oemBrand': brandName,
      'colorCodeList.oemList.oemModel.value': { $in: [vehicleModel] },
      makeType: makeType,
      status: 'ACTIVE',
      'productCategory.catalogName': { $in: productCategory },
      'productSubCategory.catalogName': { $in: productSubCategory }
    };
    if (userType === 'Distributer') {
      query.$or = [{ 'targetedAudience.distributor': true }];
    }
    if (userType === 'Dealer') {
      query.$or = [
        {
          'partnerDetail.companyType': 'Distributer'
        },
        { 'targetedAudience.dealer': true }
      ];
    }
    if (!vehicleType) {
      delete query['vehicleType.name'];
    }
    if (!vehicleModel) {
      delete query['colorCodeList.oemList.oemModel.value'];
    }
    if (!brandName) {
      delete query['colorCodeList.oemList.oemBrand'];
    }
    if (!makeType) {
      delete query['makeType'];
    }
    if (_.isEmpty(productCategory)) {
      delete query['productCategory.catalogName'];
    }
    if (_.isEmpty(productSubCategory)) {
      delete query['productSubCategory.catalogName'];
    }
    console.log(userName, role, oemId, query, 'partner');

    const product = await PartnersPoduct.aggregate([
      {
        $lookup: {
          from: 'admin_users',
          localField: 'oemUserName',
          foreignField: 'userName',
          as: 'partnerDetail'
        }
      },
      { $unwind: { path: '$partnerDetail' } },
      {
        $match: query
      }
      // {
      //   $project: { partnerDetail: 0 }
      // }
    ]);

    return product;
  }

  async PaginatedPartnerProduct(
    userName: string,
    role?: string,
    oemId?: string,
    userType?: string,
    vehicleType?: string,
    vehicleModel?: string,
    brandName?: string,
    makeType?: string,
    productCategory?: string,
    productSubCategory?: string,
    pageNo?: number,
    pageSize?: number,
    discount?: string,
    storeId?: string
  ): Promise<any> {
    Logger.info('<Service>:<ProductService>:<get product initiated>');
    let query: any = {};
    const discountStart = Number(discount?.split('-')[0]);
    const discountEnd = Number(discount?.split('-')[1]);

    query = {
      'vehicleType.name': { $in: [vehicleType] },
      // 'vehicleModel.value': vehicleModel,
      // 'brandName.catalogName': brandName,
      'colorCodeList.oemList.oemBrand': brandName,
      'colorCodeList.oemList.oemModel.value': { $in: [vehicleModel] },
      makeType: makeType,
      status: 'ACTIVE',
      'productCategory.catalogName': { $in: [productCategory] },
      'productSubCategory.catalogName': { $in: productSubCategory },
      discount: {
        $gte: discountStart,
        $lte: discountEnd
      }
    };

    if (userType === 'Distributer') {
      query.$or = [
        {
          'partnerDetail.companyType': 'Distributer'
        },
        { 'targetedAudience.distributor': true }
      ];
    }
    if (userType === 'Dealer') {
      query.$or = [
        {
          'partnerDetail.companyType': 'Distributer'
        },
        { 'targetedAudience.dealer': true }
      ];
    }

    let stateFilter: string | null = null;
    let cityFilter: string | null = null;

    if (!isEmpty(storeId)) {
      const store = await this.storeService.getById({
        storeId: storeId,
        lat: '',
        long: ''
      });

      if (isEmpty(vehicleType)) {
        const subCategory = store[0]?.basicInfo?.subCategory;
        const subCategoryNames = subCategory.map((sub) => sub.name);
        query['vehicleType.name'] = { $in: subCategoryNames };
      }
      stateFilter = store[0]?.contactInfo?.state || null;
      console.log(stateFilter, 'Dekm');
      cityFilter = store[0]?.contactInfo?.city || null;
      console.log(cityFilter, 'Dekm');
    }

    // Remove unused filters if their values are not provided
    if (!vehicleType && !storeId) {
      delete query['vehicleType.name'];
    }
    if (!vehicleModel) {
      delete query['colorCodeList.oemList.oemModel.value'];
    }
    if (!brandName) {
      delete query['colorCodeList.oemList.oemBrand'];
    }
    if (!makeType) {
      delete query['makeType'];
    }
    if (!discount) {
      delete query['discount'];
    }
    if (!productCategory) {
      delete query['productCategory.catalogName'];
    }
    if (!productSubCategory) {
      delete query['productSubCategory.catalogName'];
    }

    console.log(userName, role, oemId, query, 'partner');

    const matchStage: any = { ...query };

    // Dynamically build the $expr for state and city filters
    if (stateFilter && cityFilter) {
      // Both state and city filters are present
      matchStage.$expr = {
        $and: [
          {
            $or: [
              { $eq: [{ $size: '$state' }, 0] },
              { $in: [stateFilter, '$state.name'] }
            ]
          },
          {
            $or: [
              { $eq: [{ $size: '$city' }, 0] },
              { $in: [cityFilter, '$city.name'] }
            ]
          }
        ]
      };
    } else if (stateFilter) {
      // Only state filter is present
      matchStage.$expr = {
        $or: [
          { $eq: [{ $size: '$state' }, 0] },
          { $in: [stateFilter, '$state.name'] }
        ]
      };
    }

    // Build the aggregation pipeline
    const product = await PartnersPoduct.aggregate([
      {
        $lookup: {
          from: 'admin_users',
          localField: 'oemUserName',
          foreignField: 'userName',
          as: 'partnerDetail'
        }
      },
      { $unwind: { path: '$partnerDetail' } },
      {
        $match: matchStage
      },
      {
        $skip: pageNo * pageSize
      },
      {
        $limit: pageSize
      }
    ]);

    return product;
  }

  async similarPartnerProduct(
    userName: string,
    role?: string,
    oemId?: string,
    userType?: string,
    vehicleType?: string,
    vehicleModel?: string,
    brandName?: string,
    makeType?: string
  ): Promise<any> {
    Logger.info('<Service>:<ProductService>:<get product initiated>');
    const query: any = {
      status: 'ACTIVE'
    };

    query.$or = [
      { vehicleType: vehicleType },
      { vehicleModel: vehicleModel },
      { brandName: brandName },
      { makeType: makeType }
    ];
    if (userType === 'Distributer') {
      query.$or = [{ 'targetedAudience.distributor': true }];
    }
    if (userType === 'Dealer') {
      query.$or = [
        {
          'partnerDetail.companyType': 'Distributer'
        },
        { 'targetedAudience.dealer': true }
      ];
    }
    if (!vehicleType) {
      delete query['vehicleType'];
    }
    if (!vehicleModel) {
      delete query['vehicleModel'];
    }
    if (!brandName) {
      delete query['brandName'];
    }
    if (!makeType) {
      delete query['makeType'];
    }

    const product = await PartnersPoduct.aggregate([
      {
        $lookup: {
          from: 'admin_users',
          localField: 'oemUserName',
          foreignField: 'userName',
          as: 'partnerDetail'
        }
      },
      { $unwind: { path: '$partnerDetail' } },
      {
        $match: query
      },
      { $limit: 10 }
    ]);

    return product;
  }

  async allSimilarBrand(
    userName: string,
    role?: string,
    oemId?: string,
    userType?: string,
    brandName?: string
  ): Promise<any> {
    Logger.info('<Service>:<ProductService>:<get product initiated>');
    let query: any = {};

    query = {
      brandName: brandName,
      status: 'ACTIVE'
    };

    if (userType === 'Distributer') {
      query.$or = [{ 'targetedAudience.distributor': true }];
    }
    if (userType === 'Dealer') {
      query.$or = [
        {
          'partnerDetail.companyType': 'Distributer'
        },
        { 'targetedAudience.dealer': true }
      ];
    }

    if (!brandName) {
      delete query['brandName'];
    }

    const product = await PartnersPoduct.aggregate([
      {
        $lookup: {
          from: 'admin_users',
          localField: 'oemUserName',
          foreignField: 'userName',
          as: 'partnerDetail'
        }
      },
      { $unwind: { path: '$partnerDetail' } },
      {
        $match: query
      },
      { $limit: 10 }
    ]);

    return product;
  }

  async getPartnerProductById(partnerProductId: string): Promise<any> {
    Logger.info('<Service>:<ProductService>:<get event initiated>');

    const newProd: IB2BPartnersProduct = await PartnersPoduct.findOne({
      _id: partnerProductId
    });

    if (_.isEmpty(newProd)) {
      throw new Error('Partner product does not exist');
    }
    // const userData = await Admin.findOne({
    //   userName: newProd?.oemUserName
    // });
    // const jsonData = {
    //   ...newProd,
    //   partnerDetail: userData
    // };
    Logger.info('<Service>:<ProductService>:<Upload product successful>');

    return newProd;
  }

  async updatePartnerProduct(
    reqBody: IB2BPartnersProduct,
    partnerProductId: string
  ): Promise<any> {
    Logger.info('<Service>:<ProductService>:<Update Product details >');
    const partnerResult: IB2BPartnersProduct = await PartnersPoduct.findOne({
      _id: partnerProductId
    });

    if (_.isEmpty(partnerResult)) {
      throw new Error('Product does not exist');
    }
    const query: any = {};
    query._id = reqBody._id;
    const numVal =
      (reqBody?.priceDetail?.mrp - reqBody?.priceDetail?.sellingPrice) /
      reqBody?.priceDetail?.mrp;
    reqBody.discount = numVal * 100;
    const res = await PartnersPoduct.findOneAndUpdate(query, reqBody, {
      returnDocument: 'after',
      projection: { 'verificationDetails.verifyObj': 0 }
    });
    return res;
  }

  async deletePartnerProduct(
    partnerProductId: string
    //   reqBody: {
    //   imageKey: string;
    //   partnerProductId: string;
    // }
  ) {
    Logger.info('<Service>:<ProductService>:<Delete product >');

    // Delete the event from the s3
    // await this.s3Client.deleteFile(reqBody.imageKey);
    const res = await PartnersPoduct.findOneAndDelete({
      _id: new Types.ObjectId(partnerProductId)
    });
    return res;
  }

  async updatePartnerProductStatus(reqBody: {
    partnerProductId: string;
    status: string;
  }): Promise<any> {
    Logger.info('<Service>:<ProductService>:<Update product status >');

    const productResult: IB2BPartnersProduct =
      await PartnersPoduct.findOneAndUpdate(
        {
          _id: new Types.ObjectId(reqBody.partnerProductId)
        },
        { $set: { status: reqBody.status } },
        { returnDocument: 'after' }
      );

    return productResult;
  }

  async updateManyProduct(
    userName: string,
    role?: string,
    oemId?: string,
    allData?: any
  ): Promise<any> {
    Logger.info('<Service>:<ProductService>:<get product initiated>');
    const query: any = {};
    let updateData: any = {};
    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    console.log(allData, 'allDataallDataallData');

    if (allData?.state) updateData = { $set: { state: allData?.state } };
    if (allData?.city) updateData = { $set: { city: allData?.city } };
    if (allData?.distributor === true || allData?.distributor === false) {
      updateData = { $set: { distributor: allData?.distributor } };
    }
    if (allData?.dealer === true || allData?.dealer === false) {
      updateData = { $set: { dealer: allData?.dealer } };
    }

    const product = await PartnersPoduct.updateMany(query, updateData);

    return product;
  }

  // async updatePartnerProductImages(
  //   partnerProductId: string,
  //   req: Request | any
  // ) {
  //   Logger.info('<Service>:<ProductService>:<Product image uploading>');
  //   const prelistProduct: IB2BPartnersProduct = await PartnersPoduct.findOne({
  //     _id: new Types.ObjectId(partnerProductId)
  //   });
  //   if (_.isEmpty(prelistProduct)) {
  //     throw new Error('Product does not exist');
  //   }
  //   const files: Array<any> = req.files;

  //   const productImageList: Partial<IProductImageList> | any =
  //     prelistProduct.productImageList || {
  //       profile: {},
  //       first: {},
  //       second: {},
  //       third: {}
  //     };
  //   if (!files) {
  //     throw new Error('Files not found');
  //   }
  //   for (const file of files) {
  //     const fileName: 'first' | 'second' | 'third' | 'profile' =
  //       file.originalname?.split('.')[0];
  //     const { key, url } = await this.s3Client.uploadFile(
  //       partnerProductId,
  //       fileName,
  //       file.buffer
  //     );

  //     productImageList[fileName] = { key, docURL: url };
  //   }
  //   const producttDetails = {
  //     ...prelistProduct,
  //     productImageList,
  //     status: 'ACTIVE',
  //     _id: new Types.ObjectId(partnerProductId)
  //   };
  //   const res = await PartnersPoduct.findOneAndUpdate(
  //     { _id: partnerProductId },
  //     producttDetails,
  //     { returnDocument: 'after' }
  //   );
  //   return res;
  // }

  async updatePartnerProductImages(
    partnerProductId: string,
    dataList: any,
    req: Request | any
  ): Promise<any> {
    Logger.info('<Service>:<VehicleService>:<Upload Vehicles initiated>');
    const partnerProduct = await PartnersPoduct.findOne({
      _id: new Types.ObjectId(partnerProductId)
    });

    if (_.isEmpty(partnerProduct)) {
      throw new Error('Product does not exist');
    }

    const files = req.files;
    const imageIndexes = req.body.imageIndex;
    if (!files || !imageIndexes) {
      // return res.status(400).send('Files or image indexes are missing');
      throw new Error('Files or keys not found');
    }
    const ImageList: any = [];
    const imageIndexArray = Array.isArray(imageIndexes)
      ? imageIndexes
      : imageIndexes.split('-');
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      let colorCodeIndex, imageFieldIndex;

      if (files.length === 1) {
        [colorCodeIndex, imageFieldIndex] = imageIndexArray;
      } else {
        [colorCodeIndex, imageFieldIndex] = imageIndexArray[index].split('-');
      }

      const fileName = file.originalname.split('.')[0];
      const { key, url } = await this.s3Client.uploadFile(
        partnerProductId,
        fileName,
        file.buffer
      );
      ImageList.push({ colorCodeIndex, imageFieldIndex, key, docURL: url });
    }
    console.log(ImageList, 'ImageListImageList');
    console.log(
      imageIndexes?.length,
      imageIndexes,
      imageIndexes[0],
      imageIndexes[0].split('-'),
      'imageIndex.splitsplitsplitsplit'
    );

    const colorList: any = [];
    for (let index = 0; index < partnerProduct?.colorCodeList.length; index++) {
      const colorCode = partnerProduct?.colorCodeList[index];

      ImageList.forEach((image: any) => {
        if (parseInt(image.colorCodeIndex) === index) {
          switch (image.imageFieldIndex) {
            case '0':
              colorCode.image1 = { key: image.key, docURL: image.docURL };
              break;
            case '1':
              colorCode.image2 = { key: image.key, docURL: image.docURL };
              break;
            case '2':
              colorCode.image3 = { key: image.key, docURL: image.docURL };
              break;
          }
        }
      });
      colorList.push(colorCode);
    }
    console.log(dataList, colorList, 'colorListcolorList');

    const producttDetails = {
      ...partnerProduct,
      colorCodeList: colorList,
      status: 'ACTIVE',
      _id: new Types.ObjectId(partnerProductId)
    };
    console.log(dataList, producttDetails, 'dataListdataListdataListdataList');

    const res = await PartnersPoduct.findOneAndUpdate(
      { _id: partnerProductId },
      producttDetails,
      { returnDocument: 'after' }
    );
    return res;
  }
  async getOverallPartnerProductRatings(
    partnerProductId: string
  ): Promise<PartnersProductStoreRatingResponse> {
    Logger.info('<Service>:<ProductService>:<Get Overall Ratings initiate>');
    const productReviews = await ProductReview.find({
      productId: partnerProductId
    });
    if (productReviews.length === 0) {
      return {
        allRatings: {
          5: 100
        },
        averageRating: '-',
        totalRatings: 0,
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

    const averageRating = Number(
      ratingsCount / productReviews.length
    ).toPrecision(2);
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

  async addToCart(
    productPayload: any,
    userName?: string,
    role?: string
  ): Promise<any> {
    Logger.info('<Service>:<ProductService>: <adding new product>');

    const newProd = productPayload;
    if (role === AdminRole.OEM) {
      newProd.oemUserName = userName;
    }
    if (productPayload?.retailPrice) {
      newProd.totalAmount =
        Number(productPayload?.qty) * Number(productPayload?.price);
    }
    if (productPayload?.bulkPrice) {
      const totalBulkQty =
        Number(productPayload?.qty) * Number(productPayload?.moqQty);
      newProd.moqQty = Number(productPayload?.moqQty);
      newProd.totalMoqQty = totalBulkQty;
      newProd.totalAmount =
        Number(productPayload?.qty) * Number(productPayload?.price);
    }
    newProd.status = 'ACTIVE';
    const productResult = await ProductCartModel.create(newProd);
    Logger.info('<Service>:<ProductService>:<Product added successfully>');
    return productResult;
  }

  async getCartList(oemId?: string): Promise<any> {
    Logger.info('<Service>:<ProductService>:<get product initiated>');
    const query: any = {
      userId: oemId,
      status: 'ACTIVE'
    };
    const product = await ProductCartModel.aggregate([
      { $match: query },
      { $set: { ProductInfo: { $toObjectId: '$productId' } } },
      {
        $lookup: {
          from: 'partnersproducts',
          localField: 'ProductInfo',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: { path: '$productInfo' } },
      // { $set: { productName: '$productInfo.productSuggest' } },
      // { $set: { colorCode: '$productInfo.colorCode' } }
      {
        $project: { ProductInfo: 0 }
      }
    ]);

    return product;
  }

  async updateCartProduct(reqBody: any, cartId: string): Promise<any> {
    Logger.info('<Service>:<ProductService>:<Update Product details >');
    const partnerResult: any = await ProductCartModel.findOne({
      _id: cartId
    });

    if (_.isEmpty(partnerResult)) {
      throw new Error('Product does not exist');
    }
    const query: any = {};
    const cartJson: any = partnerResult;
    query._id = partnerResult._id;
    if (partnerResult?.retailPrice) {
      cartJson.totalAmount =
        Number(reqBody?.qty) * Number(partnerResult?.price);
    }
    if (partnerResult?.bulkPrice) {
      const totalBulkQty = Number(reqBody?.qty) * Number(partnerResult?.moqQty);
      cartJson.totalMoqQty = totalBulkQty;
      cartJson.totalAmount =
        Number(reqBody?.qty) * Number(partnerResult?.price);
    }
    cartJson.qty = Number(reqBody?.qty);
    const res = await ProductCartModel.findOneAndUpdate(query, cartJson, {
      returnDocument: 'after',
      projection: { 'verificationDetails.verifyObj': 0 }
    });
    return res;
  }

  async deleteCartProduct(cartId: string) {
    Logger.info('<Service>:<ProductService>:<Delete product >');

    // Delete the event from the s3
    // await this.s3Client.deleteFile(reqBody.imageKey);
    const res = await ProductCartModel.findOneAndDelete({
      _id: new Types.ObjectId(cartId)
    });
    return res;
  }

  async createNewAddress(requestBody: any): Promise<IProductOrderAddress> {
    Logger.info('<Service>:<ProductService>: <New Address created>');

    const params: IProductOrderAddress = {
      ...requestBody,
      app: requestBody.userRole === 'STORE_OWNER' ? 'PARTNER' : 'CUSTOMER',
      userId: new Types.ObjectId()
    };

    // Get the user and attach the user id
    const userPayload = {
      phoneNumber: `+91${requestBody.phoneNumber?.slice(-10)}`,
      role: requestBody.userRole
    };

    // Get the user details
    const user = await this.userService.getUserByPhoneNumber(userPayload);

    if (isEmpty(user)) {
      throw new Error('User not found');
    }

    params.userId = user._id;

    // If user role is store owner then get store id, else get customer id if available.

    if (requestBody.userRole === 'STORE_OWNER') {
      const store = await this.storeService.getStoreByUserId(user._id);

      if (isEmpty(store)) {
        throw new Error('Store not found');
      }
      params.storeId = store?.storeId;
    } else {
      const phoneNumber = requestBody.phoneNumber.slice(-10);
      const customer = await this.customerService.getByPhoneNumber(phoneNumber);
      params.customerId = String(customer?._id);
    }
    params.isDefault = false;

    const newAddressRequest = await ProductOrderAddress.create(params);
    return newAddressRequest;
  }

  async getAllAddress(
    phoneNumber: string,
    userRole: string
  ): Promise<IProductOrderAddress[]> {
    Logger.info('<Service>:<ProductService>:<Get all addresses>');
    const productOrderAddressResponse: IProductOrderAddress[] =
      await ProductOrderAddress.find({
        phoneNumber: `+91${phoneNumber?.slice(-10)}`,
        userRole
      });
    return productOrderAddressResponse;
  }

  async getAddressByAddressId(
    addressId: string
  ): Promise<IProductOrderAddress> {
    Logger.info('<Service>:<ProductService>:<Get data by id>');
    const productOrderAddressResponse: IProductOrderAddress =
      await ProductOrderAddress.findOne({
        _id: new Types.ObjectId(addressId)
      });
    if (isEmpty(productOrderAddressResponse)) {
      throw new Error('Address not found');
    }
    return productOrderAddressResponse;
  }

  async deleteAddressById(addressId: string): Promise<IProductOrderAddress> {
    Logger.info('<Service>:<ProductService>:<Delete address by id>');
    // Use `findByIdAndDelete` to delete and return the deleted document
    const productOrderAddressResponse =
      await ProductOrderAddress.findOneAndDelete({
        _id: new Types.ObjectId(addressId)
      });

    if (!productOrderAddressResponse) {
      throw new Error('Address not found or already deleted');
    }
    // const productOrderAddressResponse: IProductOrderAddress =
    //   await ProductOrderAddress.deleteOne({
    //     _id: new Types.ObjectId(addressId)
    //   });
    return productOrderAddressResponse;
  }

  async updateStatusOfAddress(
    phoneNumber: string,
    userRole: string,
    addressId: string
  ): Promise<IProductOrderAddress> {
    Logger.info('<Service>:<ProductService>:<Get all addresses>');
    const address: IProductOrderAddress = await ProductOrderAddress.findOne({
      _id: new Types.ObjectId(addressId)
    });
    if (isEmpty(address)) {
      throw new Error('Address not found');
    }
    const productOrderAddressResponseStatusUpdate: IProductOrderAddress =
      await ProductOrderAddress.findOneAndUpdate(
        {
          phoneNumber: `+91${phoneNumber?.slice(-10)}`,
          userRole,
          isDefault: true
        },
        { $set: { isDefault: false } },
        { new: true }
      );
    const productOrderAddressResponse: IProductOrderAddress =
      await ProductOrderAddress.findOneAndUpdate(
        {
          _id: new Types.ObjectId(addressId)
        },
        { $set: { isDefault: true } },
        { new: true }
      );
    return productOrderAddressResponse;
  }

  async updateAddress(
    addressPayload: any,
    addressId: string
  ): Promise<IProductOrderAddress> {
    Logger.info(
      '<Service>:<ProductService>: <Product Update: updating address>'
    );

    let address: IProductOrderAddress;
    if (addressId) {
      address = await ProductOrderAddress.findOne({ _id: addressId });
    }
    if (!address) {
      Logger.error(
        '<Service>:<ProductService>:<Address not found with that address Id>'
      );
      throw new Error('Address not found');
    }
    const userPayload = {
      phoneNumber: `+91${addressPayload.phoneNumber?.slice(-10)}`,
      role: addressPayload.userRole
    };

    // Get the user details
    const user = await this.userService.getUserByPhoneNumber(userPayload);

    if (isEmpty(user)) {
      throw new Error('User not found');
    }

    addressPayload.userId = user._id;

    // If user role is store owner then get store id, else get customer id if available.

    if (addressPayload.userRole === 'STORE_OWNER') {
      const store = await this.storeService.getStoreByUserId(user._id);

      if (isEmpty(store)) {
        throw new Error('Store not found');
      }
      addressPayload.storeId = store?.storeId;
    } else {
      const phoneNumber = addressPayload.phoneNumber.slice(-10);
      const customer = await this.customerService.getByPhoneNumber(phoneNumber);
      addressPayload.customerId = customer?._id;
    }

    let updatedAddr: IProductOrderAddress = addressPayload;

    updatedAddr = await ProductOrderAddress.findOneAndUpdate(
      { _id: new Types.ObjectId(addressId) },
      updatedAddr,
      { returnDocument: 'after' }
    );
    Logger.info('<Service>:<ProductService>:<Address uppdated successfully>');
    return updatedAddr;
  }
}
