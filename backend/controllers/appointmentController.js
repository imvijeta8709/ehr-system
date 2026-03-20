const Appointment = require('../models/Appointment');
const Record = require('../models/Record');
const Notification = require('../models/Notification');

// POST /api/appointments
exports.createAppointment = async (req, res) => {
  try {
    const { doctor, date, timeSlot, reason } = req.body;
    const patientId = req.user.role === 'patient' ? req.user._id : req.body.patient;

    // Check for slot conflict
    const conflict = await Appointment.findOne({
      doctor,
      date: new Date(date),
      timeSlot,
      status: { $in: ['pending', 'confirmed'] },
    });
    if (conflict) {
      return res.status(400).json({ success: false, message: 'Time slot already booked' });
    }

    const appointment = await Appointment.create({ patient: patientId, doctor, date, timeSlot, reason });
    await appointment.populate('patient', 'name email');
    await appointment.populate('doctor', 'name email');

    // Notify doctor
    Notification.create({
      user: doctor,
      title: 'New Appointment Request',
      message: `${appointment.patient.name} booked an appointment on ${new Date(date).toLocaleDateString()} at ${timeSlot}`,
      type: 'appointment',
      link: '/appointments',
    }).catch(() => {});

    res.status(201).json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/appointments
exports.getAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (req.user.role === 'patient') query.patient = req.user._id;
    else if (req.user.role === 'doctor') query.doctor = req.user._id;

    if (status) query.status = status;

    const total = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone age')
      .populate('doctor', 'name email specialization')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ date: 1 });

    res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / limit), appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/appointments/:id
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone age gender')
      .populate('doctor', 'name email specialization');
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/appointments/:id
exports.updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    // Patients can only cancel their own
    if (req.user.role === 'patient') {
      if (appointment.patient.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
      if (req.body.status && req.body.status !== 'cancelled') {
        return res.status(403).json({ success: false, message: 'Patients can only cancel appointments' });
      }
    }

    const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('patient', 'name email')
      .populate('doctor', 'name email specialization');

    // Notify patient of status change
    if (req.body.status && req.body.status !== appointment.status) {
      Notification.create({
        user: appointment.patient,
        title: 'Appointment Update',
        message: `Your appointment has been ${req.body.status}`,
        type: 'appointment',
        link: '/appointments',
      }).catch(() => {});
    }

    res.json({ success: true, appointment: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/appointments/stats
exports.getAppointmentStats = async (req, res) => {
  try {
    const query = req.user.role === 'doctor' ? { doctor: req.user._id } : {};
    const [total, pending, confirmed, completed, cancelled] = await Promise.all([
      Appointment.countDocuments(query),
      Appointment.countDocuments({ ...query, status: 'pending' }),
      Appointment.countDocuments({ ...query, status: 'confirmed' }),
      Appointment.countDocuments({ ...query, status: 'completed' }),
      Appointment.countDocuments({ ...query, status: 'cancelled' }),
    ]);
    res.json({ success: true, stats: { total, pending, confirmed, completed, cancelled } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
