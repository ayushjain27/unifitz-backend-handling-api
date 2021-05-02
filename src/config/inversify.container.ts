import 'reflect-metadata';
import { Container } from 'inversify';
import { Twilio } from 'twilio';
import AWS from 'aws-sdk';

import { TYPES } from './inversify.types';
import { TwilioService, S3Service } from '../services';
import { s3Config, twilioConfig } from './constants';
import { StoreController } from '../controllers';
import { StoreService } from '../services/store.service';

const container = new Container();

container
  .bind<TwilioService>(TYPES.TwilioService)
  .to(TwilioService)
  .inSingletonScope();
container
  .bind<Twilio>(TYPES.Twilio)
  .toConstantValue(new Twilio(twilioConfig.ACC_ID, twilioConfig.AUTH_TOKEN));

container.bind<S3Service>(TYPES.S3Service).to(S3Service).inSingletonScope();
container.bind<AWS.S3>(TYPES.S3Client).toConstantValue(
  new AWS.S3({
    credentials: {
      accessKeyId: s3Config.AWS_KEY_ID,
      secretAccessKey: s3Config.ACCESS_KEY
    }
  })
);

container.bind<StoreService>(TYPES.StoreService).to(StoreService);
container.bind<StoreController>(TYPES.StoreController).to(StoreController);

export default container;
