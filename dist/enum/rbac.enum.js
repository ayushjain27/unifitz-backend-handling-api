"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACL = void 0;
var ACL;
(function (ACL) {
    ACL["STORE_CREATE"] = "store:write";
    ACL["STORE_GET_ALL"] = "store:read_all";
    ACL["STORE_GET_OWNER"] = "store:read_owner";
    ACL["STORE_GET_SINGLE"] = "store:read_single";
    ACL["STORE_REVIEW_CREATE"] = "store_review:create";
    ACL["CUSTOMER_CREATE"] = "customer:create";
    ACL["FILE_UPLOAD"] = "file:upload";
    ACL["CUSTOMER_GET_ALL"] = "customer:get_all";
})(ACL = exports.ACL || (exports.ACL = {}));
//# sourceMappingURL=rbac.enum.js.map