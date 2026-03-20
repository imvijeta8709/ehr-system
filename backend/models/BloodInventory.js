const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], required: true, unique: true },
    units: { type: Number, default: 0, min: 0 },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BloodInventory', inventorySchema);
