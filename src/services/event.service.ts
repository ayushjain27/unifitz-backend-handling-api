/* eslint-disable no-console */
import { injectable } from 'inversify';
import _ from 'lodash';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { S3Service } from './s3.service';
import EventModel, { IEvent, EventStatus } from './../models/Event';
import Store from './../models/Store';
import Customer from './../models/Customer';
import OfferModel from './../models/Offers';
import InterestedEventAndOffer, {
  IInterestedEventAndOffer
} from './../models/InterestedEventsAndOffers';
import { SQSEvent } from '../enum/sqsEvent.enum';
import { SQSService } from './sqs.service';

@injectable()
export class EventService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private sqsService = container.get<SQSService>(TYPES.SQSService);

  async create(eventRequest: IEvent): Promise<any> {
    Logger.info(
      '<Service>:<EventService>: <Event onboarding: creating new event>'
    );
    const newEvent = await EventModel.create(eventRequest);
    // if(eventRequest.eventType === 'PARTNER'){
    //   let query = {
    //     profileStatus: 'ONBOARDED'
    //   }
    //   const storesResponse = await Store.find(query, {
    //     'verificationDetails.verifyObj': 0
    //   });
    //   await storesResponse.map((item,index)=>{
    //     sendNotification('Event Updated', 'Your store has updated. It is under review', item?.contactInfo?.phoneNumber?.primary, "STORE_OWNER", 'EVENTS');
    //   })
    // }else{
    //   const customerResponse: ICustomer[] = await Customer.find({});
    //   await customerResponse.map((item,index)=>{
    //     sendNotification('Event Updated', 'Your store has updated. It is under review', item?.phoneNumber, "USER", 'EVENTS');
    //   })
    // }
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
    });

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

    eventDetails.eventId = eventId;
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

  async getAllEventByInterest(): Promise<any> {
    Logger.info('<Service>:<EventService>:<get event initiated>');

    const eventResult = await EventModel.aggregate([
      {
        $lookup: {
          from: 'interestedeventsandoffers',
          localField: 'eventId',
          foreignField: 'eventOffersId',
          as: 'interested'
        }
      }
    ]);

    return eventResult;
  }

  async getEventById(eventId: string): Promise<any> {
    Logger.info('<Service>:<EventService>:<get event initiated>');

    const eventResult: IEvent = await EventModel.findOne({
      _id: eventId
    });

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
    });

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
    eventofferType: string;
  }): Promise<any> {
    Logger.info('<Service>:<EventService>:<Update event and offers interest >');

    const [store, customer, event, offer] = await Promise.all([
      Store.findOne({ storeId: reqBody.storeId }, { verificationDetails: 0 }),
      Customer.findOne({ _id: new Types.ObjectId(reqBody.customerId) }),
      EventModel.findOne({
        _id: new Types.ObjectId(reqBody.eventOffersId)
      }),
      OfferModel.findOne({
        _id: new Types.ObjectId(reqBody.eventOffersId)
      })
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
      organiserName: event?.organizerName
    };
    const templateDataUsers = {
      name: store?.basicInfo?.ownerName || customer?.fullName,
      phoneNumber:
        store?.contactInfo?.phoneNumber?.primary || customer?.phoneNumber,
      email: store?.contactInfo?.email || customer?.email,
      eventOfferName: event?.eventName || offer?.offerName,
      organiserName: event?.organizerName
    };
    if (!_.isEmpty(event?.email) || !_.isEmpty(offer?.email)) {
      const data = {
        to: event?.email || offer?.email,
        templateData: templateData,
        templateName: 'EventsOfferscheme'
      };

      const sqsMessage = await this.sqsService.createMessage(
        SQSEvent.EMAIL_NOTIFICATION,
        data
      );
    }
    if (!_.isEmpty(store?.contactInfo?.email) || !_.isEmpty(customer?.email)) {
      const data = {
        to: store?.contactInfo?.email || customer?.email,
        templateData: templateData,
        templateName: 'EventsOffersUsersScheme'
      };

      const sqsMessage = await this.sqsService.createMessage(
        SQSEvent.EMAIL_NOTIFICATION,
        data
      );
    }
    return newInterest;
  }

  async getAllInterest(): Promise<any> {
    Logger.info('<Service>:<EventService>:<get event offer interest >');

    const interestResult: IInterestedEventAndOffer[] =
      await InterestedEventAndOffer.find();

    return interestResult;
  }
}
