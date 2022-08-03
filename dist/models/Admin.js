"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const adminSchema = new mongoose_1.Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        index: { unique: true }
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['ADMIN'],
        default: 'ADMIN'
    }
}, { timestamps: true });
const Admin = (0, mongoose_1.model)('admin_user', adminSchema);
exports.default = Admin;
//# sourceMappingURL=Admin.js.map