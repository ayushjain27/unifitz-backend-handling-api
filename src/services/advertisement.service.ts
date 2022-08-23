import { injectable } from 'inversify';
import { Types } from 'mongoose';
import Logger from '../config/winston';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';

import Banner, { IBanner } from './../models/advertisement/Banner';
import { AdBannerUploadRequest } from '../interfaces/adBannerRequest.interface';
import { S3Service } from './s3.service';
import _ from 'lodash';

@injectable()
export class AdvertisementService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async createBanner(
    bannerUploadRequest: AdBannerUploadRequest,
    req: Request | any
  ): Promise<IBanner> {
    Logger.info('<Service>:<AdvertisementService>:<Create Banner initiated>');

    const { title, description, altText } = bannerUploadRequest;
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
      altText,
      slugUrl: key,
      url
    };
    const createdBanner = await Banner.create(newBanner);

    return createdBanner;
  }
}
