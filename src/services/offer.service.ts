/* eslint-disable no-console */
import { injectable } from 'inversify';
import _ from 'lodash';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { S3Service } from './s3.service';
import OfferModel, { IOffer, OfferStatus } from './../models/Offers';

@injectable()
export class OfferService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async create(offerRequest: IOffer): Promise<any> {
    Logger.info(
      '<Service>:<OfferService>: <Offer onboarding: creating new offer>'
    );
    const newOffer = await OfferModel.create(offerRequest);
    Logger.info('<Service>:<OfferService>:<Offer created successfully>');
    return newOffer;
  }

  async uploadImage(offerId: string, req: Request | any): Promise<any> {
    Logger.info('<Service>:<OfferService>:<Into the upload banner >');
    const file = req.file;
    if (!file) {
      throw new Error('File does not exist');
    }
    const offerResult: IOffer = await OfferModel.findOne({
      _id: offerId
    })?.lean();

    if (_.isEmpty(offerResult)) {
      throw new Error('Offer does not exist');
    }
    const { key, url } = await this.s3Client.uploadFile(
      offerId,
      'offer',
      file.buffer
    );
    const imageUpload = { key, url };
    const offerDetails = {
      ...offerResult,
      // altText: key,
      // slugUrl: key,
      // url,
      offerImage: {
        ...imageUpload,
        docURL: url
      },
      status: OfferStatus.ACTIVE,
      _id: new Types.ObjectId(offerId)
    };
    const res = await OfferModel.findOneAndUpdate(
      { _id: offerId },
      offerDetails,
      {
        returnDocument: 'after'
      }
    );
    return res;
  }

  async getAll(
    coordinates: number[],
    subCategory: string[],
    category: string,
    state: string,
    city: string,
    offerType: string,
    storeId: string,
    customerId: string
  ): Promise<IOffer[]> {
    let offerResponse: any;
    const query = {
      state: state,
      city: city,
      'category.name': category,
      'subCategory.name': { $in: subCategory },
      status: OfferStatus.ACTIVE,
      offerType: offerType
    };

    Logger.info('<Service>:<OfferService>:<get offer initiated>');

    if (!state) {
      delete query['state'];
    }
    if (!city) {
      delete query['city'];
    }
    if (!coordinates) {
      delete query['status'];
    }
    if (!offerType) {
      delete query['offerType'];
    }
    if (!category) {
      delete query['category.name'];
    }
    if (!subCategory || subCategory.length === 0) {
      delete query['subCategory.name'];
    }
    if (
      _.isEmpty(coordinates) &&
      _.isEmpty(category) &&
      _.isEmpty(subCategory) &&
      _.isEmpty(offerType)
    ) {
      offerResponse = await OfferModel.aggregate([
        {
          $match: query
        },
        {
          $set: {
            offerCompleted: {
              $dateDiff: {
                startDate: { $toDate: '$endDate' },
                endDate: new Date(),
                unit: 'day'
              }
            }
          }
        },
        {
          $set: {
            status: {
              $cond: {
                if: { $lte: ['$offerCompleted', 1] },
                then: 'ACTIVE',
                else: 'DISABLED'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'interestedEventsAndOffers',
            let: { event_id: { $toString: '$_id' }},
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$eventOffersId', '$$event_id'] },
                      { $or: [
                        { $eq: ['$storeId', storeId] },
                        { $eq: ['$customerId', customerId] }
                      ]}
                    ]
                  }
                }
              }
            ],
            as: 'interested'
          }
        },
        {
          $unwind: {
            path: '$interested',
          }
        },
      ]);
    } else {
      offerResponse = OfferModel.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: coordinates as [number, number]
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
          $set: {
            offerCompleted: {
              $dateDiff: {
                startDate: { $toDate: '$endDate' },
                endDate: new Date(),
                unit: 'day'
              }
            }
          }
        },
        {
          $set: {
            status: {
              $cond: {
                if: { $lte: ['$offerCompleted', 1] },
                then: 'ACTIVE',
                else: 'DISABLED'
              }
            }
          }
        },
        {
          $match: {
            status: { $eq: 'ACTIVE' }
          }
        },
        {
          $lookup: {
            from: 'interestedEventsAndOffers',
            let: { event_id: { $toString: '$_id' }},
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$eventOffersId', '$$event_id'] },
                      { $or: [
                        { $eq: ['$storeId', storeId] },
                        { $eq: ['$customerId', customerId] }
                      ]}
                    ]
                  }
                }
              }
            ],
            as: 'interested'
          }
        },
        {
          $unwind: {
            path: '$interested',
          }
        },
      ]);
    }

    Logger.info('<Service>:<OfferService>:<Offer get all successfully>');

    return offerResponse;
  }

  async getOfferById(offerId: string): Promise<any> {
    Logger.info('<Service>:<OfferService>:<get offer initiated>');

    const offerResult: IOffer = await OfferModel.findOne({
      _id: offerId
    })?.lean();

    if (_.isEmpty(offerResult)) {
      throw new Error('Offer does not exist');
    }
    Logger.info('<Service>:<OfferService>:<Upload offer successful>');

    return offerResult;
  }

  async updateOfferDetails(reqBody: IOffer, offerId: string): Promise<any> {
    Logger.info('<Service>:<OfferService>:<Update Offer details >');
    const offerResult: IOffer = await OfferModel.findOne({
      _id: offerId
    })?.lean();
    if (_.isEmpty(offerResult)) {
      throw new Error('Offer does not exist');
    }
    console.log(offerResult, 'flnjr');
    const query: any = {};
    query._id = reqBody._id;
    const res = await OfferModel.findOneAndUpdate(query, reqBody, {
      returnDocument: 'after',
      projection: { 'verificationDetails.verifyObj': 0 }
    });
    return res;
  }

  async deleteOffer(reqBody: { imageKey: string; offerId: string }) {
    Logger.info('<Service>:<OfferService>:<Delete offer >');

    // Delete the event from the s3
    await this.s3Client.deleteFile(reqBody.imageKey);
    const res = await OfferModel.findOneAndDelete({
      _id: new Types.ObjectId(reqBody.offerId)
    });
    return res;
  }

  async updateOfferStatus(reqBody: {
    offerId: string;
    status: string;
  }): Promise<any> {
    Logger.info('<Service>:<OfferService>:<Update offer status >');

    const eventResult: IOffer = await OfferModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(reqBody.offerId)
      },
      { $set: { status: reqBody.status } },
      { returnDocument: 'after' }
    );

    return eventResult;
  }
}
