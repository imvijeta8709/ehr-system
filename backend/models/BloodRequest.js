const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema(
  {
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // if doctor requests on behalf
    bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], required: true },
    units: { type: Number, required: true, min: 1 },
    urgency: { type: String, enum: ['normal', 'urgent', 'critical'], default: 'normal' },
    hospital: { type: String, required: true },
    location: { type: String, required: true },
    reason: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'fulfilled'], default: 'pending' },
    adminNote: { type: String },
    fulfilledAt: { type: Date },
    // Billing
    pricePerUnit:    { type: Number, default: 0 },
    emergencyCharge: { type: Number, default: 0 },
    totalAmount:     { type: Number, default: 0 },
    paymentStatus:   { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paidAt:          { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
