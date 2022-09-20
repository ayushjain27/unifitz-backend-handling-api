"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BannerStatus = void 0;
const mongoose_1 = require("mongoose");
var BannerStatus;
(function (BannerStatus) {
    BannerStatus["ACTIVE"] = "ACTIVE";
    BannerStatus["DISABLED"] = "DISABLED";
})(BannerStatus = exports.BannerStatus || (exports.BannerStatus = {}));
const bannerSchema = new mongoose_1.Schema({
    url: {
        type: String
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    altText: {
        type: String
    },
    slugUrl: {
        type: String
    },
    status: {
        type: String,
        enum: BannerStatus,
        default: BannerStatus.ACTIVE
    }
}, { timestamps: true });
const Banner = (0, mongoose_1.model)('banner', bannerSchema);
exports.default = Banner;
//# sourceMappingURL=Banner.js.map