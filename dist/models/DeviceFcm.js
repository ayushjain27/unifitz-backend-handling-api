"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const deviceFmcSchema = new mongoose_1.Schema({
    deviceId: {
        type: String,
        required: true
    },
    fcmToken: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['STORE_OWNER', 'USER'],
        default: 'STORE_OWNER'
    }
}, { timestamps: true });
deviceFmcSchema.index({ deviceId: 1, role: 1 }, { unique: true });
const Admin = mongoose_1.model('device_fcm', deviceFmcSchema);
exports.default = Admin;
//# sourceMappingURL=DeviceFcm.js.map