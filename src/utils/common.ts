/* eslint-disable @typescript-eslint/no-var-requires */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const FCM = require('fcm-node');
const nodemailer = require('nodemailer');
require('dotenv').config();

export function appendCodeToPhone(phoneNumber: string) {
  return `+91${phoneNumber?.slice(-10)}`;
}

import { serverkey } from '../config/constants';
import User, { IUser } from '../models/User';
import Admin, { IDeviceFcm } from '../models/DeviceFcm';
import _ from 'lodash';
