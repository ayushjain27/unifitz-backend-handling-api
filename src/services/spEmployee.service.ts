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
import SPEmployee, { ISPEmployee } from '../models/SPEmployee';

@injectable()
export class SPEmployeeService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async create(employeePayload: ISPEmployee): Promise<any> {
    Logger.info(
      '<Service>:<SPEmployeeService>: <Employee Creation: creating new employee>'
    );

    // check if store id exist
    // const { storeId } = employeePayload;
    // let store: IStore;
    // if (storeId) {
    //   store = await Store.findOne({ storeId }, { verificationDetails: 0 });
    // }
    // if (!store) {
    //   Logger.error('<Service>:<EmployeeService>:< Store id not found>');
    //   throw new Error('Store not found');
    // }
    let newEmp: ISPEmployee = employeePayload;
    // newEmp.storeId = store?.storeId;
    newEmp = await SPEmployee.create(newEmp);
    // Logger.info('<Service>:<EmployeeService>:<Employee created successfully>');
    return "asd";
  }
}
