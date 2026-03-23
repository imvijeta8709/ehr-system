const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getConfig, updateConfig,
  payBloodRequest, payAppointment,
  getBillingHistory,
  invoiceAppointment, invoiceBloodRequest,
} = require('../controllers/billingController');

// Billing config
router.get('/config/:type',    protect, getConfig);
router.put('/config/:type',    protect, authorize('superadmin'), updateConfig);

// Payments
router.post('/blood/:requestId/pay',           protect, payBloodRequest);
router.post('/appointment/:appointmentId/pay', protect, payAppointment);

// History
router.get('/history', protect, getBillingHistory);

// PDF Invoices
router.get('/invoice/appointment/:id', protect, invoiceAppointment);
router.get('/invoice/blood/:id',       protect, invoiceBloodRequest);

module.exports = router;
