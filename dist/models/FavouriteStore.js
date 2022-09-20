"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const favouriteStoreSchema = new mongoose_1.Schema({
    storeId: {
        type: String,
        required: true
    },
    customerId: {
        type: mongoose_1.Types.ObjectId,
        required: true
    },
    isFavourite: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
const FavouriteStore = (0, mongoose_1.model)('favouriteStore', favouriteStoreSchema);
exports.default = FavouriteStore;
//# sourceMappingURL=FavouriteStore.js.map