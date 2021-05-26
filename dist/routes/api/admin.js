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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const Admin_1 = __importDefault(require("../../models/Admin"));
const winston_1 = __importDefault(require("../../config/winston"));
const utils_1 = require("../../utils");
const router = express_1.Router();
// @route   POST api/admin
// @desc    Register admin given their userName and password, returns the token upon successful registration
// @access  Private
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = express_validator_1.validationResult(req);
    if (!errors.isEmpty()) {
        return res
            .status(http_status_codes_1.default.BAD_REQUEST)
            .json({ errors: errors.array() });
    }
    const { userName, password } = req.body;
    try {
        let admin = yield Admin_1.default.findOne({ userName });
        if (admin) {
            return res.status(http_status_codes_1.default.BAD_REQUEST).json({
                errors: [
                    {
                        msg: 'Admin already exists'
                    }
                ]
            });
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashed = yield bcryptjs_1.default.hash(password, salt);
        // Build user object based on IAdmin
        const adminFields = {
            userName,
            password: hashed
        };
        admin = new Admin_1.default(adminFields);
        yield admin.save();
        const payload = {
            userId: admin.userName,
            role: admin.role
        };
        const token = yield utils_1.generateToken(payload);
        res.json({
            message: 'Admin Creation Successful',
            token
        });
    }
    catch (err) {
        winston_1.default.error(err.message);
        res.status(http_status_codes_1.default.INTERNAL_SERVER_ERROR).send('Server Error');
    }
}));
exports.default = router;
//# sourceMappingURL=admin.js.map