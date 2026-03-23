const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const BloodRequest   = require('../models/BloodRequest');
const Appointment    = require('../models/Appointment');
const BloodInventory = require('../models/BloodInventory');
const Notification   = require('../models/Notification');
const AuditLog       = require('../models/AuditLog');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ── POST /api/stripe/blood/:requestId/checkout ───────────────────
exports.createBloodCheckout = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.requestId)
      .populate('requestedBy', 'name email');
    if (!request) return res.status(404).json({ success: false, message: 'Blood request not found' });

    if (request.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Request must be approved before payment' });
    }
    if (request.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Already paid' });
    }
    if (!request.totalAmount || request.totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'No charges defined. Contact admin to set pricing.' });
    }

    // Only the requester or admin can pay
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    if (!isAdmin && request.requestedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: req.user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Blood Request — ${request.units} unit(s) of ${request.bloodGroup}`,
              description: `Hospital: ${request.hospital} | Urgency: ${request.urgency}`,
            },
            unit_amount: Math.round(request.totalAmount * 100), // cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'blood',
        requestId: request._id.toString(),
        userId: req.user._id.toString(),
      },
      success_url: `${CLIENT_URL}/app/blood-bank?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${CLIENT_URL}/app/blood-bank?payment=cancelled`,
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/stripe/appointment/:appointmentId/checkout ─────────
exports.createAppointmentCheckout = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('patient', 'name email')
      .populate('doctor', 'name email');
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    if (appointment.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Appointment must be completed before payment' });
    }
    if (appointment.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Already paid' });
    }
    if (!appointment.totalAmount || appointment.totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'No consultation fee defined. Contact your doctor.' });
    }

    // Only the patient or admin can pay
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    if (!isAdmin && appointment.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: appointment.patient.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Consultation — Dr. ${appointment.doctor.name}`,
              description: `Date: ${new Date(appointment.date).toLocaleDateString()} at ${appointment.timeSlot}`,
            },
            unit_amount: Math.round(appointment.totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'appointment',
        appointmentId: appointment._id.toString(),
        userId: req.user._id.toString(),
      },
      success_url: `${CLIENT_URL}/appointments?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${CLIENT_URL}/appointments?payment=cancelled`,
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/stripe/webhook ─────────────────────────────────────
// Stripe sends events here after payment. Must be raw body.
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { type, requestId, appointmentId, userId } = session.metadata;

    try {
      if (type === 'blood' && requestId) {
        await fulfillBloodPayment(requestId, userId);
      } else if (type === 'appointment' && appointmentId) {
        await fulfillAppointmentPayment(appointmentId, userId);
      }
    } catch (err) {
      console.error('Webhook fulfillment error:', err.message);
      return res.status(500).json({ error: 'Fulfillment failed' });
    }
  }

  res.json({ received: true });
};

// ── POST /api/stripe/session/:sessionId/verify ───────────────────
// Generic verify by session ID — used after Stripe redirect
exports.verifySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    const { type, requestId, appointmentId, userId } = session.metadata;
    if (type === 'blood' && requestId) {
      const request = await fulfillBloodPayment(requestId, userId);
      return res.json({ success: true, type: 'blood', request });
    }
    if (type === 'appointment' && appointmentId) {
      const appointment = await fulfillAppointmentPayment(appointmentId, userId);
      return res.json({ success: true, type: 'appointment', appointment });
    }
    res.status(400).json({ success: false, message: 'Unknown payment type' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Internal fulfillment helpers ─────────────────────────────────

async function fulfillBloodPayment(requestId, userId) {
  const request = await BloodRequest.findById(requestId);
  if (!request) throw new Error('Blood request not found');
  if (request.paymentStatus === 'paid') return request; // idempotent

  // Deduct inventory atomically
  const inv = await BloodInventory.findOneAndUpdate(
    { bloodGroup: request.bloodGroup, units: { $gte: request.units } },
    { $inc: { units: -request.units } },
    { new: true }
  );
  if (!inv) {
    const current = await BloodInventory.findOne({ bloodGroup: request.bloodGroup });
    throw new Error(`Insufficient stock. Only ${current?.units ?? 0} unit(s) available.`);
  }

  request.paymentStatus = 'paid';
  request.paidAt        = new Date();
  request.status        = 'fulfilled';
  request.fulfilledAt   = new Date();
  await request.save();

  Notification.create({
    user: request.requestedBy,
    title: 'Blood Request Payment Confirmed',
    message: `Payment of $${request.totalAmount.toFixed(2)} confirmed. Blood units have been allocated.`,
    type: 'general',
    link: '/app/blood-bank',
  }).catch(() => {});

  AuditLog.create({
    user: userId,
    action: 'BLOOD_REQUEST_PAID_STRIPE',
    resource: 'BloodRequest',
    resourceId: request._id,
  }).catch(() => {});

  return request;
}

async function fulfillAppointmentPayment(appointmentId, userId) {
  const appointment = await Appointment.findById(appointmentId)
    .populate('patient', 'name email')
    .populate('doctor', 'name email');
  if (!appointment) throw new Error('Appointment not found');
  if (appointment.paymentStatus === 'paid') return appointment; // idempotent

  appointment.paymentStatus = 'paid';
  appointment.paidAt        = new Date();
  await appointment.save();

  Notification.create({
    user: appointment.patient._id,
    title: 'Consultation Payment Confirmed',
    message: `Payment of $${appointment.totalAmount.toFixed(2)} for your consultation with Dr. ${appointment.doctor.name} is confirmed.`,
    type: 'appointment',
    link: '/appointments',
  }).catch(() => {});

  AuditLog.create({
    user: userId,
    action: 'APPOINTMENT_PAID_STRIPE',
    resource: 'Appointment',
    resourceId: appointment._id,
  }).catch(() => {});

  return appointment;
}
