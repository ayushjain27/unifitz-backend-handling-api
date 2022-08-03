"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferType = void 0;
const mongoose_1 = require("mongoose");
var OfferType;
(function (OfferType) {
    OfferType["PRODUCT"] = "product";
    OfferType["SERVICE"] = "service";
})(OfferType = exports.OfferType || (exports.OfferType = {}));
const productSchema = new mongoose_1.Schema({
    storeId: {
        type: String,
        required: true
    },
    offerType: {
        type: String,
        enum: OfferType,
        required: true
    },
    itemName: {
        type: String,
        required: true
    },
    unit: {
        type: String
    },
    sellingPrice: {
        type: Number
    },
    supplierName: {
        type: String
    },
    purchasePrice: {
        type: Number
    },
    purchaseDate: {
        type: Date
    },
    refImage: {
        type: {
            key: String,
            docURL: String
        }
    }
}, { timestamps: true });
const Product = (0, mongoose_1.model)('product', productSchema);
exports.default = Product;
//# sourceMappingURL=Product.js.map