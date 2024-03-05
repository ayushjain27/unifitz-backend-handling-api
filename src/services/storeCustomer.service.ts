import { injectable } from 'inversify';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Store, { IStore } from '../models/Store';
import { S3Service } from './s3.service';
import { Employee, IEmployee } from '../models/Employee';
import { Types } from 'mongoose';
import _ from 'lodash';
import StoreCustomer, { IStoreCustomer, IStoreCustomerVehicleInfo } from '../models/StoreCustomer';

@injectable()
export class StoreCustomerService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async create(storeCustomerPayload: IStoreCustomer): Promise<IStoreCustomer> {
    Logger.info(
      '<Service>:<StoreCustomerService>: <Store Customer Creation: creating/updating store customer>'
    );
    try {
        const { phoneNumber, storeId } = storeCustomerPayload;

        // Search for an existing document based on phoneNumber and storeId
        const existingCustomer = await StoreCustomer.findOne({ phoneNumber: phoneNumber, storeId: storeId });

        if (existingCustomer) {
            // Update the existing document
            const updatedCustomer = await StoreCustomer.findOneAndUpdate(
                { phoneNumber: phoneNumber, storeId: storeId },
                storeCustomerPayload,
                { new: true }
            );

            Logger.info('<Service>:<StoreCustomerService>:<Store Customer updated successfully>');
            return updatedCustomer;
        } else {
            // Create a new document
            const newCustomer = await StoreCustomer.create(storeCustomerPayload);
            Logger.info('<Service>:<StoreCustomerService>:<New Store Customer created successfully>');
            return newCustomer;
        }
    } catch (err) {
        Logger.error(err.message);
        throw err; // Rethrow the error to propagate it to the caller
    }
}


//   async updateEmployeeImage(employeeId: string, req: Request | any) {
//     Logger.info('<Service>:<CustomerService>:<Customer image uploading>');
//     const employee: IEmployee = await Employee.findOne({
//       _id: new Types.ObjectId(employeeId)
//     })?.lean();
//     if (_.isEmpty(employee)) {
//       throw new Error('employee does not exist');
//     }
//     const file: any = req.file;

//     let profilePhoto: any = employee.profilePhoto || '';

//     if (!file) {
//       throw new Error('Files not found');
//     }

//     const fileName = 'profile';
//     const { url } = await this.s3Client.uploadFile(
//       employeeId,
//       fileName,
//       file.buffer
//     );
//     profilePhoto = url;

//     const res = await Employee.findOneAndUpdate(
//       { _id: employeeId },
//       { $set: { profilePhoto } },
//       { returnDocument: 'after' }
//     );
//     return res;
//   }

  async getStoreCustomerByStoreId(storeId: string): Promise<IStoreCustomer[]> {
    Logger.info(
      '<Service>:<StoreCustomerService>: <Store Customer Fetch: getting all the store customers by store id>'
    );

    const storeCustomers: IStoreCustomer[] = await StoreCustomer.find({ storeId }).lean();
    Logger.info('<Service>:<StoreCustomerService>:<Store Customer fetched successfully>');
    return storeCustomers;
  }

  async getStoreCustomerByPhoneNumber(phoneNumber: string): Promise<IStoreCustomer> {
    Logger.info(
      '<Service>:<StoreCustomerService>: <Store Customer Fetch: getting all the store customers by store id>'
    );

    const storeCustomers: IStoreCustomer = await StoreCustomer.find({ phoneNumber }).lean();
    Logger.info('<Service>:<StoreCustomerService>:<Store Customer fetched successfully>');
    return storeCustomers;
  }

  async createStoreCustomerVehicle(
    storeVehicleId: string,
    storeCustomerVehiclePayload: IStoreCustomerVehicleInfo
  ) {
    Logger.info(
      '<Service>:<StoreCustomerService>: <Vehicle Creation: creating new store customer vehicle>'
    );
    const storeCustomer: IStoreCustomer = await StoreCustomer.findOne({ _id: new Types.ObjectId(storeVehicleId)})?.lean();
    if (_.isEmpty(storeCustomer)) {
      throw new Error('Customer does not exist');
    }
    const storeCustomerVehicle: IStoreCustomerVehicleInfo = storeCustomerVehiclePayload;
    const res = await StoreCustomer.findOneAndUpdate(
      { _id: storeVehicleId },
      { $push: { storeCustomerVehicleInfo: storeCustomerVehicle } },
      { returnDocument: 'after' }
    );
    Logger.info('<Service>:<StoreCustomerService>:<Customer created successfully>');
    return res;
  }

//   async update(
//     employeeId: string,
//     employeePayload: IEmployee
//   ): Promise<IEmployee> {
//     Logger.info(
//       '<Service>:<EmployeeService>: <Employee onboarding: creating new employee>'
//     );
//     await Employee.findOneAndUpdate(
//       {
//         _id: new Types.ObjectId(employeeId)
//       },
//       employeePayload
//     );
//     const updatedEmployeePayload = Employee.findById(
//       new Types.ObjectId(employeeId)
//     );
//     Logger.info('<Service>:<EmployeeService>:<Employee updated successfully>');
//     return updatedEmployeePayload;
//   }

//   async getEmployeesByEmployeeId(
//     storeId: string,
//     employeeId: string
//   ): Promise<IEmployee> {
//     Logger.info(
//       '<Service>:<EmployeeService>: <Employee Fetch: getting all the employees by store id>'
//     );
//     let employee: IEmployee = await Employee.findOne({ storeId }).lean();
//     if (_.isEmpty(employee)) {
//       throw new Error('Store Id not exists');
//     }
//     employee = await Employee.findOne({ _id: new Types.ObjectId(employeeId) }).lean();
//     Logger.info('<Service>:<EmployeeService>:<Employee fetched successfully>');
//     return employee;
//   }
}

