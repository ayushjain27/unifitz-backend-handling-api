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
import {
  OverallStoreRatingResponse,
  PartnersProductStoreRatingResponse
} from '../interfaces';
import Admin, { AdminRole } from '../models/Admin';
import { IPrelistProduct } from '../models/PrelistProduct';
import { PrelistPoduct } from '../models/PrelistProduct';
import {
  PartnersPoduct,
  IB2BPartnersProduct
} from '../models/B2BPartnersProduct';

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
    userName?: string;
    role?: string;
    oemId?: string;
  }): Promise<IPrelistProduct[]> {
    Logger.info(
      '<Service>:<ProductService>:<Search and Filter prelist product service initiated>'
    );
    let query: any = {};
    query = {
      // 'basicInfo.businessName': new RegExp(searchReqBody.storeName, 'i'),
      itemName: new RegExp(searchReqBody.itemName, 'i'),
      offerType: searchReqBody.offerType,
      'productCategory.catalogName': searchReqBody.productCategory,
      'productSubCategory.catalogName': searchReqBody.productSubCategory
      // oemUserName: searchReqBody?.userName
      // profileStatus: 'ONBOARDED'
    };
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

  async updatePrelistProduct(
    reqBody: IPrelistProduct,
    productId: string
  ): Promise<any> {
    Logger.info('<Service>:<ProductService>:<Update Product details >');
    const productResult: IPrelistProduct = await PrelistPoduct.findOne({
      _id: productId
    })?.lean();

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
      userId: customer?._id,
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

    const newProd = productPayload;
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

    const product: IB2BPartnersProduct[] = await PartnersPoduct.find(
      query
    ).lean();

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
      vehicleType: vehicleType,
      vehicleModel: vehicleModel,
      brandName: brandName,
      makeType: makeType
      // productCategory: productCategory,
      // productSubCategory: productSubCategory
    };
    if (userType === 'Distributer') {
      query.distributor = true;
    }
    if (userType === 'Dealer') {
      query.$or = [
        {
          'partnerDetail.companyType': 'Distributer'
        },
        { dealer: true }
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
    if (_.isEmpty(productCategory)) {
      delete query['productCategory'];
    }
    if (_.isEmpty(productSubCategory)) {
      delete query['productSubCategory'];
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
    const query: any = {};

    query.$or = [
      { vehicleType: vehicleType },
      { vehicleModel: vehicleModel },
      { brandName: brandName },
      { makeType: makeType }
    ];
    if (userType === 'Distributer') {
      query.distributor = true;
    }
    if (userType === 'Dealer') {
      query.$or = [
        {
          'partnerDetail.companyType': 'Distributer'
        },
        { dealer: true }
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
      brandName: brandName
    };

    if (userType === 'Distributer') {
      query.distributor = true;
    }
    if (userType === 'Dealer') {
      query.$or = [
        {
          'partnerDetail.companyType': 'Distributer'
        },
        { dealer: true }
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
    })?.lean();

    if (_.isEmpty(newProd)) {
      throw new Error('Partner product does not exist');
    }
    const userData = await Admin.findOne({
      userName: newProd?.oemUserName
    })?.lean();
    const jsonData = {
      ...newProd,
      partnerDetail: userData
    };
    Logger.info('<Service>:<ProductService>:<Upload product successful>');

    return jsonData;
  }

  async updatePartnerProduct(
    reqBody: IB2BPartnersProduct,
    partnerProductId: string
  ): Promise<any> {
    Logger.info('<Service>:<ProductService>:<Update Product details >');
    const partnerResult: IB2BPartnersProduct = await PartnersPoduct.findOne({
      _id: partnerProductId
    })?.lean();

    if (_.isEmpty(partnerResult)) {
      throw new Error('Product does not exist');
    }
    const query: any = {};
    query._id = reqBody._id;
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
  //   })?.lean();
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
    req: Request | any
  ): Promise<any> {
    Logger.info('<Service>:<VehicleService>:<Upload Vehicles initiated>');
    const partnerProduct = await PartnersPoduct.findOne({
      _id: new Types.ObjectId(partnerProductId)
    })?.lean();
    if (_.isEmpty(partnerProduct)) {
      throw new Error('Product does not exist');
    }

    const files: Array<any> = req.files;
    if (!files) {
      throw new Error('Files not found');
    }
    const ImageList: any = [];
    for (const file of files) {
      const fileName = file.originalname?.split('.')[0];
      const { key, url } = await this.s3Client.uploadFile(
        partnerProductId,
        fileName,
        file.buffer
      );
      ImageList.push({ key, docURL: url });
    }

    const colorList: any = ImageList?.map((val: any, key: number) => {
      const jsonData = {
        image: val
      };
      return jsonData;
    });
    const vehicleImages = partnerProduct?.colorCode
      .map((val) => (val?.image ? { image: val?.image } : undefined))
      .filter((res) => res !== undefined);
    const colorImages: any = [...vehicleImages, ...colorList];
    const colorCode: any = partnerProduct?.colorCode?.map(
      (val: any, key: number) => {
        const jsonData = {
          color: val?.color,
          colorName: val?.colorName,
          image: colorImages[key]?.image
        };
        return jsonData;
      }
    );

    const producttDetails = {
      ...partnerProduct,
      colorCode,
      status: 'ACTIVE',
      _id: new Types.ObjectId(partnerProductId)
    };

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
}
