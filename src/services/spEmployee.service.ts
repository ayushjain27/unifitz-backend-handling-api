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
    const { employeeId, userName } = employeePayload;
    let employee: ISPEmployee;
    if (employeeId) {
      employee = await SPEmployee.findOne({ employeeId, userName });
    }
    if(employee){
      return {
        message: `The employee with that employee id has already registered.`,
        isPresent: true
      };
    }
    // if (!store) {
    //   Logger.error('<Service>:<EmployeeService>:< Store id not found>');
    //   throw new Error('Store not found');
    // }
    let newEmp: ISPEmployee = employeePayload;
    newEmp = await SPEmployee.create(newEmp);
    Logger.info('<Service>:<SPEmployeeService>:<Employee created successfully>');
    return newEmp;
  }

  async updateEmployeeImage(employeeId: string, req: Request | any) {
    Logger.info('<Service>:<SPEmployeeService>:<Employee image uploading>');
    const employee: ISPEmployee = await SPEmployee.findOne({
      _id: new Types.ObjectId(employeeId)
    });
    if (_.isEmpty(employee)) {
      throw new Error('Employee does not exist');
    }
    const file: any = req.file;

    let profileImageUrl: any = employee.profileImageUrl || '';

    if (!file) {
      throw new Error('Files not found');
    }

    const fileName = 'profile';
    const { url } = await this.s3Client.uploadFile(
      employeeId,
      fileName,
      file.buffer
    );
    profileImageUrl = url;

    const res = await Customer.findOneAndUpdate(
      { _id: employeeId },
      { $set: { profileImageUrl } },
      { returnDocument: 'after' }
    );
    return res;
  }
}
