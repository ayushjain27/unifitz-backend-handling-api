"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuelType = exports.VehicleType = exports.VehicleGearType = exports.VehiclePurposeType = void 0;
const mongoose_1 = require("mongoose");
var VehiclePurposeType;
(function (VehiclePurposeType) {
    VehiclePurposeType["BUY_SELL"] = "BUY_SELL";
    VehiclePurposeType["OWNED"] = "OWNED";
})(VehiclePurposeType = exports.VehiclePurposeType || (exports.VehiclePurposeType = {}));
var VehicleGearType;
(function (VehicleGearType) {
    VehicleGearType["MANUAL"] = "MANUAL";
    VehicleGearType["AUTOMATIC"] = "AUTOMATIC";
})(VehicleGearType = exports.VehicleGearType || (exports.VehicleGearType = {}));
var VehicleType;
(function (VehicleType) {
    VehicleType["CYCLE"] = "CYCLE";
    VehicleType["TWO_WHEELER"] = "TWO_WHEELER";
    VehicleType["THREE_WHEELER"] = "THREE_WHEELER";
    VehicleType["FOUR_WHEELER"] = "FOUR_WHEELER";
    VehicleType["COMMERCIAL_VEHICLE"] = "COMMERCIAL_VEHICLE";
})(VehicleType = exports.VehicleType || (exports.VehicleType = {}));
var FuelType;
(function (FuelType) {
    FuelType["DISEL"] = "DISEL";
    FuelType["PETROL"] = "PETROL";
    FuelType["EV"] = "EV";
    FuelType["CNG"] = "CNG";
    FuelType["LPG"] = "LPG";
})(FuelType = exports.FuelType || (exports.FuelType = {}));
const vehicleImageSchema = new mongoose_1.Schema({
    url: {
        type: String
    },
    key: {
        type: String
    },
    title: {
        type: String
    }
});
const vehicleInfoSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Types.ObjectId,
        required: true
    },
    vehicleType: {
        type: String,
        enum: VehicleType
    },
    vehicleImageList: {
        type: [vehicleImageSchema]
    },
    vehicleNumber: {
        type: String
    },
    category: {
        type: String
    },
    brand: {
        type: String
    },
    modelName: {
        type: String
    },
    fuel: {
        type: String
    },
    manufactureYear: {
        type: String
    },
    ownership: {
        type: String
    },
    gearType: {
        type: String,
        enum: VehicleGearType
    },
    purpose: {
        type: String,
        enum: VehiclePurposeType,
        required: true
    },
    fuelType: {
        type: String
    },
    kmsDriven: {
        type: String
    },
    lastInsuanceDate: {
        type: Date
    },
    lastServiceDate: {
        type: Date
    }
}, {
    strict: false
});
const VechicleInfo = (0, mongoose_1.model)('vehicles', vehicleInfoSchema);
exports.default = VechicleInfo;
//# sourceMappingURL=Vehicle.js.map