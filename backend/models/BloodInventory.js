const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], required: true, unique: true },
    units: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 }, // alert when units <= this
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

inventorySchema.virtual('isLowStock').get(function () {
  return this.units <= this.lowStockThreshold;
});
inventorySchema.virtual('isOutOfStock').get(function () {
  return this.units === 0;
});
inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('BloodInventory', inventorySchema);
