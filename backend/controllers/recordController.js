const Record = require('../models/Record');
const AuditLog = require('../models/AuditLog');

// POST /api/records
exports.createRecord = async (req, res) => {
  try {
    const { patient, visitDate, diagnosis, symptoms, notes, prescriptions, labReports, followUpDate } = req.body;

    const attachments = req.files?.map((f) => ({
      filename: f.originalname,
      fileUrl: `/uploads/${f.filename}`,
      fileType: f.mimetype,
    })) || [];

    const record = await Record.create({
      patient,
      doctor: req.user._id,
      visitDate: visitDate || Date.now(),
      diagnosis,
      symptoms,
      notes,
      prescriptions: prescriptions ? JSON.parse(prescriptions) : [],
      labReports: labReports ? JSON.parse(labReports) : [],
      attachments,
      followUpDate,
    });

    await record.populate(['patient', 'doctor'], 'name email role');

    AuditLog.create({ user: req.user._id, action: 'CREATE_RECORD', resource: 'Record', resourceId: record._id, ip: req.ip }).catch(() => {});

    res.status(201).json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/records — doctor sees all, patient sees own
exports.getRecords = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, patientId } = req.query;
    const query = {};

    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (patientId) {
      query.patient = patientId;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const total = await Record.countDocuments(query);
    const records = await Record.find(query)
      .populate('patient', 'name email age gender')
      .populate('doctor', 'name email specialization')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ visitDate: -1 });

    res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / limit), records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/records/:id
exports.getRecordById = async (req, res) => {
  try {
    const record = await Record.findById(req.params.id)
      .populate('patient', 'name email age gender bloodGroup')
      .populate('doctor', 'name email specialization');

    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    // Patients can only view their own records
    if (req.user.role === 'patient' && record.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    AuditLog.create({ user: req.user._id, action: 'VIEW_RECORD', resource: 'Record', resourceId: record._id, ip: req.ip }).catch(() => {});

    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/records/:id
exports.updateRecord = async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    if (record.doctor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { prescriptions, labReports, ...rest } = req.body;
    if (prescriptions) rest.prescriptions = JSON.parse(prescriptions);
    if (labReports) rest.labReports = JSON.parse(labReports);

    if (req.files?.length) {
      const newAttachments = req.files.map((f) => ({
        filename: f.originalname,
        fileUrl: `/uploads/${f.filename}`,
        fileType: f.mimetype,
      }));
      rest.attachments = [...(record.attachments || []), ...newAttachments];
    }

    const updated = await Record.findByIdAndUpdate(req.params.id, rest, { new: true })
      .populate('patient', 'name email age gender')
      .populate('doctor', 'name email specialization');

    res.json({ success: true, record: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/records/:id — admin only
exports.deleteRecord = async (req, res) => {
  try {
    await Record.findByIdAndUpdate(req.params.id, { status: 'archived' });
    res.json({ success: true, message: 'Record archived' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/records/timeline/:patientId — full patient activity timeline
exports.getTimeline = async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user._id : req.params.patientId;

    const Vitals      = require('../models/Vitals');
    const Appointment = require('../models/Appointment');
    const BloodRequest = require('../models/BloodRequest');

    const [records, vitals, appointments, bloodRequests] = await Promise.all([
      Record.find({ patient: patientId, status: 'active', _docStore: { $ne: true } })
        .populate('doctor', 'name specialization')
        .sort({ visitDate: -1 }),

      Vitals.find({ patient: patientId })
        .populate('doctor', 'name')
        .sort({ recordedAt: -1 })
        .limit(30),

      Appointment.find({ patient: patientId })
        .populate('doctor', 'name specialization')
        .sort({ date: -1 })
        .limit(50),

      BloodRequest.find({ patient: patientId })
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    // Build unified events array
    const events = [
      ...records.map(r => ({
        type: 'record',
        date: r.visitDate,
        data: r,
      })),
      ...vitals.map(v => ({
        type: 'vitals',
        date: v.recordedAt,
        data: v,
      })),
      ...appointments.map(a => ({
        type: 'appointment',
        date: a.date,
        data: a,
        // payment sub-event
        ...(a.paymentStatus === 'paid' ? { paymentDate: a.paidAt } : {}),
      })),
      ...bloodRequests.map(b => ({
        type: 'blood_request',
        date: b.createdAt,
        data: b,
      })),
      // Payment events from paid appointments
      ...appointments
        .filter(a => a.paymentStatus === 'paid' && a.paidAt)
        .map(a => ({
          type: 'payment',
          date: a.paidAt,
          data: { ...a.toObject(), paymentType: 'consultation', amount: a.totalAmount },
        })),
      // Payment events from paid blood requests
      ...bloodRequests
        .filter(b => b.paymentStatus === 'paid' && b.paidAt)
        .map(b => ({
          type: 'payment',
          date: b.paidAt,
          data: { ...b.toObject(), paymentType: 'blood', amount: b.totalAmount },
        })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Summary counts
    const summary = {
      totalRecords:       records.length,
      totalAppointments:  appointments.length,
      totalVitals:        vitals.length,
      totalBloodRequests: bloodRequests.length,
      totalPayments:      events.filter(e => e.type === 'payment').length,
    };

    res.json({ success: true, events, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
