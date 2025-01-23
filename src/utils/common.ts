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

// export async function sendNotification(
//   title: any,
//   body: any,
//   phoneNumber: any,
//   role: any,
//   type: any
// ) {
//   const ownerDetails: IUser = await User.findOne({
//     phoneNumber,
//     role
//   });

//   const fcmToken: IDeviceFcm = await Admin.findOne({
//     deviceId: ownerDetails?.deviceId,
//     role
//   });

//   console.log(fcmToken, 'dfkmel');

//   const serverKey = serverkey;
//   const fcm = new FCM(serverKey);

//   let message = {};
//   if (!_.isEmpty(fcmToken)) {
//     message = {
//       notification: {
//         title,
//         body
//       },
//       data: {
//         type
//       },
//       to: fcmToken.fcmToken
//     };
//     try {
//       fcm.send(message, function (err: any, response: any) {
//         if (err) {
//           console.log('Error', err);
//         } else {
//           console.log('Response', response);
//         }
//       });
//       // return res.MessageId; // Return the MessageId if needed
//     } catch (error) {
//       console.error('Error sending email:', error);
//       // throw error; // Rethrow the error to handle it at the caller's level
//     }
//   } else {
//     console.log('Fcm Token is required');
//   }
// }
