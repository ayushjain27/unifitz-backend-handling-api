import { injectable } from 'inversify';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Store, { IStore } from '../models/Store';
import { S3Service } from './s3.service';
import { Employee, IEmployee } from '../models/Employee';
import { Types } from 'mongoose';
import _ from 'lodash';
import { StaticIds, IStaticIds } from '../models/StaticId';

@injectable()
export class StaticIdService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async create(staticIdPayload: IStaticIds): Promise<IStaticIds> {
    Logger.info(
      '<Service>:<StaticIdService>: <Static Id Creation: creating new static id>'
    );

    let newStaticId: IStaticIds = staticIdPayload;
    newStaticId = await StaticIds.create(newStaticId);
    Logger.info('<Service>:<StaticIdService>:<static Id created successfully>');
    return newStaticId;
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

//   async getEmployeesByStoreId(storeId: string): Promise<IEmployee[]> {
//     Logger.info(
//       '<Service>:<EmployeeService>: <Employee Fetch: getting all the employees by store id>'
//     );

//     const employees: IEmployee[] = await Employee.find({ storeId }).lean();
//     Logger.info('<Service>:<EmployeeService>:<Employee fetched successfully>');
//     return employees;
//   }

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
