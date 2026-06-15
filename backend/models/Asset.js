const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: {
    type: String,
    enum: ['Routine', 'Corrective', 'Preventive', 'Emergency'],
    required: true
  },
  description: { type: String, required: true },
  technician: { type: String, required: true },
  cost: { type: Number, default: 0 },
  nextScheduled: { type: Date }
}, { timestamps: true });

const assetSchema = new mongoose.Schema({
  assetId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: [true, 'Asset name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Locomotive', 'Wagon', 'Coach', 'Track', 'Signal',
      'Bridge', 'Station Equipment', 'Power Supply', 'Communication', 'Other'
    ]
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Operational', 'Under Maintenance', 'Decommissioned', 'Faulty', 'Standby'],
    default: 'Operational'
  },
  location: {
    zone: { type: String, required: true },
    division: { type: String },
    station: { type: String },
    track: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  manufacturer: { type: String },
  model: { type: String },
  serialNumber: { type: String },
  purchaseDate: { type: Date },
  warrantyExpiry: { type: Date },
  lastInspectionDate: { type: Date },
  nextInspectionDate: { type: Date },
  maintenanceLogs: [maintenanceLogSchema],
  qrCode: { type: String },      // Base64 QR image
  qrCodeData: { type: String },  // Raw string encoded in QR
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Auto-generate assetId before validate
assetSchema.pre('validate', async function (next) {
  if (!this.assetId) {
    const count = await mongoose.model('Asset').countDocuments();
    this.assetId = `RA-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Asset', assetSchema);
