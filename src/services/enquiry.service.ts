import { injectable } from 'inversify';
import Enquiry, { IEnquiry } from '../models/Enquiry';
import Logger from '../config/winston';
import { Types } from 'mongoose';

@injectable()
export class EnquiryService {
  async create(enquiryPayload: IEnquiry): Promise<IEnquiry> {
    Logger.info(
      '<Service>:<EnquiryService>: <Enquiry Creation: creating new enquiry>'
    );

    let newEnquiry: IEnquiry = enquiryPayload;

    newEnquiry = await Enquiry.create(newEnquiry);
    Logger.info('<Service>:<EnquiryService>:<Enquiry created successfully>');
    return newEnquiry;
  }

  async getAll(): Promise<IEnquiry[]> {
    const result: IEnquiry[] = await Enquiry.find({}).lean();

    return result;
  }

  async getById(id: string): Promise<IEnquiry> {
    Logger.info(
      '<Service>:<EnquiryService>: <Enquiry Fetch: Get Enquiry by Enquiry id>'
    );
    const result: IEnquiry = await Enquiry.findOne({
      _id: new Types.ObjectId(id)
    }).lean();
    return result;
  }

  async update(payload: IEnquiry, id: string): Promise<IEnquiry> {
    Logger.info(
      '<Service>:<EnquiryService>: <Enquiry Update: updating Enquiry>'
    );

    let updatedRes: IEnquiry = payload;

    updatedRes = await Enquiry.findOneAndUpdate(
      { _id: new Types.ObjectId(id) },
      updatedRes,
      { returnDocument: 'after' }
    );
    Logger.info('<Service>:<EnquiryService>:<Enquiry updated successfully>');
    return updatedRes;
  }

  async delete(id: string): Promise<unknown> {
    Logger.info(
      '<Service>:<EnquiryService>: <Enquiry Delete: deleting Enquiry by Enquiry id>'
    );
    const res = await Enquiry.deleteMany({
      _id: new Types.ObjectId(id)
    });
    Logger.info(
      '<Service>:<EnquiryService>: <Enquiry Delete: Enquiry Deleted Successfully>'
    );
    return res;
  }
}
