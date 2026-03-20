const mongoose = require('mongoose');

// Stores configurable pricing set by superadmin
const billingConfigSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['blood', 'consultation'],
      required: true,
      unique: true,
    },
    // Blood bank pricing
    pricePerUnit: { type: Number, default: 0 },       // cost per blood unit
    emergencyCharge: { type: Number, default: 0 },    // flat extra charge

    // Consultation pricing
    consultationFee: { type: Number, default: 0 },    // base fee per consultation

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BillingConfig', billingConfigSchema);
