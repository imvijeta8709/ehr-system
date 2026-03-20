const BillingConfig  = require('../models/BillingConfig');
const BloodRequest   = require('../models/BloodRequest');
const BloodInventory = require('../models/BloodInventory');
const Appointment    = require('../models/Appointment');
const Notification   = require('../models/Notification');
const AuditLog       = require('../models/AuditLog');
const { getConfig, calcBloodTotal, calcConsultationTotal } = require('../utils/billingService');

// ── Config ───────────────────────────────────────────────────────

// GET /api/billing/config/:type
exports.getConfig = async (req, res) => {
  try {
    const config = await getConfig(req.params.type);
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/billing/config/:type  (superadmin only)
exports.updateConfig = async (req, res) => {
  try {
    const { type } = req.params;
    const allowed = ['pricePerUnit', 'emergencyCharge', 'consultationFee'];
    const update  = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = Number(req.body[k]); });
    update.updatedBy = req.user._id;

    const config = await BillingConfig.findOneAndUpdate(
      { type },
      update,
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Blood Bank Payment ───────────────────────────────────────────

// POST /api/billing/blood/:requestId/pay
exports.payBloodRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Blood request not found' });

    if (request.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Request must be approved before payment' });
    }
    if (request.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Already paid' });
    }

    // Verify requester owns this request (or is admin)
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    if (!isAdmin && request.requestedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Deduct inventory atomically after payment
    const inv = await BloodInventory.findOneAndUpdate(
      { bloodGroup: request.bloodGroup, units: { $gte: request.units } },
      { $inc: { units: -request.units } },
      { new: true }
    );
    if (!inv) {
      const current = await BloodInventory.findOne({ bloodGroup: request.bloodGroup });
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${current?.units ?? 0} unit(s) available.`,
      });
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
      link: '/blood-bank',
    }).catch(() => {});

    AuditLog.create({
      user: req.user._id,
      action: 'BLOOD_REQUEST_PAID',
      resource: 'BloodRequest',
      resourceId: request._id,
      ip: req.ip,
    }).catch(() => {});

    await request.populate('requestedBy', 'name email role');
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Appointment Payment ──────────────────────────────────────────

// POST /api/billing/appointment/:appointmentId/pay
exports.payAppointment = async (req, res) => {
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

    // Only the patient or admin can pay
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    if (!isAdmin && appointment.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

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
      user: req.user._id,
      action: 'APPOINTMENT_PAID',
      resource: 'Appointment',
      resourceId: appointment._id,
      ip: req.ip,
    }).catch(() => {});

    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
