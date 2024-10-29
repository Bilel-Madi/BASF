// models/Co2Data.js
import mongoose from 'mongoose';

const Co2DataSchema = new mongoose.Schema({
  received_at: { type: Date, index: true },
  device_id: { type: String, index: true },
  co2: { type: Number, index: true },
  humidity: { type: Number, index: true },
  pressure: { type: Number, index: true },
  temperature: { type: Number, index: true },
  battery: { type: Number, index: true }, // Added battery field
}, { timestamps: true });

Co2DataSchema.index({ device_id: 1, received_at: -1 });

export default mongoose.models.AirData || mongoose.model('Co2Data', Co2DataSchema, 'Air');
