/* eslint-disable no-console */
import { injectable } from 'inversify';
import _ from 'lodash';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { S3Service } from './s3.service';
import EventModel, { IEvent, EventStatus } from './../models/Event';

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
      // altText: key,
      // slugUrl: key,
      // url,
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
    eventType: string
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
                if: { $lte: ['$eventCompleted', 1] },
                then: 'ACTIVE',
                else: 'DISABLED'
              }
            }
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
                if: { $lte: ['$eventCompleted', 0] },
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
}
