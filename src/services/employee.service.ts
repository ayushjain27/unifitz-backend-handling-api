import { injectable } from 'inversify';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Store, { IStore } from '../models/Store';
import { S3Service } from './s3.service';
import { Employee, EmployeeStatus, IEmployee } from '../models/Employee';
import { TwoFactorService } from './twoFactor.service';
import { Types } from 'mongoose';
import _, { isEmpty } from 'lodash';
import { permissions } from '../config/permissions';

@injectable()
export class EmployeeService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private twoFactorService = container.get<TwoFactorService>(
    TYPES.TwoFactorService
  );

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
      Logger.error('<Service>:<EmployeeService>:< Store id not found>');
      throw new Error('Store not found');
    }
    let newEmp: IEmployee = employeePayload;
    newEmp.storeId = store?.storeId;
    if (
      !isEmpty(employeePayload?.leavingDate) &&
      new Date(employeePayload?.leavingDate) <= new Date()
    ) {
      newEmp.status = 'INACTIVE'; // Set status to INACTIVE
    }
    newEmp.accessList = permissions.PARTNER_EMPLOYEE;
    newEmp = await Employee.create(newEmp);
    Logger.info('<Service>:<EmployeeService>:<Employee created successfully>');
    return newEmp;
  }

  async updateEmployeeImage(employeeId: string, req: Request | any) {
    Logger.info('<Service>:<CustomerService>:<Customer image uploading>');
    const employee: IEmployee = await Employee.findOne({
      _id: new Types.ObjectId(employeeId)
    })?.lean();
    if (_.isEmpty(employee)) {
      throw new Error('employee does not exist');
    }
    const file: any = req.file;

    let profilePhoto: any = employee.profilePhoto || '';

    if (!file) {
      throw new Error('Files not found');
    }

    const fileName = 'profile';
    const { url } = await this.s3Client.uploadFile(
      employeeId,
      fileName,
      file.buffer
    );
    profilePhoto = url;

    const res = await Employee.findOneAndUpdate(
      { _id: employeeId },
      { $set: { profilePhoto } },
      { returnDocument: 'after' }
    );
    return res;
  }

  async getEmployeesByStoreId(storeId: string): Promise<IEmployee[]> {
    Logger.info(
      '<Service>:<EmployeeService>: <Employee Fetch: getting all the employees by store id>'
    );

    const employees: IEmployee[] = await Employee.find({
      storeId,
      status: 'ACTIVE'
    }).lean();
    Logger.info('<Service>:<EmployeeService>:<Employee fetched successfully>');
    return employees;
  }

  async getEmployeeByPhoneNumber(phoneNumber: string): Promise<IEmployee> {
    Logger.info(
      '<Service>:<EmployeeService>: <Employee Fetch: getting the employee by phone number>'
    );
    const employee: IEmployee = await Employee.findOne({
      phoneNumber: phoneNumber?.slice(-10),
      status: EmployeeStatus.ACTIVE
    }).lean();
    Logger.info('<Service>:<EmployeeService>:<Employee fetched successfully>');
    return employee;
  }

  async update(
    employeeId: string,
    employeePayload: IEmployee
  ): Promise<IEmployee> {
    Logger.info(
      '<Service>:<EmployeeService>: <Employee onboarding: creating new employee>'
    );
    if (
      !isEmpty(employeePayload?.leavingDate) &&
      new Date(employeePayload?.leavingDate) <= new Date()
    ) {
      employeePayload.status = 'INACTIVE'; // Set status to INACTIVE
    }
    await Employee.findOneAndUpdate(
      {
        _id: new Types.ObjectId(employeeId)
      },
      employeePayload
    );
    const updatedEmployeePayload = Employee.findById(
      new Types.ObjectId(employeeId)
    );
    Logger.info('<Service>:<EmployeeService>:<Employee updated successfully>');
    return updatedEmployeePayload;
  }

  async getEmployeesByEmployeeId(
    storeId: string,
    employeeId: string
  ): Promise<IEmployee> {
    Logger.info(
      '<Service>:<EmployeeService>: <Employee Fetch: getting all the employees by store id>'
    );
    let employee: IEmployee = await Employee.findOne({ storeId }).lean();
    if (_.isEmpty(employee)) {
      throw new Error('Store Id not exists');
    }
    employee = await Employee.findOne({
      _id: new Types.ObjectId(employeeId)
    }).lean();
    Logger.info('<Service>:<EmployeeService>:<Employee fetched successfully>');
    return employee;
  }

  async getEmployeeDetailByPhoneNumber(phoneNumber: string): Promise<any> {
    Logger.info(
      '<Service>:<EmployeeService>: <Employee Fetch: getting employee details by phonenumber>'
    );
    const newPhoneNumber = `${phoneNumber.slice(-10)}`;
    const employee: IEmployee = await Employee.findOne({
      phoneNumber: newPhoneNumber,
      status: 'ACTIVE'
    }).lean();
    if (isEmpty(employee)) {
      throw new Error('Employee not exists');
    }
    Logger.info('<Service>:<EmployeeService>:<Employee fetched successfully>');
    return employee;
  }
}
