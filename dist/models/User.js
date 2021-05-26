"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        index: { unique: true }
    },
    role: {
        type: String,
        required: true,
        enum: ['STORE_OWNER'],
        default: 'STORE_OWNER'
    }
}, { timestamps: true });
const User = mongoose_1.model('users', userSchema);
exports.default = User;
//# sourceMappingURL=User.js.map