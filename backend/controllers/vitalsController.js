const Vitals = require('../models/Vitals');
const AuditLog = require('../models/AuditLog');

// POST /api/vitals
exports.createVitals = async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user._id : req.body.patient;
    const vitals = await Vitals.create({ ...req.body, patient: patientId, doctor: req.user._id });
    await vitals.populate(['patient', 'doctor'], 'name email');

    AuditLog.create({ user: req.user._id, action: 'CREATE_VITALS', resource: 'Vitals', resourceId: vitals._id, ip: req.ip }).catch(() => {});

    res.status(201).json({ success: true, vitals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/vitals?patientId=xxx
exports.getVitals = async (req, res) => {
  try {
    const { patientId, limit = 20 } = req.query;
    const query = {};

    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (patientId) {
      query.patient = patientId;
    }

    const vitals = await Vitals.find(query)
      .populate('patient', 'name')
      .populate('doctor', 'name')
      .sort({ recordedAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, vitals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/vitals/:id
exports.deleteVitals = async (req, res) => {
  try {
    await Vitals.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Vitals deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
