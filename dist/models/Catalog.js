"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const catalogSchema = new mongoose_1.Schema({
    catalogName: {
        type: String,
        required: true
    },
    displayOrder: {
        type: Number
    },
    tree: {
        type: String,
        required: true
    },
    parent: {
        type: String,
        required: true
    },
    catalogType: {
        type: String,
        required: true
    },
    catalogIcon: {
        type: String,
        required: false
    }
}, { timestamps: true });
const Catalog = (0, mongoose_1.model)('catalog', catalogSchema);
exports.default = Catalog;
//# sourceMappingURL=Catalog.js.map