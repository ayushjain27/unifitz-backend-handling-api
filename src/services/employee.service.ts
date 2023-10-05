import { injectable } from 'inversify';
import _ from 'lodash';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Store, { IStore } from '../models/Store';
import { S3Service } from './s3.service';
import { IEmployee } from '../models/employee';
import { Employee } from '../models/employee';
import mongoose, { Types } from 'mongoose';

@injectable()
export class EmployeeService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async create(employeePayload: IEmployee): Promise<IEmployee> {
    Logger.info(
      '<Service>:<EmployeeService>: <Employee Creation: creating new employee>'
    );

    // check if store id exist
    const { storeId } = employeePayload;
    let store: IStore;
    if (storeId) {
      store = await Store.findOne({ storeId }, { verificationDetails: 0 });
    }
    if (!store) {
      Logger.error('<Service>:<EmployeeService>:< store id not found>');
      throw new Error('Store not found');
    }
    let newEmp: IEmployee = employeePayload;
    newEmp = await Employee.create(newEmp);
    Logger.info('<Service>:<EmployeeService>:<Employee created successfully>');
    return newEmp;
  }

  async getEmployeesByStoreId(storeId: string): Promise<IEmployee> {
    Logger.info(
      '<Service>:<EmployeeService>: <Product Fetch: getting all the employees by store id>'
    );

    const employees: IEmployee = await Employee.find({ storeId }).lean();
    Logger.info('<Service>:<ProductService>:<Product fetched successfully>');
    return employees;
  }
}
