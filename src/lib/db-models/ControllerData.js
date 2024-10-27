import mongoose from 'mongoose';

// Define the schema for controller data
const controllerDataSchema = new mongoose.Schema({
    received_at: { type: Date, default: Date.now }, // Automatically set to the current date if not provided
    device_id: { type: String, required: true },
    valve_1: { type: String, required: true },
    battery: { type: Number, default: null } // Add battery field
}, {
    timestamps: true // Automatically adds createdAt and updatedAt timestamps
});

// Create and export the model
// The collection name will be automatically inferred as 'controllerdatas' unless explicitly provided as the third argument
const ControllerData = mongoose.model('ControllerData', controllerDataSchema,'ArddataControllers');

export default ControllerData;