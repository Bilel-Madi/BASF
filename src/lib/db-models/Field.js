import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  crop_type: String,
  soil_type: String,
  size_hectares: Number,
  assigned_devices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
  location: {
    type: { type: String, enum: ['Point', 'Polygon', 'LineString'], default: 'Polygon' },
    coordinates: [],
  },
});

fieldSchema.index({ location: '2dsphere' });

export default mongoose.models.Field || mongoose.model('Field', fieldSchema, 'Fields');
