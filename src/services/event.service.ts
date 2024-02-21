/* eslint-disable no-console */
import { injectable } from 'inversify';
import _ from 'lodash';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { S3Service } from './s3.service';
import EventModel, { IEvent, EventStatus } from './../models/Event';
import Store, { IStore } from './../models/Store';
import Customer, { ICustomer } from './../models/Customer';
import OfferModel, { IOffer } from './../models/Offers';
import InterestedEventAndOffer, {
  IInterestedEventAndOffer
} from './../models/InterestedEventsAndOffers';
import { sendEmail } from '../utils/common';

// import AWS from 'aws-sdk';
// import { s3Config } from '../config/constants';

// AWS.config.update({
//   accessKeyId: s3Config.AWS_KEY_ID,
//   secretAccessKey: s3Config.ACCESS_KEY,
//   region: 'ap-southeast-2'
// });

@injectable()
export class EventService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async create(eventRequest: IEvent): Promise<any> {
    Logger.info(
      '<Service>:<EventService>: <Event onboarding: creating new event>'
    );
    const newEvent = await EventModel.create(eventRequest);
    Logger.info('<Service>:<EventService>:<Event created successfully>');
    return newEvent;
  }

  async uploadImage(eventId: string, req: Request | any): Promise<any> {
    Logger.info('<Service>:<AdvertisementService>:<Into the upload banner >');
    const file = req.file;
    if (!file) {
      throw new Error('File does not exist');
    }
    const eventResult: IEvent = await EventModel.findOne({
      _id: eventId
    })?.lean();

    if (_.isEmpty(eventResult)) {
      throw new Error('Event does not exist');
    }
    const { key, url } = await this.s3Client.uploadFile(
      eventId,
      'event',
      file.buffer
    );
    const imageUpload = { key, url };
    const eventDetails = {
      ...eventResult,
      eventImage: {
        ...imageUpload,
        docURL: url
      },
      status: EventStatus.ACTIVE,
      _id: new Types.ObjectId(eventId)
    };
    const res = await EventModel.findOneAndUpdate(
      { _id: eventId },
      eventDetails,
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
    eventType: string,
    storeId: string,
    customerId: string
  ): Promise<IEvent[]> {
    let eventResponse: any;
    const query = {
      state: state,
      city: city,
      'category.name': category,
      'subCategory.name': { $in: subCategory },
      status: EventStatus.ACTIVE,
      eventType: eventType
    };

    Logger.info('<Service>:<EventService>:<get event initiated>');

    if (!state) {
      delete query['state'];
    }
    if (!city) {
      delete query['city'];
    }
    if (!coordinates) {
      delete query['status'];
    }
    if (!eventType) {
      delete query['eventType'];
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
      _.isEmpty(eventType)
    ) {
      eventResponse = await EventModel.aggregate([
        {
          $match: query
        },
        {
          $set: {
            eventCompleted: {
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
                if: { $eq: ['$status', 'DISABLED'] },
                then: 'DISABLED',
                else: {
                  $cond: {
                    if: { $lte: ['$eventCompleted', 1] },
                    then: 'ACTIVE',
                    else: 'DISABLED'
                  }
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'interestedeventsandoffers',
            let: { event_id: { $toString: '$_id' } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$eventOffersId', '$$event_id'] },
                      {
                        $or: [
                          { $eq: ['$storeId', storeId] },
                          { $eq: ['$customerId', customerId] }
                        ]
                      }
                    ]
                  }
                }
              }
            ],
            as: 'interested'
          }
        }
      ]);
    } else {
      eventResponse = EventModel.aggregate([
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
            eventCompleted: {
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
                if: { $eq: ['$status', 'DISABLED'] },
                then: 'DISABLED',
                else: {
                  $cond: {
                    if: { $lte: ['$eventCompleted', 1] },
                    then: 'ACTIVE',
                    else: 'DISABLED'
                  }
                }
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
            from: 'interestedeventsandoffers',
            let: { event_id: { $toString: '$_id' } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$eventOffersId', '$$event_id'] },
                      {
                        $or: [
                          { $eq: ['$storeId', storeId] },
                          { $eq: ['$customerId', customerId] }
                        ]
                      }
                    ]
                  }
                }
              }
            ],
            as: 'interested'
          }
        }
      ]);
    }

    Logger.info('<Service>:<EventService>:<Event get all successfully>');

    return eventResponse;
  }

  async getEventById(eventId: string): Promise<any> {
    Logger.info('<Service>:<EventService>:<get event initiated>');

    const eventResult: IEvent = await EventModel.findOne({
      _id: eventId
    })?.lean();

    if (_.isEmpty(eventResult)) {
      throw new Error('Event does not exist');
    }
    Logger.info('<Service>:<EventService>:<Upload event successful>');

    return eventResult;
  }

  async updateEventDetails(reqBody: IEvent, eventId: string): Promise<any> {
    Logger.info('<Service>:<EventService>:<Update Event details >');
    const eventResult: IEvent = await EventModel.findOne({
      _id: eventId
    })?.lean();

    if (_.isEmpty(eventResult)) {
      throw new Error('Event does not exist');
    }
    const query: any = {};
    query._id = reqBody._id;
    const res = await EventModel.findOneAndUpdate(query, reqBody, {
      returnDocument: 'after',
      projection: { 'verificationDetails.verifyObj': 0 }
    });
    return res;
  }

  async deleteEvent(reqBody: { imageKey: string; eventId: string }) {
    Logger.info('<Service>:<EventService>:<Delete event >');

    // Delete the event from the s3
    await this.s3Client.deleteFile(reqBody.imageKey);
    const res = await EventModel.findOneAndDelete({
      _id: new Types.ObjectId(reqBody.eventId)
    });
    return res;
  }

  async updateEventStatus(reqBody: {
    eventId: string;
    status: string;
  }): Promise<any> {
    Logger.info('<Service>:<EventService>:<Update event status >');

    const eventResult: IEvent = await EventModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(reqBody.eventId)
      },
      { $set: { status: reqBody.status } },
      { returnDocument: 'after' }
    );

    return eventResult;
  }

  async addToInterest(reqBody: {
    storeId: string;
    customerId: string;
    eventOffersId: string;
    isInterested: boolean;
  }): Promise<any> {
    Logger.info('<Service>:<EventService>:<Update event and offers interest >');

    const [store, customer, event, offer] = await Promise.all([
      Store.findOne(
        { storeId: reqBody.storeId },
        { verificationDetails: 0 }
      ).lean(),
      Customer.findOne({ _id: new Types.ObjectId(reqBody.customerId) }).lean(),
      EventModel.findOne({
        _id: new Types.ObjectId(reqBody.eventOffersId)
      }).lean(),
      OfferModel.findOne({
        _id: new Types.ObjectId(reqBody.eventOffersId)
      }).lean()
    ]);

    let newInterest: IInterestedEventAndOffer = reqBody;
    newInterest.name = store?.basicInfo?.ownerName || customer?.fullName;
    newInterest.phoneNumber =
      store?.contactInfo?.phoneNumber?.primary || customer?.phoneNumber;
    newInterest.eventName = event?.eventName || '';
    newInterest.offerName = offer?.offerName || '';
    newInterest.email = event?.email || offer?.email;
    newInterest = await InterestedEventAndOffer.create(newInterest);
    const templateData = {
      name: store?.basicInfo?.ownerName || customer?.fullName,
      phoneNumber:
        store?.contactInfo?.phoneNumber?.primary || customer?.phoneNumber,
      email: store?.contactInfo?.email || customer?.email,
      organiserName: event?.organizerName || offer?.storeName
    };
    sendEmail(
      templateData,
      event?.email || offer?.email,
      'support@serviceplug.in',
      'EventsOfferscheme'
    );
    sendEmail(
      templateData,
      store?.contactInfo?.email || customer?.email,
      'support@serviceplug.in',
      'EventsOfferscheme'
    );
    return newInterest;
  }
}
