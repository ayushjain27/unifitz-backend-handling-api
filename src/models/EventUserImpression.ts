import { Document, model, Schema } from 'mongoose';

export interface IEventImpression extends Document {
  _id?: string;
  eventId?: string;
  eventName?: string;
  userId: string;
  userName: string;
  email: string;
  phoneNumber: string;
  eventType: string;
}

const eventUserImpressionSchema: Schema = new Schema<IEventImpression>(
  {
    eventId: {
      type: String
    },
    eventName: {
      type: String
    },
    userId: {
      type: String
    },
    userName: {
      type: String
    },
    email: {
      type: String
    },
    phoneNumber: {
      type: String
    },
    eventType: {
      type: String
    }
  },
  { timestamps: true }
);

// eventUserImpressionSchema.index({ geoLocation: '2dsphere' });

const EventImpressionModel = model<IEventImpression & Document>(
  'eventimpressions',
  eventUserImpressionSchema
);

export default EventImpressionModel;
