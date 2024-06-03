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
import Admin, { AdminRole, IAdmin } from '../models/Admin';
import { sendEmail, sendNotification } from '../utils/common';

@injectable()
export class SPEmployeeService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

}
