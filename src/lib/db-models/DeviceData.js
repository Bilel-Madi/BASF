import mongoose from 'mongoose';

const deviceDataSchema = new mongoose.Schema({
    received_at: Date,
    device_id: { type: String, index: true },  // Existing index on device_id
    ec: { type: Number, index: true },        // Indexing the ec field
    temperature: { type: String, index: true }, // Indexing the temperature field
    moisture: { type: String, index: true }    // Indexing the moisture field
}, { timestamps: true });

// Adding a compound index
deviceDataSchema.index({ device_id: 1, received_at: -1 });

export default mongoose.models.DeviceData || mongoose.model('DeviceData', deviceDataSchema, 'm2mdatas');
