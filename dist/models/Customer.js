"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const customerVehicleInfoSchema = new mongoose_1.Schema({
    vehicleImage: {
        type: String
    },
    vehicleNumber: {
        type: String,
    },
    category: {
        type: String,
    },
    brand: {
        type: String,
    },
    model: {
        type: String,
    },
    fuel: {
        type: String
    },
    year: {
        type: String
    },
    ownership: {
        type: String
    }
}, {
    _id: false
});
const customerContactSchema = new mongoose_1.Schema({
    address: {
        type: String
    },
    state: {
        type: String,
        required: true
    },
    city: {
        type: String
    },
    pincode: {
        type: String,
        required: true
    }
}, {
    _id: false
});
const customerSchema = new mongoose_1.Schema({
    salutationName: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    profileImageUrl: {
        type: String
    },
    dob: {
        type: String,
        required: true
    },
    contactInfo: {
        type: customerContactSchema
    },
    vehiclesInfo: {
        type: [customerVehicleInfoSchema]
    }
}, { timestamps: true });
const Customer = mongoose_1.model('customers', customerSchema);
exports.default = Customer;
//# sourceMappingURL=Customer.js.map