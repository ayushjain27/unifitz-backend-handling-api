"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testUsers = exports.twoFactorConfig = exports.s3Config = exports.twilioConfig = exports.defaultCodeLength = void 0;
const config_1 = __importDefault(require("config"));
exports.defaultCodeLength = 4;
exports.twilioConfig = {
    ACC_ID: config_1.default.get('ACCOUNT_SID'),
    AUTH_TOKEN: config_1.default.get('AUTH_TOKEN'),
    SERVICE_ID: config_1.default.get('SERVICE_ID')
};
exports.s3Config = {
    AWS_KEY_ID: config_1.default.get('AWS_KEY_ID'),
    ACCESS_KEY: config_1.default.get('ACCESS_KEY'),
    BUCKET_NAME: config_1.default.get('BUCKET_NAME')
};
exports.twoFactorConfig = {
    URL: config_1.default.get('2FACTOR_API_URL'),
    API_KEY: config_1.default.get('2FACTOR_API_KEY'),
    TEMPLATE_NAME: config_1.default.get('2FACTOR_TEMPLATE_NAME')
};
exports.testUsers = [
    { phoneNo: '7777777777', role: 'STORE_OWNER', otp: '7777' },
    { phoneNo: '9999999999', role: 'USER', otp: '9999' }
];
//# sourceMappingURL=constants.js.map