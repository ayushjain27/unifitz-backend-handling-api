import 'reflect-metadata';
import { Container } from 'inversify';
import { Twilio } from 'twilio';
import { SQSClient } from '@aws-sdk/client-sqs';
import { S3Client } from '@aws-sdk/client-s3';

import { TYPES } from './inversify.types';
import { s3Config, sqsConfig, twilioConfig } from './constants';
import {
  StoreController,
  AdminController,
  CustomerController,
  NotificationController,
  ProductController,
  JobCardController,
  AdvertisementController,
  FavouriteStoreController,
  VehicleInfoController,
  EnquiryController,
  CategoryController,
  BuySellController,
  EmployeeController,
  AnalyticController,
  ReportController,
  EventController,
  OfferController,
  BusinessController,
  SchoolOfAutoController,
  StoreCustomerController,
  CreateInvoiceController,
  NewVehicleInfoController,
  SPEmployeeController,
  DeleteAccountController,
  StoreLeadController,
  OrderManagementController,
  SmcInsuranceController
} from '../controllers';
import {
  StoreService,
  AdminService,
  CustomerService,
  NotificationService,
  ProductService,
  JobCardService,
  AdvertisementService,
  FavouriteStoreService,
  VehicleInfoService,
  TwoFactorService,
  EnquiryService,
  SurepassService,
  CategoryService,
  EmployeeService,
  TwilioService,
  S3Service,
  SQSService,
  BuySellService,
  AnalyticService,
  ReportService,
  EventService,
  OfferService,
  BusinessService,
  SchoolOfAutoService,
  StoreCustomerService,
  CreateInvoiceService,
  NewVehicleInfoService,
  SPEmployeeService,
  DeleteAccountService,
  UserService,
  StoreLeadService,
  OrderManagementService,
  SmcInsuranceService
} from '../services';

const container = new Container();

container
  .bind<TwilioService>(TYPES.TwilioService)
  .to(TwilioService)
  .inSingletonScope();
container
  .bind<Twilio>(TYPES.Twilio)
  .toConstantValue(new Twilio(twilioConfig.ACC_ID, twilioConfig.AUTH_TOKEN));

container.bind<S3Service>(TYPES.S3Service).to(S3Service).inSingletonScope();
container.bind<S3Client>(TYPES.S3Client).toConstantValue(
  new S3Client({
    region: s3Config.AWS_REGION,
    credentials: {
      accessKeyId: s3Config.AWS_KEY_ID,
      secretAccessKey: s3Config.ACCESS_KEY
    }
  })
);
container.bind<SQSService>(TYPES.SQSService).to(SQSService).inSingletonScope();
container.bind<SQSClient>(TYPES.SQSClient).toConstantValue(
  new SQSClient({
    region: sqsConfig.AWS_REGION,
    credentials: {
      accessKeyId: sqsConfig.AWS_KEY_ID,
      secretAccessKey: sqsConfig.ACCESS_KEY
    }
  })
);

container.bind<StoreService>(TYPES.StoreService).to(StoreService);
container.bind<StoreController>(TYPES.StoreController).to(StoreController);

container.bind<AdminService>(TYPES.AdminService).to(AdminService);
container.bind<AdminController>(TYPES.AdminController).to(AdminController);

container.bind<CustomerService>(TYPES.CustomerService).to(CustomerService);
container
  .bind<CustomerController>(TYPES.CustomerController)
  .to(CustomerController);

container
  .bind<NotificationController>(TYPES.NotificationController)
  .to(NotificationController);

container
  .bind<NotificationService>(TYPES.NotificationService)
  .to(NotificationService);

container
  .bind<ProductController>(TYPES.ProductController)
  .to(ProductController);

container.bind<ProductService>(TYPES.ProductService).to(ProductService);

container
  .bind<EmployeeController>(TYPES.EmployeeController)
  .to(EmployeeController);

container.bind<EmployeeService>(TYPES.EmployeeService).to(EmployeeService);

container
  .bind<JobCardController>(TYPES.JobCardController)
  .to(JobCardController);

container.bind<JobCardService>(TYPES.JobCardService).to(JobCardService);

container
  .bind<AdvertisementController>(TYPES.AdvertisementController)
  .to(AdvertisementController);
