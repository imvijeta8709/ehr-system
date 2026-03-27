const DoctorAvailability = require('../models/DoctorAvailability');
const Appointment = require('../models/Appointment');

// GET /api/availability/:doctorId  — public: get available slots for a date
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query; // 'YYYY-MM-DD'
    if (!date) return res.status(400).json({ success: false, message: 'date query param required' });

    const avail = await DoctorAvailability.findOne({ doctor: doctorId });
    if (!avail) return res.json({ success: true, slots: [] });

    // Parse date parts directly from string to avoid timezone shift
    const [year, month, day] = date.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay(); // 0=Sun, 6=Sat

    // Check override first
    const override = avail.overrides.find(o => o.date === date);
    let slots = [];
    if (override) {
      if (override.isOff) {
        return res.json({ success: true, slots: [], message: 'Doctor is off on this day' });
      }
      slots = override.slots;
    } else {
      const weekly = avail.weeklySchedule.find(w => w.day === dayOfWeek);
      slots = weekly ? weekly.slots : [];
    }

    if (slots.length === 0) return res.json({ success: true, slots: [] });

    // Remove already-booked slots
    const [y, m, d] = date.split('-').map(Number);
    const dayStart = new Date(y, m - 1, d);
    const dayEnd   = new Date(y, m - 1, d + 1);
    const booked = await Appointment.find({
      doctor: doctorId,
      date: { $gte: dayStart, $lt: dayEnd },
      status: { $in: ['pending', 'confirmed'] },
    }).select('timeSlot');

    const bookedSlots = new Set(booked.map(a => a.timeSlot));
    const available = slots.filter(s => !bookedSlots.has(s));

    res.json({ success: true, slots: available, allSlots: slots, bookedSlots: [...bookedSlots] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/availability/me/schedule  — doctor fetches own schedule
exports.getMySchedule = async (req, res) => {
  try {
    const avail = await DoctorAvailability.findOne({ doctor: req.user._id });
    res.json({ success: true, schedule: avail || { weeklySchedule: [], overrides: [] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/availability/:doctorId/schedule  — get full schedule (doctor/admin only)
exports.getSchedule = async (req, res) => {
  try {
    const avail = await DoctorAvailability.findOne({ doctor: req.params.doctorId });
    res.json({ success: true, schedule: avail || { weeklySchedule: [], overrides: [] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/availability  — doctor sets their own schedule
exports.setSchedule = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { weeklySchedule, overrides, slotDuration } = req.body;

    const avail = await DoctorAvailability.findOneAndUpdate(
      { doctor: doctorId },
      { weeklySchedule, overrides: overrides || [], slotDuration: slotDuration || 30 },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, schedule: avail });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/availability/override  — add/update a date override
exports.setOverride = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { date, slots, isOff } = req.body;
    if (!date) return res.status(400).json({ success: false, message: 'date required' });

    let avail = await DoctorAvailability.findOne({ doctor: doctorId });
    if (!avail) avail = new DoctorAvailability({ doctor: doctorId, weeklySchedule: [], overrides: [] });

    const idx = avail.overrides.findIndex(o => o.date === date);
    const entry = { date, slots: slots || [], isOff: !!isOff };
    if (idx >= 0) avail.overrides[idx] = entry;
    else avail.overrides.push(entry);

    await avail.save();
    res.json({ success: true, schedule: avail });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
