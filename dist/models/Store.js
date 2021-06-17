"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const storeCatalogMapSchema = new mongoose_1.Schema({
    _id: {
        type: mongoose_1.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true
    }
});
const storeBasicInfoSchema = new mongoose_1.Schema({
    nameSalutation: {
        type: String,
        required: true
    },
    ownerName: {
        type: String,
        required: true
    },
    businessName: {
        type: String,
        required: true
    },
    registrationDate: {
        type: Date,
        required: true
    },
    brand: {
        type: storeCatalogMapSchema,
        required: true
    },
    category: {
        type: storeCatalogMapSchema,
        required: true
    },
    subCategory: {
        type: storeCatalogMapSchema,
        required: true
    }
}, {
    _id: false
});
const storeContactSchema = new mongoose_1.Schema({
    country: {
        type: {
            callingCode: String,
            countryCode: String
        }
    },
    phoneNumber: {
        type: { primary: String, secondary: String }
    },
    email: {
        type: String
    },
    address: {
        type: String
    },
    geoLocation: {
        type: {
            kind: String,
            coordinates: { longitude: String, latitude: String }
        }
    },
    state: {
        type: String
    },
    city: {
        type: String
    },
    pincode: {
        type: String
    }
}, {
    _id: false
});
const storeTimingSchema = new mongoose_1.Schema({
    openTime: {
        type: Date
    },
    closeTime: {
        type: Date
    }
}, { _id: false });
const storeDocumentsSchema = new mongoose_1.Schema({
    storeDocuments: {
        type: {
            primary: { key: String, docURL: String },
            secondary: { key: String, docURL: String }
        }
    },
    storeImages: {
        type: {
            primary: { key: String, docURL: String },
            secondary: { key: String, docURL: String }
        }
    }
}, {
    _id: false
});
const storeSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Types.ObjectId,
        required: true
    },
    storeId: {
        type: String,
        required: true,
        unique: true
    },
    profileStatus: {
        type: String,
        required: true,
        enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'],
        default: 'DRAFT'
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    basicInfo: {
        type: storeBasicInfoSchema
    },
    contactInfo: {
        type: storeContactSchema
    },
    storeTiming: {
        type: storeTimingSchema
    },
    documents: {
        type: storeDocumentsSchema
    }
}, { timestamps: true });
const Store = mongoose_1.model('stores', storeSchema);
exports.default = Store;
//# sourceMappingURL=Store.js.map