const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  createBloodCheckout,
  createAppointmentCheckout,
  handleWebhook,
  verifySession,
} = require('../controllers/stripeController');

// Webhook — must use raw body (registered before express.json in server.js via inline middleware)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Checkout session creation
router.post('/blood/:requestId/checkout',           protect, createBloodCheckout);
router.post('/appointment/:appointmentId/checkout', protect, createAppointmentCheckout);

// Generic session verification after Stripe redirect
router.post('/session/:sessionId/verify', protect, verifySession);

module.exports = router;
