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

@injectable()
export class AdvertisementService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async uploadBannerImage(bannerId: string, req: Request | any): Promise<any> {
    Logger.info('<Service>:<AdvertisementService>:<Into the upload banner >');
    const file = req.file;
    if (!file) {
      throw new Error('File does not exist');
    }
    const banner: IBanner = await Banner.findOne({ _id: bannerId })?.lean();

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

    return createdBanner;
  }

  async getBannerById(bannerId: string): Promise<any> {
    Logger.info('<Service>:<AdvertisementService>:<get Banner initiated>');

    const banner: IBanner = await Banner.findOne({ _id: bannerId })?.lean();

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
  }): Promise<IBanner[]> {
    Logger.debug(`${searchReqBody.coordinates} coordinates`);
    Logger.info('<Service>:<AdvertisementService>:<Get All Banner initiated>');
    let bannerResponse: any;
    const query = {
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
    if (
      _.isEmpty(searchReqBody.coordinates) &&
      _.isEmpty(searchReqBody.userType) &&
      _.isEmpty(searchReqBody.bannerPlace)
    ) {
      bannerResponse = await Banner.find().lean();
    } else {
      bannerResponse = Banner.aggregate([
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
              $gt: [{ $toInt: '$radius' }, '$dist.calculated']
            }
          }
        }
      ]);
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
      bannerResponse = await Banner.findOne(query)?.limit(6).lean();
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
      .lean();
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
    const banner: IBanner = await Banner.findOne({ _id: bannerId })?.lean();

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
}
