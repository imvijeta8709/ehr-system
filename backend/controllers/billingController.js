const BillingConfig  = require('../models/BillingConfig');
const BloodRequest   = require('../models/BloodRequest');
const BloodInventory = require('../models/BloodInventory');
const Appointment    = require('../models/Appointment');
const Notification   = require('../models/Notification');
const AuditLog       = require('../models/AuditLog');
const PDFDocument    = require('pdfkit');
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

    // Validate totalAmount exists and is greater than 0
    if (!request.totalAmount || request.totalAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No charges defined for this request. Please contact admin to set pricing.' 
      });
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
      link: '/app/blood-bank',
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

    // Validate totalAmount exists and is greater than 0
    if (!appointment.totalAmount || appointment.totalAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No consultation fee defined. Please contact the doctor or admin.' 
      });
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

// ── Billing History ──────────────────────────────────────────────

// GET /api/billing/history
exports.getBillingHistory = async (req, res) => {
  try {
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const apptFilter = isAdmin ? { paymentStatus: 'paid' } : { patient: req.user._id, paymentStatus: 'paid' };
    const bloodFilter = isAdmin ? { paymentStatus: 'paid' } : { requestedBy: req.user._id, paymentStatus: 'paid' };

    const [appointments, bloodRequests] = await Promise.all([
      Appointment.find(apptFilter)
        .populate('patient', 'name email')
        .populate('doctor', 'name')
        .sort({ paidAt: -1 }),
      BloodRequest.find(bloodFilter)
        .populate('requestedBy', 'name email')
        .sort({ paidAt: -1 }),
    ]);

    // Merge and sort by paidAt
    const merged = [
      ...appointments.map(a => ({
        _id: a._id,
        type: 'consultation',
        date: a.paidAt || a.updatedAt,
        amount: a.totalAmount,
        status: a.paymentStatus,
        patient: a.patient,
        doctor: a.doctor,
        appointmentDate: a.date,
        reason: a.reason,
      })),
      ...bloodRequests.map(b => ({
        _id: b._id,
        type: 'blood',
        date: b.paidAt || b.updatedAt,
        amount: b.totalAmount,
        status: b.paymentStatus,
        patient: b.requestedBy,
        bloodGroup: b.bloodGroup,
        units: b.units,
        hospital: b.hospital,
        urgency: b.urgency,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const total = merged.length;
    const paginated = merged.slice(skip, skip + limit);

    res.json({ success: true, history: paginated, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PDF Invoice Helpers ──────────────────────────────────────────

function buildInvoicePDF(res, data) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${data.invoiceNo}.pdf"`);
  doc.pipe(res);

  const primary = '#2A7FFF';
  const light   = '#f0f4ff';

  // Header bar
  doc.rect(0, 0, doc.page.width, 80).fill(primary);
  doc.fillColor('#fff').fontSize(22).font('Helvetica-Bold').text('EHR SYSTEM', 50, 25);
  doc.fontSize(10).font('Helvetica').text('Electronic Health Records', 50, 52);
  doc.fillColor('#fff').fontSize(10).text(`Invoice #${data.invoiceNo}`, 400, 30, { align: 'right', width: 145 });
  doc.text(`Date: ${new Date(data.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 400, 48, { align: 'right', width: 145 });

  // Bill To
  doc.fillColor('#333').fontSize(11).font('Helvetica-Bold').text('BILL TO', 50, 110);
  doc.font('Helvetica').fontSize(10)
    .text(data.patientName, 50, 128)
    .text(data.patientEmail, 50, 143);

  // Invoice type badge
  doc.rect(400, 105, 145, 50).fill(light);
  doc.fillColor(primary).fontSize(10).font('Helvetica-Bold')
    .text(data.type === 'consultation' ? 'CONSULTATION' : 'BLOOD REQUEST', 408, 115, { width: 130, align: 'center' });
  doc.fillColor('#555').font('Helvetica').fontSize(9)
    .text(`Status: PAID`, 408, 133, { width: 130, align: 'center' });

  // Divider
  doc.moveTo(50, 175).lineTo(545, 175).strokeColor('#ddd').stroke();

  // Table header
  doc.rect(50, 185, 495, 24).fill(primary);
  doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold')
    .text('DESCRIPTION', 60, 193)
    .text('DETAILS', 250, 193)
    .text('AMOUNT', 460, 193, { width: 75, align: 'right' });

  // Table rows
  let y = 209;
  const row = (label, detail, amount, shade) => {
    if (shade) doc.rect(50, y, 495, 22).fill('#f9fafb');
    doc.fillColor('#333').fontSize(9).font('Helvetica')
      .text(label, 60, y + 6)
      .text(detail, 250, y + 6);
    if (amount !== null)
      doc.text(`₹${Number(amount).toFixed(2)}`, 460, y + 6, { width: 75, align: 'right' });
    y += 22;
  };

  if (data.type === 'consultation') {
    row('Consultation Fee', `Dr. ${data.doctorName}`, data.consultationFee, false);
    row('Appointment Date', new Date(data.appointmentDate).toLocaleDateString('en-IN'), null, true);
    row('Reason', data.reason || '—', null, false);
  } else {
    row('Blood Group', data.bloodGroup, null, false);
    row('Units Requested', `${data.units} unit(s)`, null, true);
    row('Price Per Unit', `₹${data.pricePerUnit?.toFixed(2) || '0.00'}`, data.pricePerUnit * data.units, false);
    if (data.emergencyCharge > 0)
      row('Emergency Charge', data.urgency, data.emergencyCharge, true);
    row('Hospital', data.hospital, null, false);
  }

  // Total box
  y += 10;
  doc.rect(350, y, 195, 36).fill(primary);
  doc.fillColor('#fff').fontSize(12).font('Helvetica-Bold')
    .text('TOTAL AMOUNT', 360, y + 8)
    .text(`₹${Number(data.totalAmount).toFixed(2)}`, 460, y + 8, { width: 75, align: 'right' });

  // Footer
  doc.fillColor('#aaa').fontSize(8).font('Helvetica')
    .text('This is a computer-generated invoice. No signature required.', 50, 760, { align: 'center', width: 495 });

  doc.end();
}

// GET /api/billing/invoice/appointment/:id
exports.invoiceAppointment = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id)
      .populate('patient', 'name email')
      .populate('doctor', 'name');
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (appt.paymentStatus !== 'paid') return res.status(400).json({ success: false, message: 'Invoice only available for paid appointments' });

    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    if (!isAdmin && appt.patient._id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    buildInvoicePDF(res, {
      invoiceNo: `APT-${appt._id.toString().slice(-8).toUpperCase()}`,
      date: appt.paidAt || appt.updatedAt,
      type: 'consultation',
      patientName: appt.patient.name,
      patientEmail: appt.patient.email,
      doctorName: appt.doctor.name,
      appointmentDate: appt.date,
      reason: appt.reason,
      consultationFee: appt.consultationFee,
      totalAmount: appt.totalAmount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/billing/invoice/blood/:id
exports.invoiceBloodRequest = async (req, res) => {
  try {
    const req_ = await BloodRequest.findById(req.params.id)
      .populate('requestedBy', 'name email');
    if (!req_) return res.status(404).json({ success: false, message: 'Blood request not found' });
    if (req_.paymentStatus !== 'paid') return res.status(400).json({ success: false, message: 'Invoice only available for paid requests' });

    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    if (!isAdmin && req_.requestedBy._id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    buildInvoicePDF(res, {
      invoiceNo: `BLD-${req_._id.toString().slice(-8).toUpperCase()}`,
      date: req_.paidAt || req_.updatedAt,
      type: 'blood',
      patientName: req_.requestedBy.name,
      patientEmail: req_.requestedBy.email,
      bloodGroup: req_.bloodGroup,
      units: req_.units,
      pricePerUnit: req_.pricePerUnit,
      emergencyCharge: req_.emergencyCharge,
      urgency: req_.urgency,
      hospital: req_.hospital,
      totalAmount: req_.totalAmount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
