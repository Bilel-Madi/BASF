// models/Field.js
import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
  name: String,
  crop_type: String,
  size_hectares: Number,
  location: {
    type: { type: String, default: 'Polygon' },
    coordinates: [[[Number]]], // GeoJSON format
  },
  devices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
}, { timestamps: true });

fieldSchema.index({ location: '2dsphere' });

export default mongoose.models.Field || mongoose.model('Field', fieldSchema);
