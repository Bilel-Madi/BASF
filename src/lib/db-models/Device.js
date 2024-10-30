// models/Device.js
import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  device_id: { type: String, unique: true, required: true }, // dev_eui
  model_name: String,       // e.g., "Soil Moisture Sensor Model X"
  assigned_number: Number,  // e.g., 1, 2, 3
  name: String,             // Optional friendly name
  picture_url: String,      // URL to device picture
  location: {
    coordinates: [Number],  // [longitude, latitude]
  },
  installed_date: Date,     // Date when the device was installed
  installed_depth: Number,  // For soil moisture sensors (e.g., depth in cm)
  field: String,            // Name of the field, zone, or greenhouse
  battery_status: Number,   // Latest battery status
  last_seen: Date,          // Timestamp of the last data received
  latest_rssi: Number,      // Latest RSSI value
  latest_snr: Number,       // Latest SNR value
});

export default mongoose.models.Device || mongoose.model('Device', deviceSchema, 'Devices');
