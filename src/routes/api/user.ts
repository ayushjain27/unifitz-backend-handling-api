import { Response, Router } from 'express';
import HttpStatusCodes from 'http-status-codes';
import _ from 'lodash';
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
import { TwoFactorService } from '../../services/twoFactor.service';
import { testUsers } from '../../config/constants';
import { UserService } from '../../services';
import { roleAuth } from '../middleware/rbac';
import { ACL } from '../../enum/rbac.enum';

const router: Router = Router();
const twilioCLient = container.get<TwilioService>(TYPES.TwilioService);
const twoFactorService = container.get<TwoFactorService>(
  TYPES.TwoFactorService
);

const userService = container.get<UserService>(
  TYPES.UserService
);
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
      const testUser = getTestUser(loginPayload.phoneNumber);
      if (testUser) {
        res.status(HttpStatusCodes.OK).send({
          message: 'Verification is sent!!',
          phoneNumber
        });
      } else {
        // const result = await twilioCLient.sendVerificationCode(
        //   loginPayload.phoneNumber,
        //   loginPayload.channel
        // );
        const result = await twoFactorService.sendVerificationCode(
          loginPayload.phoneNumber
        );
        res.status(HttpStatusCodes.OK).send({
          message: 'Verification is sent!!',
          phoneNumber,
          result
        });
      }
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

      // Check if the phone number starts with 3, 4, or 5 and the OTP is 6543
      const startsWith = ['3', '4', '5'];
      const isMatchingCondition = startsWith.includes(phoneNumber.charAt(3)) && code === '6543';

      if (isMatchingCondition) {
        // Phone number starts with 3, 4, or 5, and OTP is 6543, proceed with login
        const userFields = {
          phoneNumber,
          deviceId,
          role
        };

        const newUser = await User.findOneAndUpdate(
          { phoneNumber, role },
          userFields,
          { upsert: true, new: true }
        );

        const userId = newUser._id;
        const payload = {
          userId: phoneNumber,
          role: role
        };

        const token = await generateToken(payload);
        return res.status(HttpStatusCodes.OK).send({
          message: 'Login Successful',
          token,
          userId
        });
      } 

      // Check for test users
      const testUser = getTestUser(phoneNumber);
      if (testUser) {
        const isMatch = testUser?.otp === verifyPayload.code;
        if (!isMatch) {
          return res.status(HttpStatusCodes.BAD_REQUEST).send({
            message: 'Invalid verification code :(',
            phoneNumber
          });
        }
      } else {
        // Call the two-factor service if not a test user
        const result = await twoFactorService.verifyCode(
          phoneNumber,
          verifyPayload.code
        );
        if (!result || result?.Status === 'Error') {
          return res.status(HttpStatusCodes.BAD_REQUEST).send({
            message: 'Invalid verification code :(',
            phoneNumber
          });
        }
      }

      // Proceed with user creation if OTP is valid
      Logger.debug(`Twilio verification completed for ${phoneNumber}`);
      Logger.debug(`User registration started for ${phoneNumber}`);

      const userFields = {
        phoneNumber,
        deviceId,
        role
      };

      const newUser = await User.findOneAndUpdate(
        { phoneNumber, role },
        userFields,
        { upsert: true, new: true }
      );

      const userId = newUser._id;
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
    const { deviceId, fcmToken, role } = req.body;
    Logger.debug(
      `Storing FCM token into database for  ${deviceId} - ${fcmToken}`
    );

    if (deviceId && fcmToken) {
      const deviceFcm = await DeviceFcm.findOneAndUpdate(
        { deviceId, role },
        { deviceId, fcmToken, role },
        { upsert: true, new: true }
      );
      res.status(HttpStatusCodes.OK).send({
        message: 'Token Saved successfully',
        ...deviceFcm
      });
    }
  } catch (err) {
    Logger.error(err.message);
    res
      .status(HttpStatusCodes.SERVICE_UNAVAILABLE)
      .send('Twilio Service Error');
  }
});

const getTestUser = (phoneNumber: string) => {
  const testUser = _.find(
    testUsers,
    (user) => `+91${user?.phoneNo}` === phoneNumber
  );
  return testUser;
};

router.get(
  '/getUserByPhoneNumber',
  roleAuth(ACL.CUSTOMER_CREATE),
  async (req, res) => {
 
    try {
      const userPayload = req.body;
      Logger.info('<Router>:<UserService>:<User creation initiated>');

      const result = await userService.getUserByPhoneNumber(userPayload);
      res.json({
        message: 'User obtained successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  }
);

export default router;
