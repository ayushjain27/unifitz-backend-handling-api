import { injectable } from 'inversify';
import { Types } from 'mongoose';
import Logger from '../config/winston';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';

import Banner, {
  IBanner,
  BannerStatus
} from './../models/advertisement/Banner';
import { S3Service } from './s3.service';
import _ from 'lodash';
import Store from '../models/Store';
import { AdminRole } from './../models/Admin';
import Customer from '../models/Customer';
import { SQSService } from './sqs.service';
import { SQSEvent } from '../enum/sqsEvent.enum';
import { NotificationService } from './notification.service';

@injectable()
export class AdvertisementService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private sqsService = container.get<SQSService>(TYPES.SQSService);
  private notificationService = container.get<NotificationService>(
    TYPES.NotificationService
  );

  async uploadBannerImage(bannerId: string, req: Request | any): Promise<any> {
    Logger.info('<Service>:<AdvertisementService>:<Into the upload banner >');
    const file = req.file;
    if (!file) {
      throw new Error('File does not exist');
    }
    const banner: IBanner = await Banner.findOne({ _id: bannerId }).lean();

    if (_.isEmpty(banner)) {
      throw new Error('Banner does not exist');
    }
    const { key, url } = await this.s3Client.uploadFile(
      bannerId,
      'banner',
      file.buffer
    );
    const bannerLogo = { key, url };
    const bannerDetails = {
      ...banner,
      altText: key,
      slugUrl: key,
      url,
      banner: bannerLogo,
      status: BannerStatus.ACTIVE,
      _id: new Types.ObjectId(bannerId)
    };

    const res = await Banner.findOneAndUpdate(
      { _id: bannerId },
      bannerDetails,
      { returnDocument: 'after' }
    );
    return res;
  }

  async uploadBanner(addBanner: IBanner) {
    Logger.info('<Service>:<AdvertisementService>:<Upload Banner initiated>');
    const createdBanner = await Banner.create(addBanner);
    Logger.info('<Service>:<AdvertisementService>:<Upload file - successful>');
    const bannerCoordinates = addBanner.geoLocation.coordinates;
    if (addBanner.userType === 'PARTNER_APP') {
      const query = {
        'basicInfo.category.name': {
          $in: addBanner.category.map((category) => category.name)
        },
        'basicInfo.subCategory.name': {
          $in: addBanner.subCategory.map((subCategory) => subCategory.name)
        }
      };
      if (!addBanner.category.map((category) => category.name)) {
        delete query['basicInfo.category.name'];
      }
      if (!addBanner.subCategory.map((subCategory) => subCategory.name)) {
        delete query['basicInfo.subCategory.name'];
      }

      const storeResponse = await Store.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [
                Number(bannerCoordinates[0]),
                Number(bannerCoordinates[1])
              ] as [number, number]
            },
            // key: 'contactInfo.geoLocation',
            spherical: true,
            query: query,
            distanceField: 'contactInfo.geoLocation.coordinates',
            distanceMultiplier: 0.001,
            maxDistance: addBanner?.radius * 1000
          }
        }
      ]);

      await storeResponse.map(async(item, index) => {
        // sendNotification(
        //   addBanner.title,
        //   addBanner.description,
        //   item?.contactInfo?.phoneNumber?.primary,
        //   'STORE_OWNER',
        //   ''
        // );
        const data = {
          title: addBanner.title,
          body: addBanner.description,
          phoneNumber: item?.contactInfo?.phoneNumber?.primary,
          role: 'STORE_OWNER',
          type: 'NEW_BANNERS'
        };
        const sqsMessage = await this.sqsService.createMessage(
          SQSEvent.NOTIFICATION,
          data
        );
        const notificationData = {
          title:  addBanner.title,
          body: addBanner.description,
          phoneNumber: item?.contactInfo?.phoneNumber?.primary,
          type: "NEW_BANNERS",
          role: "STORE_OWNER",
          storeId: item?.storeId
        }
    
        let notification = await this.notificationService.createNotification(notificationData)
        
      });
    } else {
      const customerResponse = await Customer.aggregate([
        {
          $project: {
            _id: 1,
            phoneNumber: 1,
            customerId: 1,
            geoLocation: 1,
            distance: {
              $sqrt: {
                $add: [
                  {
                    $pow: [
                      {
                        $subtract: [
                          Number(bannerCoordinates[0]),
                          { $arrayElemAt: ['$geoLocation.coordinates', 0] }
                        ]
                      },
                      2
                    ]
                  },
                  {
                    $pow: [
                      {
                        $subtract: [
                          Number(bannerCoordinates[1]),
                          { $arrayElemAt: ['$geoLocation.coordinates', 1] }
                        ]
                      },
                      2
                    ]
                  }
                ]
              }
            }
          }
        },
        {
          $match: {
            distance: { $lte: addBanner.radius * 1000 }
          }
        }
      ]);

      await customerResponse.forEach(async(item, index) => {
        // sendNotification(
        //   addBanner.title,
        //   addBanner.description,
        //   customer.phoneNumber,
        //   'USER',
        //   ''
        // );
        const data = {
          title: addBanner.title,
          body: addBanner.description,
          phoneNumber: item?.phoneNumber,
          role: 'USER',
          type: 'NEW_BANNERS'
        };
        const sqsMessage = this.sqsService.createMessage(
          SQSEvent.NOTIFICATION,
          data
        );

        const notificationData = {
          title:  addBanner.title,
          body: addBanner.description,
          phoneNumber: item?.phoneNumber,
          type: "NEW_BANNERS",
          role: "USER",
          customerId: item?.customerId
        }
    
        let notification = await this.notificationService.createNotification(notificationData)
      });
    }
    return createdBanner;
  }

  async getAllPaginatedBanner(
    pageNo?: number,
    pageSize?: number,
    searchQuery?: string,
    userName?: string,
    role?: string,
    oemId?: string
  ): Promise<any> {
    Logger.info('<Service>:<AdvertisementService>:<get Banner initiated>');
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
    if (searchQuery) {
      query.$or = [{ title: searchQuery }];
    }
    const result = await Banner.aggregate([
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
    return result;
  }

  async getBannerById(bannerId: string): Promise<any> {
    Logger.info('<Service>:<AdvertisementService>:<get Banner initiated>');

    const banner: IBanner = await Banner.findOne({ _id: bannerId });

    if (_.isEmpty(banner)) {
      throw new Error('Banner does not exist');
    }

    Logger.info('<Service>:<AdvertisementService>:<Upload banner successful>');

    return banner;
  }

  async getAllBanner(searchReqBody: {
    coordinates: number[];
    userType: string;
    bannerPlace: string;
    subCategory: string[];
    category: string;
    userName?: string;
    role?: string;
    oemId?: string;
  }): Promise<IBanner[]> {
    Logger.debug(`${searchReqBody.coordinates} coordinates`);
    Logger.info('<Service>:<AdvertisementService>:<Get All Banner initiated>');
    let bannerResponse: any;
    const query: any = {
      userType: searchReqBody.userType,
      bannerPlace: searchReqBody.bannerPlace,
      // 'geoLocation.coordinates': searchReqBody.coordinates,
      'category.name': searchReqBody.category,
      'subCategory.name': { $in: searchReqBody.subCategory },
      status: BannerStatus.ACTIVE
    };
    if (!searchReqBody.userType) {
      delete query['userType'];
    }
    if (!searchReqBody.bannerPlace) {
      delete query['bannerPlace'];
    }
    // if (!searchReqBody.coordinates) {
    //   delete query['geoLocation.coordinates'];
    // }
    if (!searchReqBody.category) {
      delete query['category.name'];
    }
    if (!searchReqBody.subCategory || searchReqBody.subCategory.length === 0) {
      delete query['subCategory.name'];
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
    if (
      _.isEmpty(searchReqBody.coordinates) &&
      _.isEmpty(searchReqBody.userType) &&
      _.isEmpty(searchReqBody.bannerPlace)
    ) {
      delete query['status'];
      bannerResponse = await Banner.find(query);
    } else {
      bannerResponse = await Banner.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: searchReqBody.coordinates as [number, number]
            },
            // key: 'contactInfo.geoLocation',
            spherical: true,
            query: query,
            distanceField: 'dist.calculated',
            includeLocs: 'dist.location',
            distanceMultiplier: 0.001
            // maxDistance: 10 * 1000
          }
        },
        {
          $match: {
            $expr: {
              $and: [
                { $ne: ['$radius', null] }, // Check if 'radius' is not null
                { $ne: ['$radius', undefined] }, // Check if 'radius' is defined
                { $ne: ['$radius', ''] }, // Check if 'radius' is not an empty string
                { $gt: [{ $toInt: '$radius' }, '$dist.calculated'] }
              ]
            }
          }
        }
      ]);
    }
    if (
      bannerResponse.length === 0 &&
      !query.oemUserName &&
      !searchReqBody.oemId
    ) {
      if (
        searchReqBody?.bannerPlace === 'Top Banner' &&
        searchReqBody?.userType === 'CUSTOMER_WEB'
      ) {
        return [
          {
            title: 'Default 1',
            category: [{ name: 'Default 1' }],
            url: 'https://serviceplug-prod.s3.ap-south-1.amazonaws.com/295/1705474937295/Banner_1.jpeg'
          }
        ];
      } else if (
        searchReqBody?.bannerPlace === 'Center Banner' &&
        searchReqBody?.userType === 'CUSTOMER_WEB'
      ) {
        return [
          {
            title: 'Default 2',
            category: [{ name: 'Default 2' }],
            url: 'https://serviceplug-prod.s3.ap-south-1.amazonaws.com/630/1705474969630/Banner_3.jpeg'
          },
          {
            title: 'Default 3',
            category: [{ name: 'Default 3' }],
            url: 'https://serviceplug-prod.s3.ap-south-1.amazonaws.com/929/1705474993929/Banner_2.jpeg'
          },
          {
            title: 'Default 4',
            category: [{ name: 'Default 4' }],
            url: 'https://serviceplug-prod.s3.ap-south-1.amazonaws.com/697/1705475034697/Banner_4.jpg'
          }
        ];
      } else if (
        searchReqBody?.bannerPlace === 'Right Banner' &&
        searchReqBody?.userType === 'CUSTOMER_WEB'
      ) {
        return [
          {
            title: 'Default 5',
            category: [{ name: 'Default 5' }],
            url: 'https://serviceplug-prod.s3.ap-south-1.amazonaws.com/76/1705475086076/banner_5.jpeg'
          },
          {
            title: 'Default 6',
            category: [{ name: 'Default 6' }],
            url: 'https://serviceplug-prod.s3.ap-south-1.amazonaws.com/646/1705475125646/banner_6.jpeg'
          }
        ];
      } else if (
        searchReqBody?.bannerPlace === 'Bottom Banner' &&
        searchReqBody?.userType === 'CUSTOMER_WEB'
      ) {
        return [
          {
            title: 'Default 7',
            category: [{ name: 'Default 7' }],
            url: 'https://serviceplug-prod.s3.ap-south-1.amazonaws.com/757/1706080314757/banner_9.png'
          }
        ];
      } else if (searchReqBody?.userType === 'CUSTOMER_APP') {
        return [
          {
            title: 'Default 8',
            category: [{ name: 'Default 8' }],
            url: 'https://serviceplug-prod.s3.ap-south-1.amazonaws.com/89/1705475155089/Banner_app.jpeg'
          }
        ];
      } else {
        return [
          {
            title: 'Default 9',
            category: [{ name: 'Default 9' }],
            url: 'https://serviceplug-prod.s3.ap-south-1.amazonaws.com/89/1705475155089/Banner_app.jpeg'
          }
        ];
      }
    }
    return bannerResponse;
  }

  async getAllBannerList(searchReqBody: {
    coordinates: number[];
    userType: string;
    bannerPlace: string;
  }): Promise<IBanner[]> {
    let bannerResponse: any;
    const query = {
      userType: searchReqBody.userType,
      bannerPlace: searchReqBody.bannerPlace,
      status: BannerStatus.ACTIVE
    };

    if (
      searchReqBody.userType === 'PARTNER_APP' ||
      searchReqBody.userType === 'CUSTOMER_APP'
    ) {
      if (!searchReqBody.userType) {
        delete query['userType'];
      }
      if (!searchReqBody.bannerPlace) {
        delete query['bannerPlace'];
      }
      bannerResponse = await Banner.findOne(query)?.limit(6);
    } else {
      bannerResponse = [];
    }
    return bannerResponse;
  }

  async getAllBannerForCustomer(): Promise<IBanner[]> {
    Logger.info(
      '<Service>:<AdvertisementService>:<Get All Banner for customer initiated>'
    );
    const banners: IBanner[] = await Banner.find({
      status: BannerStatus.ACTIVE
    })
      .limit(4)
      ;
    Logger.info(
      '<Service>:<AdvertisementService>:<Get All Banner for customer completed>'
    );
    return banners;
  }

  async updateBannerStatus(reqBody: {
    bannerId: string;
    status: string;
  }): Promise<any> {
    Logger.info('<Service>:<AdvertisementService>:<Update Banner status >');

    const banner: IBanner = await Banner.findOneAndUpdate(
      {
        _id: new Types.ObjectId(reqBody.bannerId)
      },
      { $set: { status: reqBody.status } },
      { returnDocument: 'after' }
    );

    return banner;
  }

  async updateBannerDetails(reqBody: IBanner, bannerId: string): Promise<any> {
    Logger.info('<Service>:<AdvertisementService>:<Update Banner status >');
    const banner: IBanner = await Banner.findOne({ _id: bannerId });

    if (_.isEmpty(banner)) {
      throw new Error('Banner does not exist');
    }
    const query: any = {};
    query._id = reqBody._id;
    const res = await Banner.findOneAndUpdate(query, reqBody, {
      returnDocument: 'after',
      projection: { 'verificationDetails.verifyObj': 0 }
    });
    return res;
  }

  async deleteBanner(reqBody: { slugUrl: string; bannerId: string }) {
    Logger.info('<Service>:<AdvertisementService>:<Delete Banner >');

    // Delete the banner from the s3
    await this.s3Client.deleteFile(reqBody.slugUrl);
    const res = await Banner.findOneAndDelete({
      _id: new Types.ObjectId(reqBody.bannerId)
    });
    return res;
  }

  async bannerAnalytic(bannerType: string, bannerPlace: string) {
    Logger.info(
      '<Service>:<CategoryService>:<Get all analytic service initiated>'
    );
    let query: any = {};
    query = {
      userType: bannerType,
      bannerPlace: bannerPlace,
      status: 'ACTIVE'
    };
    if (!bannerType) {
      delete query['userType'];
    }
    if (!bannerPlace) {
      delete query['bannerPlace'];
    }
    const queryFilter: any = await Banner.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: 'plusfeatures',
          localField: 'url',
          foreignField: 'moduleInformation',
          as: 'analytic'
        }
      },
      {
        $project: {
          title: 1,
          bannerPlace: 1,
          bannerPosition: 1,
          userType: 1,
          location: 1,
          url: 1,
          externalUrl: 1,
          usersViewCount: {
            $cond: {
              if: { $isArray: '$analytic' },
              then: { $size: '$analytic' },
              else: 0
            }
          }
        }
      },
      { $sort: { usersViewCount: -1 } }
    ]);
    return queryFilter;
  }
}
