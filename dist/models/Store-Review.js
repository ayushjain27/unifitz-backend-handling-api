"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const storeReviewSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        unique: true
    },
    storeId: {
        type: String,
        required: true
    },
    review: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true
    }
}, { timestamps: true });
const StoreReview = mongoose_1.model('store-reviews', storeReviewSchema);
exports.default = StoreReview;
//# sourceMappingURL=Store-Review.js.map