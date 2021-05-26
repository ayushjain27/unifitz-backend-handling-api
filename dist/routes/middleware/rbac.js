"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleAuth = void 0;
const config_1 = __importDefault(require("config"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const winston_1 = __importDefault(require("../../config/winston"));
const rbac_mapping_1 = require("../../config/rbac-mapping");
const roleAuth = (credentials) => {
    return (req, res, next) => {
        winston_1.default.info('RBAC middleware');
        // Allow for a string OR array
        if (typeof credentials === 'string') {
            credentials = [credentials];
        }
        const token = req.headers['authorization'];
        if (!token) {
            return res
                .status(http_status_codes_1.default.UNAUTHORIZED)
                .json({ msg: 'No token, authorization denied' });
        }
        const tokenBody = token.slice(7);
        try {
            /* eslint-disable */
            const decoded = jsonwebtoken_1.default.verify(tokenBody, config_1.default.get('JWT_SECRET'));
            if (credentials.length > 0) {
                const getUserACL = rbac_mapping_1.RBAC_MAP[decoded.role.toLowerCase()];
                if (getUserACL &&
                    getUserACL.length > 0 &&
                    credentials.some((cred) => getUserACL.includes(cred))) {
                    next();
                }
                else {
                    return res.status(401).send('Error: Access Denied');
                }
            }
            else {
                // No credentials required, user is authorized
                next();
            }
        }
        catch (err) {
            res
                .status(http_status_codes_1.default.UNAUTHORIZED)
                .json({ msg: 'Token is not valid' });
        }
    };
};
exports.roleAuth = roleAuth;
//# sourceMappingURL=rbac.js.map