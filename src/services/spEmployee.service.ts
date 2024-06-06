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
import { permissions } from '../config/permissions';

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
        message: `Error`,
        isPresent: true
      };
    }
    let newEmp: ISPEmployee = employeePayload;
    newEmp.accessList = permissions.employee;
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

    const res = await SPEmployee.findOneAndUpdate(
      { _id: employeeId },
      { $set: { profileImageUrl } },
      { returnDocument: 'after' }
    );
    return res;
  }

  getAllEmployeesByUserName = async (userName: string): Promise<ISPEmployee[]> => {
    Logger.info(
      '<Controller>:<SPEmployeeService>:<Get All employees request controller initiated>'
    );
    const employees: ISPEmployee[] = await SPEmployee.find({ userName });
    Logger.info('<Service>:<SPEmployeeService>:<Employee fetched successfully>');
    return employees;
  };

  getEmployeeByEmployeeId = async (employeeId: string, userName: string): Promise<ISPEmployee> => {
    Logger.info(
      '<Controller>:<SPEmployeeService>:<Get All employees request controller initiated>'
    );
    const employee: ISPEmployee = await SPEmployee.findOne({  employeeId, userName })?.lean();
    Logger.info('<Service>:<SPEmployeeService>:<Employee fetched successfully>');
    return employee;
  };

  async update(
    employeePayload: any
  ): Promise<ISPEmployee> {
    Logger.info('<Service>:<SPEmployeeService>:<Update employee initiated>');
    const { userName, employeeId } = employeePayload;

    Logger.info('<Service>:<SPEmployeeService>: <Employee: updating new employee>');
    const query: any = {};
    query.userName = userName;
    query.employeeId = employeeId;
    const employee: ISPEmployee = await SPEmployee.findOne({
      userName, employeeId
    });
    if (_.isEmpty(employee)) {
      throw new Error('Employee does not exist');
    }
    const updatedEmployee = await SPEmployee.findOneAndUpdate(query, employeePayload, {
      returnDocument: 'after'
    });
    Logger.info('<Service>:<SPEmployeeService>: <Employee: update employee successfully>');
    return updatedEmployee;
  }

  async deleteEmployee(
    employeeId: string,
    userName?: string
  ): Promise<any> {
    Logger.info(
      '<Service>:<SPEmployeeService>:<Delete employee by Id service initiated>'
    );
    const query: any = {};
    query.employeeId = employeeId;
    query.userName = userName;
    console.log(query,"dlfme")
    const res = await SPEmployee.findOneAndDelete(query);
    return res;
  }
}