container
  .bind<AdvertisementService>(TYPES.AdvertisementService)
  .to(AdvertisementService);

container
  .bind<FavouriteStoreController>(TYPES.FavouriteStoreController)
  .to(FavouriteStoreController);

container
  .bind<FavouriteStoreService>(TYPES.FavouriteStoreService)
  .to(FavouriteStoreService);

container
  .bind<VehicleInfoController>(TYPES.VehicleInfoController)
  .to(VehicleInfoController);

container
  .bind<VehicleInfoService>(TYPES.VehicleInfoService)
  .to(VehicleInfoService);

container
  .bind<EnquiryController>(TYPES.EnquiryController)
  .to(EnquiryController);

container.bind<EnquiryService>(TYPES.EnquiryService).to(EnquiryService);

container
  .bind<AnalyticController>(TYPES.AnalyticController)
  .to(AnalyticController);
container.bind<AnalyticService>(TYPES.AnalyticService).to(AnalyticService);

container
  .bind<CategoryController>(TYPES.CategoryController)
  .to(CategoryController);

container.bind<CategoryService>(TYPES.CategoryService).to(CategoryService);
container.bind<TwoFactorService>(TYPES.TwoFactorService).to(TwoFactorService);

container.bind<SurepassService>(TYPES.SurepassService).to(SurepassService);

container
  .bind<BuySellController>(TYPES.BuySellController)
  .to(BuySellController);

container.bind<BuySellService>(TYPES.BuySellService).to(BuySellService);

container.bind<ReportController>(TYPES.ReportController).to(ReportController);

container.bind<ReportService>(TYPES.ReportService).to(ReportService);

container.bind<EventController>(TYPES.EventController).to(EventController);
container.bind<EventService>(TYPES.EventService).to(EventService);

container.bind<OfferController>(TYPES.OfferController).to(OfferController);
container.bind<OfferService>(TYPES.OfferService).to(OfferService);

container
  .bind<StoreCustomerController>(TYPES.StoreCustomerController)
  .to(StoreCustomerController);
container
  .bind<StoreCustomerService>(TYPES.StoreCustomerService)
  .to(StoreCustomerService);

container
  .bind<BusinessController>(TYPES.BusinessController)
  .to(BusinessController);
container.bind<BusinessService>(TYPES.BusinessService).to(BusinessService);

container
  .bind<SchoolOfAutoController>(TYPES.SchoolOfAutoController)
  .to(SchoolOfAutoController);
container
  .bind<SchoolOfAutoService>(TYPES.SchoolOfAutoService)
  .to(SchoolOfAutoService);

container
  .bind<CreateInvoiceController>(TYPES.CreateInvoiceController)
  .to(CreateInvoiceController);

container
  .bind<CreateInvoiceService>(TYPES.CreateInvoiceService)
  .to(CreateInvoiceService);

container
  .bind<NewVehicleInfoController>(TYPES.NewVehicleInfoContoller)
  .to(NewVehicleInfoController);

container
  .bind<NewVehicleInfoService>(TYPES.NewVehicleInfoService)
  .to(NewVehicleInfoService);

container
  .bind<SPEmployeeController>(TYPES.SPEmployeeController)
  .to(SPEmployeeController);

container
  .bind<SPEmployeeService>(TYPES.SPEmployeeService)
  .to(SPEmployeeService);

container
  .bind<DeleteAccountController>(TYPES.DeleteAccountController)
  .to(DeleteAccountController);

container
  .bind<DeleteAccountService>(TYPES.DeleteAccountService)
  .to(DeleteAccountService);

container.bind<UserService>(TYPES.UserService).to(UserService);

container.bind<StoreLeadService>(TYPES.StoreLeadService).to(StoreLeadService);
container
  .bind<StoreLeadController>(TYPES.StoreLeadController)
  .to(StoreLeadController);

container
  .bind<OrderManagementService>(TYPES.OrderManagementService)
  .to(OrderManagementService);
container
  .bind<OrderManagementController>(TYPES.OrderManagementController)
  .to(OrderManagementController);

container
  .bind<SmcInsuranceService>(TYPES.SmcInsuranceService)
  .to(SmcInsuranceService);
container
  .bind<SmcInsuranceController>(TYPES.SmcInsuranceController)
  .to(SmcInsuranceController);

export default container;
