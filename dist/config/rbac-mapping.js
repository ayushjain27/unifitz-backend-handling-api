"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBAC_MAP = void 0;
const rbac_enum_1 = require("../enum/rbac.enum");
/* eslint-disable */
exports.RBAC_MAP = {
    admin: [rbac_enum_1.ACL.STORE_CREATE],
    store_owner: [rbac_enum_1.ACL.STORE_CREATE],
    user: [rbac_enum_1.ACL.STORE_GET]
};
//# sourceMappingURL=rbac-mapping.js.map