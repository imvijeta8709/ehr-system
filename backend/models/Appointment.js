const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    notes: { type: String },
    cancelReason: { type: String },
    // Billing
    consultationFee: { type: Number, default: 0 },
    totalAmount:     { type: Number, default: 0 },
    paymentStatus:   { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paidAt:          { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
