// models/DeviceData.js
import mongoose from 'mongoose';

const deviceDataSchema = new mongoose.Schema({
  received_at: Date,
  device_id: { type: String, index: true },
  ec: { type: Number, index: true },
  temperature: { type: Number, index: true },
  moisture: { type: Number, index: true },
  battery: { type: Number, index: true }, // Added battery field
}, { timestamps: true });

deviceDataSchema.index({ device_id: 1, received_at: -1 });

export default mongoose.models.DeviceData || mongoose.model('DeviceData', deviceDataSchema, 'Soil');
