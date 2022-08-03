"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    phoneNumber: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['STORE_OWNER', 'USER'],
        default: 'STORE_OWNER'
    },
    deviceId: {
        type: String
    }
}, { timestamps: true });
userSchema.index({ phoneNumber: 1, role: 1 }, { unique: true });
const User = (0, mongoose_1.model)('users', userSchema);
exports.default = User;
//# sourceMappingURL=User.js.map