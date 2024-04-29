import { injectable } from 'inversify';
import { Types } from 'mongoose';
import Logger from '../config/winston';
import { firebaseAdmin } from '../config/firebase-config';
import { messaging } from 'firebase-admin';
import { App } from 'firebase-admin/app';
const FCM =  require('fcm-node');
// import Customer, { ICustomer } from './../models/Customer';

@injectable()
export class NotificationService {
  // async sendNotification(params: any): Promise<any> {
  //   Logger.info(
  //     '<Service>:<NotificationService>: <Sending notification: sending notfication to user>'
  //   );
  //   const registrationToken = params.fcmToken;
  //   const payload = params.payload;
  //   const options = {
  //     priority: 'high',
  //     timeToLive: 60 * 60 * 24
  //   };
  //   try {
  //     const response = await messaging(firebaseAdmin as App | any).sendToDevice(
  //       registrationToken,
  //       payload,
  //       options
  //     );
  //     return response;
  //   } catch (err) {
  //     throw new Error(err);
  //   }
  // }

  async sendNotification(params: any): Promise<any> {
    Logger.info(
      '<Service>:<NotificationService>: <Sending notification: sending notfication to user>'
    );
    var serverKey = "AAAAw_xRwT0:APA91bHRGVoe2i4Mnu-2D6ixCDXm9E68WNmYu9SFhx_tsmhgZkOSLr7GWKTOnLnw4pbRAgWLkyaoRLs2dD6LBVI2PvVCHTEkKWl3PQnOFrXkh1DE0ihwcalXx2K9-bm64oINV5xVA2Fz"
    var fcm = new FCM(serverKey)

    const message = {
      notification: {
        title: 'Notification Title',
        body: 'Notification Body'
      },
      to: "cLIql8NDTAK89jFH7EXCbY:APA91bH7sS08IU4YmwUjomh3Ld8BinH35UZ0p61hIxFWzKTlszs53tChJL43KECg7Zo4kRF2Z-YNh6f2NycfMLRbmVPXYdv_WT38y-ydwsVwUKzps3OP1XUK219qNg5R7Gs-ldW3h6Gs"
    }
    
    // const registrationToken = params.fcmToken;
    // const payload = params.payload;
    // const options = {
    //   priority: 'high',
    //   timeToLive: 60 * 60 * 24
    // };
    try {
      // const response = await messaging(firebaseAdmin as App | any).sendToDevice(
      //   registrationToken,
      //   payload,
      //   options
      // );
      // return response;
      fcm.send(message, function(err: any, response: any){
        if(err){
          console.log("Error", err)
        }else{
          console.log("Response", response);
        }
      })
    } catch (err) {
      throw new Error(err);
    }
  }
}
