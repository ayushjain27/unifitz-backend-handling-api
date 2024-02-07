import { Document, model, Schema } from 'mongoose';
import { ICatalogMap, storeCatalogMapSchema } from './Store';

export const eventDocumentSchema: Schema = new Schema<IEventImage>({
  docURL: {
    type: String
  },
  key: {
    type: String
  }
});

export enum EventProfileStatus {
  PARTNER = 'PARTNER',
  CUSTOMER = 'CUSTOMER'
}

export interface IEvent {
  _id?: string;
  eventName: string;
  organizerName: string;
  // url?: string;
  externalUrl?: string;
  // altText?: string;
  // slugUrl?: string;
  status?: string;
  geoLocation?: {
    type: string;
    coordinates: number[];
  };
  category?: ICatalogMap[];
  subCategory?: ICatalogMap[];
  eventImage?: IEventImage;
  startDate?: Date;
  endDate?: Date;
  state: string; //<String>
  city: string;
  phoneNumber: string;
  email: string;
  address: string;
  eventType: string;
}

export interface IEventImage {
  docURL: string;
  key: string;
}

export enum EventStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED'
}

const eventSchema: Schema = new Schema(
  {
    // url: {
    //   type: String
    // },
    eventName: {
      type: String
    },
    organizerName: {
      type: String
    },
    status: {
      type: String,
      enum: EventStatus,
      default: EventStatus.ACTIVE
    },
    geoLocation: {
      // kind: String,
      type: { type: String, default: 'Point' },
      coordinates: [{ type: Number }]
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    category: {
      type: [storeCatalogMapSchema],
      required: true
    },
    subCategory: {
      type: [storeCatalogMapSchema],
      required: false
    },
    eventImage: {
      type: eventDocumentSchema
    },
    state: {
      type: String
    },
    city: {
      type: String
    },
    phoneNumber: {
      type: String
    },
    email: {
      type: String
    },
    address: {
      type: String
    },
    externalUrl: {
      type: String
    },
    // altText: {
    //   type: String
    // },
    // slugUrl: {
    //   type: String
    // },
    eventType: {
      type: String,
      required: true,
      enum: EventProfileStatus
    }
  },
  { timestamps: true }
);

eventSchema.index({ geoLocation: '2dsphere' });

const EventModel = model<IEvent & Document>('event', eventSchema);

export default EventModel;
