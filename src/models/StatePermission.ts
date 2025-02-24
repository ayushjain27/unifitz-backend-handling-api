const mongoose = require("mongoose");

export interface IStatePermission {
    moduleName?: string;
    allowedStates?: string[];
}

const statePermissionSchema = new mongoose.Schema({
  moduleName: { type: String, required: true }, // Module name for permission
  allowedStates: [{ type: String, required: true }], // List of states allowed to access the module
});

const StatePermission = mongoose.model("statePermission", statePermissionSchema);

export default StatePermission; 
