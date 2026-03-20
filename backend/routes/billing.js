const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getConfig, updateConfig,
  payBloodRequest, payAppointment,
} = require('../controllers/billingController');

// Billing config (superadmin manages, anyone authenticated can read)
router.get('/config/:type',    protect, getConfig);
router.put('/config/:type',    protect, authorize('superadmin'), updateConfig);

// Payments
router.post('/blood/:requestId/pay',          protect, payBloodRequest);
router.post('/appointment/:appointmentId/pay', protect, payAppointment);

module.exports = router;
