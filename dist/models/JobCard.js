"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuelPoints = exports.OwnerType = exports.FuelType = void 0;
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
const jobCardSchema = new mongoose_1.Schema({}, { timestamps: true });
const JobCard = mongoose_1.model('jobCard', jobCardSchema);
exports.default = JobCard;
//# sourceMappingURL=JobCard.js.map