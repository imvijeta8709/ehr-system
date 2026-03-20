const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional link to user account
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true },
    phone: { type: String, required: true },
    bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], required: true },
    location: { type: String, required: true },
    lastDonationDate: { type: Date },
    isAvailable: { type: Boolean, default: true },
    totalDonatedUnits: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Virtual: eligible to donate (90-day rule)
donorSchema.virtual('isEligible').get(function () {
  if (!this.lastDonationDate) return true;
  const days = (Date.now() - new Date(this.lastDonationDate)) / (1000 * 60 * 60 * 24);
  return days >= 90;
});

donorSchema.set('toJSON', { virtuals: true });
donorSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Donor', donorSchema);
