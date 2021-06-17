"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBAC_MAP = void 0;
const rbac_enum_1 = require("../enum/rbac.enum");
/* eslint-disable */
exports.RBAC_MAP = {
    admin: [rbac_enum_1.ACL.STORE_CREATE, rbac_enum_1.ACL.STORE_GET_ALL, rbac_enum_1.ACL.STORE_GET_SINGLE],
    store_owner: [rbac_enum_1.ACL.STORE_CREATE, rbac_enum_1.ACL.STORE_GET_OWNER, rbac_enum_1.ACL.STORE_GET_SINGLE],
    user: [rbac_enum_1.ACL.STORE_GET_ALL, rbac_enum_1.ACL.STORE_REVIEW_CREATE, rbac_enum_1.ACL.STORE_GET_SINGLE]
};
//# sourceMappingURL=rbac-mapping.js.map