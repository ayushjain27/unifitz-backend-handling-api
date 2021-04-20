import 'reflect-metadata';
import { Container } from 'inversify';
import { Twilio } from 'twilio';
import { TYPES } from './inversify.types';
import { TwilioService } from '../services/twilio-service';
import { twilioConfig } from './constants';

const container = new Container();

container
  .bind<TwilioService>(TYPES.TwilioService)
  .to(TwilioService)
  .inSingletonScope();
container
  .bind<Twilio>(TYPES.Twilio)
  .toConstantValue(new Twilio(twilioConfig.ACC_ID, twilioConfig.AUTH_TOKEN));

export default container;
