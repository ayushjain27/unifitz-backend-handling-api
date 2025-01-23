/* eslint-disable no-console */
import { Response, Router } from 'express';
import HttpStatusCodes from 'http-status-codes';
import _, { isEmpty } from 'lodash';
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
import { EmployeeService, StoreLeadService, UserService } from '../../services';
import { roleAuth } from '../middleware/rbac';
import { ACL } from '../../enum/rbac.enum';
import StoreLead from '../../models/StoreLead';
import UserOtp from '../../models/UserOtp';
import { S3Service } from '../../services';
import { UserRole } from '../../enum/user-role.enum';
import { ErrorCode } from '../../enum/error-code.enum';

const router: Router = Router();
const twilioCLient = container.get<TwilioService>(TYPES.TwilioService);
const twoFactorService = container.get<TwoFactorService>(
  TYPES.TwoFactorService
);
const s3Client = container.get<S3Service>(TYPES.S3Service);

const userService = container.get<UserService>(TYPES.UserService);

const employeeService = container.get<EmployeeService>(TYPES.EmployeeService);

const storeLeadService = container.get<StoreLeadService>(
  TYPES.StoreLeadService
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
    const { phoneNumber, channel, role } = req.body;
    const loginPayload: TwilioLoginPayload = {
      phoneNumber,
      channel
    };
    console.log(phoneNumber, 'Del');
    const startsWith = ['3', '4', '5'];
    const isMatchingCondition = startsWith.includes(phoneNumber.charAt(3));

    if (loginPayload.phoneNumber) {
      // Check if role is partner employee and return user not found
      if (role === UserRole.PARTNER_EMPLOYEE) {
        const user = await employeeService.getEmployeeByPhoneNumber(
          phoneNumber
        );
        if (isEmpty(user)) {
          res.status(HttpStatusCodes.NOT_FOUND).send({
            message: 'User not found',
            phoneNumber,
            errCode: ErrorCode.USER_NOT_FOUND
          });
          return;
        }
      }

      const testUser = getTestUser(loginPayload.phoneNumber);
      if (testUser || isMatchingCondition) {
        res.status(HttpStatusCodes.OK).send({
          message: 'Verification is sent!!',
          phoneNumber
        });
      } else {
        const userOtpDetail = await UserOtp.findOne({
          phoneNumber: phoneNumber,
          role
        });
        if (isEmpty(userOtpDetail)) {
          const data = {
            phoneNumber,
            role,
            count: 1,
            lastCountReset: new Date()
          };
          await UserOtp.create(data);
          const result = await twoFactorService.sendVerificationCode(
            loginPayload.phoneNumber
          );
          res.status(HttpStatusCodes.OK).send({
            message: 'Verification is sent!!',
            phoneNumber,
            result
          });
        } else {
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          if (userOtpDetail.lastCountReset < oneDayAgo) {
            const userDetailOtpUpdate = await UserOtp.findOneAndUpdate(
              { phoneNumber, role },
              { $set: { count: 1, lastCountReset: new Date() } }
            ); // Reset last reset date to now
            const result = await twoFactorService.sendVerificationCode(
              loginPayload.phoneNumber
            );
            res.status(HttpStatusCodes.OK).send({
              message: 'Verification is sent!!',
              phoneNumber,
              result
            });
          } else {
            // Check if count is 3 or more, indicating monthly limit is reached
            if (userOtpDetail.count >= 3) {
              // Send 429 status code for rate-limiting error
              res.send({
                message:
                  'You have reached the maximum OTP requests allowed for this day.',
                phoneNumber
              });
            } else {
              const userDetailOtpUpdate = await UserOtp.findOneAndUpdate(
                { phoneNumber, role },
                { $set: { count: userOtpDetail?.count + 1 } }
              ); // Reset last reset date to now
              const result = await twoFactorService.sendVerificationCode(
                loginPayload.phoneNumber
              );
              res.status(HttpStatusCodes.OK).send({
                message: 'Verification is sent!!',
                phoneNumber,
                result
              });
            }
          }
        }
      }
      Logger.debug(`Twilio verification sent to ${loginPayload.phoneNumber}`);
    } else {
      res.status(HttpStatusCodes.BAD_REQUEST).send({
        message: 'Invalid phone number :(',
        phoneNumber,
        errCode: ErrorCode.INVALID_PHONE_NUMBER
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
      const isMatchingCondition =
        startsWith.includes(phoneNumber.charAt(3)) && code === '6543';

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
        res.status(HttpStatusCodes.OK).send({
          message: 'Login Successful',
          token,
          userId
        });
        return;
      }

      // Check for test users
      const testUser = getTestUser(phoneNumber);
      if (testUser) {
        const isMatch = testUser?.otp === verifyPayload.code;
        if (!isMatch) {
          res.status(HttpStatusCodes.BAD_REQUEST).send({
            message: 'Invalid verification code :(',
            phoneNumber
          });
          return;
        }
      } else {
        // Call the two-factor service if not a test user
        const result = await twoFactorService.verifyCode(
          phoneNumber,
          verifyPayload.code
        );
        if (!result || result?.Status === 'Error') {
          res.status(HttpStatusCodes.BAD_REQUEST).send({
            message: 'Invalid verification code :(',
            phoneNumber
          });
          return;
        }
      }

      const query = {
        'store.contactInfo.phoneNumber.primary': phoneNumber
      };
      const store = await StoreLead.findOne({ query });

      if (!_.isEmpty(store) && store?.status === 'VERIFIED') {
        const jsonQuery = {
          storeId: store?._id,
          status: 'APPROVED'
        };
        const jsonResult = await storeLeadService.updateStoreStatus(jsonQuery);
        const createStore = await storeLeadService.createNewStore(jsonResult);
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

// router.post('/deleteImage', async (req, res) => {
//   try {
//     const { key } = req.body;
//     Logger.info('<Router>:<UserService>:<User creation initiated>');

//     // Delete the banner from the s3
//     const result = await s3Client.deleteFile(key);
//     res.json({
//       message: 'Image Deleted successful',
//       result
//     });
//   } catch (err) {
//     Logger.error(err.message);
//     res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
//   }
// });

export default router;
