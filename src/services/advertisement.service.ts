import { injectable } from 'inversify';
import Logger from '../config/winston';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';

import Banner, {
  IBanner,
  BannerStatus
} from './../models/advertisement/Banner';
import { AdBannerUploadRequest } from '../interfaces/adBannerRequest.interface';
import { S3Service } from './s3.service';
import _ from 'lodash';

@injectable()
export class AdvertisementService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async uploadBanner(
    bannerUploadRequest: AdBannerUploadRequest,
    req: Request | any
  ): Promise<IBanner> {
    Logger.info('<Service>:<AdvertisementService>:<Upload Banner initiated>');

    const { title, description, altText, status } = bannerUploadRequest;
    const file = req.file;

    if (!file) {
      throw new Error('File not found');
    }

    const { key, url } = await this.s3Client.uploadFile(
      JSON.stringify(new Date().getMilliseconds()),
      file.originalname,
      file.buffer
    );
    Logger.info('<Service>:<AdvertisementService>:<Upload file - successful>');
    const newBanner = {
      title,
      description,
      altText: _.isEmpty(altText) ? key : altText,
      slugUrl: key,
      url,
      status: _.isEmpty(status) ? BannerStatus.ACTIVE : status
    };
    const createdBanner = await Banner.create(newBanner);

    return createdBanner;
  }

  async getAllBanner(): Promise<IBanner[]> {
    Logger.info('<Service>:<AdvertisementService>:<Get All Banner initiated>');
    const banners: IBanner[] = await Banner.find().lean();
    return banners;
  }

  async getAllBannerForCustomer(): Promise<IBanner[]> {
    Logger.info(
      '<Service>:<AdvertisementService>:<Get All Banner for customer initiated>'
    );
    const banners: IBanner[] = await Banner.find().limit(4).lean();
    Logger.info(
      '<Service>:<AdvertisementService>:<Get All Banner for customer completed>'
    );
    return banners;
  }
}
