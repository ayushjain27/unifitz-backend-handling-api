"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const deviceFmcSchema = new mongoose_1.Schema({
    deviceId: {
        type: String,
        required: true,
        unique: true,
        index: { unique: true }
    },
    fcmToken: {
        type: String,
        required: true
    }
}, { timestamps: true });
const Admin = mongoose_1.model('device_fcm', deviceFmcSchema);
exports.default = Admin;
//# sourceMappingURL=DeviceFcm.js.map