import { Response, Router } from 'express';
import HttpStatusCodes from 'http-status-codes';

import Request from '../../types/request';
import { defaultCodeLength } from '../../config/constants';
import Logger from '../../config/winston';
import { TwilioLoginPayload, TwilioVerifyPayload } from '../../interfaces';
import auth from '../middleware/auth';
import User, { IUser } from '../../models/User';
import DeviceFcm, { IDeviceFcm } from '../../models/DeviceFcm';
import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { generateToken } from '../../utils';
import { TwilioService } from '../../services/twilio.service';

const router: Router = Router();
const twilioCLient = container.get<TwilioService>(TYPES.TwilioService);
// @route   GET user/auth
// @desc    Get authenticated user given the token
// @access  Private
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const user: IUser = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (err) {
    Logger.error(err.message);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send('Server Error');
  }
});

// @route   GET user/otp/send
// @desc    Send otp
// @access  Public
router.post('/otp/send', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, channel } = req.body;
    const loginPayload: TwilioLoginPayload = {
      phoneNumber,
      channel
    };
    if (loginPayload.phoneNumber) {
      const result = await twilioCLient.sendVerificationCode(
        loginPayload.phoneNumber,
        loginPayload.channel
      );
      res.status(HttpStatusCodes.OK).send({
        message: 'Verification is sent!!',
        phoneNumber,
        result
      });
      Logger.debug(`Twilio verification sent to ${loginPayload.phoneNumber}`);
    } else {
      res.status(HttpStatusCodes.BAD_REQUEST).send({
        message: 'Invalid phone number :(',
        phoneNumber
      });
    }
  } catch (err) {
    Logger.error(err.message);
    res
      .status(HttpStatusCodes.SERVICE_UNAVAILABLE)
      .send('Twilio Service Error');
  }
});

/**
 * @route   GET /user/otp/login
 * @desc    Verify otp
 * @access  Private
 */
router.post('/otp/login', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, code, role, deviceId } = req.body;
    const verifyPayload: TwilioVerifyPayload = {
      phoneNumber,
      code
    };
    if (
      verifyPayload.phoneNumber &&
      verifyPayload.code.length === defaultCodeLength
    ) {
      const { phoneNumber } = verifyPayload;
      const result = await twilioCLient.verifyCode(
        phoneNumber,
        verifyPayload.code
      );
      if (!result) {
        res.status(HttpStatusCodes.BAD_REQUEST).send({
          message: 'Invalid verification code :(',
          phoneNumber
        });
      }
      Logger.debug(`Twilio verification completed for ${phoneNumber}`);
      const user: IUser = await User.findOne({ phoneNumber: phoneNumber });
      let userId: string;
      if (!user) {
        Logger.debug(`User registration started for ${phoneNumber}`);
        // Build user object based on IUser
        const userFields = {
          phoneNumber,
          deviceId
        };

        const newUser = await User.create(userFields);

        // await newUser.save();
        userId = newUser._id;
      } else {
        userId = user._id;
      }
      const payload = {
        userId: phoneNumber,
        role: role
      };
      const token = await generateToken(payload);
      res.status(HttpStatusCodes.OK).send({
        message: 'Login Successful',
        token,
        userId
      });
    } else {
      res.status(HttpStatusCodes.BAD_REQUEST).send({
        message: 'Invalid phone number or verification code :(',
        phoneNumber
      });
    }
  } catch (err) {
    Logger.error(err.message);
    res
      .status(HttpStatusCodes.SERVICE_UNAVAILABLE)
      .send('Twilio Service Error');
  }
});

/**
 * @route   POST /user/fcmToken
 * @desc    Store FCM Token
 * @access  Private
 */
router.post('/fcmToken', async (req: Request, res: Response) => {
  try {
    const { deviceId, fcmToken } = req.body;
    Logger.debug(
      `Storing FCM token into database for  ${deviceId} - ${fcmToken}`
    );

    if (deviceId && fcmToken) {
      const deviceFcmRecord: IDeviceFcm = await DeviceFcm.findOne({ deviceId });
      if (!deviceFcmRecord) {
        await DeviceFcm.create({ deviceId, fcmToken });
      }
    }
  } catch (err) {
    Logger.error(err.message);
    res
      .status(HttpStatusCodes.SERVICE_UNAVAILABLE)
      .send('Twilio Service Error');
  }
});

export default router;
