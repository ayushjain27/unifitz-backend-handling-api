"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const constants_1 = require("../../config/constants");
const winston_1 = __importDefault(require("../../config/winston"));
const auth_1 = __importDefault(require("../middleware/auth"));
const User_1 = __importDefault(require("../../models/User"));
const DeviceFcm_1 = __importDefault(require("../../models/DeviceFcm"));
const inversify_container_1 = __importDefault(require("../../config/inversify.container"));
const inversify_types_1 = require("../../config/inversify.types");
const utils_1 = require("../../utils");
const router = express_1.Router();
const twilioCLient = inversify_container_1.default.get(inversify_types_1.TYPES.TwilioService);
// @route   GET user/auth
// @desc    Get authenticated user given the token
// @access  Private
router.get('/', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findById(req.userId).select('-password');
        res.json(user);
    }
    catch (err) {
        winston_1.default.error(err.message);
        res.status(http_status_codes_1.default.INTERNAL_SERVER_ERROR).send('Server Error');
    }
}));
// @route   GET user/otp/send
// @desc    Send otp
// @access  Public
router.post('/otp/send', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phoneNumber, channel } = req.body;
        const loginPayload = {
            phoneNumber,
            channel
        };
        if (loginPayload.phoneNumber) {
            const result = yield twilioCLient.sendVerificationCode(loginPayload.phoneNumber, loginPayload.channel);
            res.status(http_status_codes_1.default.OK).send({
                message: 'Verification is sent!!',
                phoneNumber,
                result
            });
            winston_1.default.debug(`Twilio verification sent to ${loginPayload.phoneNumber}`);
        }
        else {
            res.status(http_status_codes_1.default.BAD_REQUEST).send({
                message: 'Invalid phone number :(',
                phoneNumber
            });
        }
    }
    catch (err) {
        winston_1.default.error(err.message);
        res
            .status(http_status_codes_1.default.SERVICE_UNAVAILABLE)
            .send('Twilio Service Error');
    }
}));
/**
 * @route   GET /user/otp/login
 * @desc    Verify otp
 * @access  Private
 */
router.post('/otp/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phoneNumber, code, role, deviceId } = req.body;
        const verifyPayload = {
            phoneNumber,
            code
        };
        if (verifyPayload.phoneNumber &&
            verifyPayload.code.length === constants_1.defaultCodeLength) {
            const { phoneNumber } = verifyPayload;
            const result = yield twilioCLient.verifyCode(phoneNumber, verifyPayload.code);
            if (!result) {
                res.status(http_status_codes_1.default.BAD_REQUEST).send({
                    message: 'Invalid verification code :(',
                    phoneNumber
                });
            }
            winston_1.default.debug(`Twilio verification completed for ${phoneNumber}`);
            winston_1.default.debug(`User registration started for ${phoneNumber}`);
            // Build user object based on IUser
            const userFields = {
                phoneNumber,
                deviceId,
                role
            };
            const newUser = yield User_1.default.findOneAndUpdate({ phoneNumber, role }, userFields, { upsert: true, new: true });
            // await newUser.save();
            const userId = newUser._id;
            const payload = {
                userId: phoneNumber,
                role: role
            };
            const token = yield utils_1.generateToken(payload);
            res.status(http_status_codes_1.default.OK).send({
                message: 'Login Successful',
                token,
                userId
            });
        }
        else {
            res.status(http_status_codes_1.default.BAD_REQUEST).send({
                message: 'Invalid phone number or verification code :(',
                phoneNumber
            });
        }
    }
    catch (err) {
        winston_1.default.error(err.message);
        res
            .status(http_status_codes_1.default.SERVICE_UNAVAILABLE)
            .send('Twilio Service Error');
    }
}));
/**
 * @route   POST /user/fcmToken
 * @desc    Store FCM Token
 * @access  Private
 */
router.post('/fcmToken', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { deviceId, fcmToken, role } = req.body;
        winston_1.default.debug(`Storing FCM token into database for  ${deviceId} - ${fcmToken}`);
        if (deviceId && fcmToken) {
            const deviceFcm = yield DeviceFcm_1.default.findOneAndUpdate({ deviceId, role }, { deviceId, fcmToken, role }, { upsert: true, new: true });
            res.status(http_status_codes_1.default.OK).send(Object.assign({ message: 'Token Saved successfully' }, deviceFcm));
        }
    }
    catch (err) {
        winston_1.default.error(err.message);
        res
            .status(http_status_codes_1.default.SERVICE_UNAVAILABLE)
            .send('Twilio Service Error');
    }
}));
exports.default = router;
//# sourceMappingURL=user.js.map