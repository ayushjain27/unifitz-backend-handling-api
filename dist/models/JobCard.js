"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobStatus = exports.FuelPoints = exports.OwnerType = exports.FuelType = void 0;
const mongoose_1 = require("mongoose");
var FuelType;
(function (FuelType) {
    FuelType["CNG"] = "cng";
    FuelType["DIESEL"] = "diesel";
    FuelType["PETROL"] = "petrol";
    FuelType["EV"] = "ev";
})(FuelType = exports.FuelType || (exports.FuelType = {}));
var OwnerType;
(function (OwnerType) {
    OwnerType["FIRST"] = "first";
    OwnerType["SECOND"] = "second";
    OwnerType["THIRD"] = "third";
    OwnerType["FOURTH_AND_ABOVE"] = "fourth and above";
})(OwnerType = exports.OwnerType || (exports.OwnerType = {}));
var FuelPoints;
(function (FuelPoints) {
    FuelPoints["ONE"] = "1 (25%)";
    FuelPoints["TWO"] = "2 (55%)";
    FuelPoints["THREE"] = "3 (75%)";
    FuelPoints["FOUR"] = "4 (100%)";
})(FuelPoints = exports.FuelPoints || (exports.FuelPoints = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["CREATED"] = "CREATED";
    JobStatus["ONGOING"] = "ONGOING";
    JobStatus["COMPLETED"] = "COMPLETED";
    JobStatus["DELIVERED"] = "DELIVERED";
    JobStatus["PENDING"] = "PENDING";
    JobStatus["CANCELLED"] = "CANCELLED";
})(JobStatus = exports.JobStatus || (exports.JobStatus = {}));
const jobCardSchema = new mongoose_1.Schema({
    storeId: {
        type: String,
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: String,
        required: true
    },
    billingAddress: {
        type: String
    },
    vehicleType: {
        type: String
    },
    brand: {
        type: String
    },
    modelName: {
        type: String
    },
    fuelType: {
        type: String,
        enum: FuelType
    },
    totalKmsRun: {
        type: String
    },
    vehicleNumber: {
        type: String
    },
    ownerType: {
        type: String,
        enum: OwnerType
    },
    mechanic: {
        type: String
    },
    registrationYear: {
        type: String
    },
    fuelPoints: {
        type: String,
        enum: FuelPoints
    },
    lineItems: {
        type: [
            {
                item: mongoose_1.Types.ObjectId,
                description: String,
                quantity: Number,
                rate: Number
            }
        ]
    },
    refImageList: {
        type: [
            {
                key: String,
                docURL: String
            }
        ]
    },
    jobStatus: {
        type: String,
        enum: JobStatus,
        default: JobStatus.CREATED,
        required: true
    },
    comment: {
        type: String
    }
}, { timestamps: true });
const JobCard = (0, mongoose_1.model)('jobCard', jobCardSchema);
exports.default = JobCard;
//# sourceMappingURL=JobCard.js.map