"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrap = void 0;
/* eslint-disable */
const wrap = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};
exports.wrap = wrap;
//# sourceMappingURL=wrap.js.map