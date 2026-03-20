const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  medication: { type: String, required: true },
  dosage: { type: String },
  frequency: { type: String },
  duration: { type: String },
});

const labReportSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  result: { type: String },
  normalRange: { type: String },
  fileUrl: { type: String },
});

const recordSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    visitDate: { type: Date, required: true, default: Date.now },
    diagnosis: { type: String, required: true },
    symptoms: { type: String },
    notes: { type: String },
    prescriptions: [prescriptionSchema],
    labReports: [labReportSchema],
    attachments: [
      {
        filename: String,
        fileUrl: String,
        fileType: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    followUpDate: { type: Date },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  { timestamps: true }
);

// Text index for search
recordSchema.index({ diagnosis: 'text', symptoms: 'text', notes: 'text' });

module.exports = mongoose.model('Record', recordSchema);
