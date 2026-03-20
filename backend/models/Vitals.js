const mongoose = require('mongoose');

const vitalsSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bloodPressureSystolic: { type: Number },
    bloodPressureDiastolic: { type: Number },
    heartRate: { type: Number },
    bloodSugar: { type: Number },
    bloodSugarType: { type: String, enum: ['fasting', 'postprandial', 'random'], default: 'random' },
    temperature: { type: Number },
    weight: { type: Number },
    height: { type: Number },
    oxygenSaturation: { type: Number },
    notes: { type: String },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vitals', vitalsSchema);
