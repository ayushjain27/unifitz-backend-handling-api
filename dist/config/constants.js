"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Config = exports.twilioConfig = exports.defaultCodeLength = void 0;
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
//# sourceMappingURL=constants.js.map