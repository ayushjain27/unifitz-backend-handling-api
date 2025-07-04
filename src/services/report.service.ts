/* eslint-disable no-console */
import { injectable } from 'inversify';
import _ from 'lodash';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Store, { IStore } from '../models/Store';
import { S3Service } from './s3.service';
import Report, { INotesSchema, IReport } from '../models/Report';
import Customer, { ICustomer } from './../models/Customer';
import { AdminRole } from '../models/Admin';

@injectable()
export class ReportService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async create(reportPayload: IReport): Promise<IReport> {
    Logger.info(
      '<Service>:<ReportService>: <Report Creation: creating new report>'
    );

    // check if store id exist
    const { storeId, customerId } = reportPayload;
    let store: IStore;
    if (storeId) {
      store = await Store.findOne({ storeId }, { verificationDetails: 0 });
    }
    if (!store) {
      Logger.error('<Service>:<ProductService>:< store id not found>');
      throw new Error('Store not found');
    }
    let customer: ICustomer;
    if (customerId) {
      customer = await Customer.findOne({
        _id: new Types.ObjectId(customerId)
      });
    }
    if (!customerId) {
      throw new Error('Customer not found');
    }
    let newRep: IReport = reportPayload;
    newRep.storeName = store?.basicInfo?.businessName || '';
    newRep.storePhoneNumber = store?.contactInfo?.phoneNumber?.primary || '';
    newRep.oemUserName = store?.oemUserName || '';
    newRep.customerName = customer?.fullName || '';
    newRep.customerPhoneNumber = customer?.phoneNumber || '';
    newRep = await Report.create(newRep);
    Logger.info('<Service>:<ReportService>:<Report created successfully>');
    return newRep;
  }

  async update(reportPayload: IReport, reportId: string): Promise<IReport> {
    Logger.info('<Service>:<ReportService>: <Report Update: updating report>');
    // check if store id exist
    const { storeId, customerId } = reportPayload;
    let store: IStore;
    let customer: ICustomer;
    let report: IReport;
    if (reportId) {
      report = await Report.findOne({
        _id: new Types.ObjectId(reportId)
      });
    }
    if (!report) {
      Logger.error(
        '<Service>:<ReportService>:<Report not found with that report Id>'
      );
      throw new Error('Store not found');
    }
    if (storeId) {
      store = await Store.findOne({ storeId }, { verificationDetails: 0 });
    }
    if (!store) {
      Logger.error('<Service>:<ReportService>:<Store not found>');
      throw new Error('Store not found');
    }

    if (customerId) {
      customer = await Customer.findOne({
        _id: new Types.ObjectId(customerId)
      });
    }
    if (!customerId) {
      throw new Error('Customer not found');
    }

    let updatedReport: IReport = reportPayload;

    updatedReport = await Report.findOneAndUpdate(
      { _id: new Types.ObjectId(reportId) },
      updatedReport,
      { returnDocument: 'after' }
    );
    Logger.info('<Service>:<ReportService>:<Report updated successfully>');
    return updatedReport;
  }

  async getAll(
    userName?: string,
    role?: string,
    oemId?: string
  ): Promise<IReport[]> {
    const query: any = {};

    if (role === AdminRole.OEM) {
      query.oemUserName = userName;
    }

    if (role === AdminRole.EMPLOYEE) {
      query.oemUserName = oemId;
    }

    if (oemId === 'SERVICEPLUG') {
      delete query['oemUserName'];
    }
    const report: IReport[] = await Report.find(query);

    return report;
  }

  async getReportByReportId(reportId: string): Promise<IReport> {
    Logger.info(
      '<Service>:<ReportService>: <Report Fetch: Get report by report id>'
    );
    const report: IReport = await Report.findOne({
      _id: new Types.ObjectId(reportId)
    });
    return report;
  }

  async createNotes(
    reportId: string,
    notesPayload: INotesSchema,
    userName?: string
  ) {
    Logger.info(
      '<Service>:<NotesService>: <Notes Creation: creating new notes>'
    );
    const report: IReport = await Report.findOne({
      _id: new Types.ObjectId(reportId)
    });
    if (_.isEmpty(report)) {
      throw new Error('Report does not exist');
    }
    const newNotes: INotesSchema = notesPayload;
    newNotes.name = userName || '';
    const res = await Report.findOneAndUpdate(
      { _id: reportId },
      { $push: { notes: newNotes } },
      { returnDocument: 'after' }
    );
    // newNotes = await Report.create(newNotes);
    Logger.info('<Service>:<ReportService>:<Report created successfully>');
    return res;
  }

  async updateStatus(reportId: string, statusRequest: any, userName?: string) {
    Logger.info('<Service>:<ReportService>:<Update Report status>');
    const report: IReport = await Report.findOne({
      _id: new Types.ObjectId(reportId)
    });
    if (_.isEmpty(report)) {
      throw new Error('Report does not exist');
    }
    const newNotes: INotesSchema = statusRequest;
    newNotes.name = userName || '';
    let res = '';
    if (statusRequest?.message === '') {
      res = await Report.findOneAndUpdate(
        { _id: reportId },
        {
          $set: {
            status: statusRequest.status
          }
        },
        { returnDocument: 'after' }
      );
    } else {
      res = await Report.findOneAndUpdate(
        { _id: reportId },
        {
          $set: {
            status: statusRequest.status
          },
          $push: { notes: newNotes }
        },
        { returnDocument: 'after' }
      );
    }
    Logger.info(
      '<Service>:<StoreService>: <Report: Report status updated successfully>'
    );
    return res;
  }
}
