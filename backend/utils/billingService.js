const BillingConfig = require('../models/BillingConfig');

/**
 * Get or create a billing config for a given type ('blood' | 'consultation')
 */
async function getConfig(type) {
  let config = await BillingConfig.findOne({ type });
  if (!config) config = await BillingConfig.create({ type });
  return config;
}

/**
 * Calculate blood request total:
 *   totalAmount = units × pricePerUnit + emergencyCharge
 */
function calcBloodTotal(units, pricePerUnit, emergencyCharge = 0) {
  return units * pricePerUnit + emergencyCharge;
}

/**
 * Calculate consultation total (currently just the fee, extensible later)
 */
function calcConsultationTotal(consultationFee) {
  return consultationFee;
}

module.exports = { getConfig, calcBloodTotal, calcConsultationTotal };
