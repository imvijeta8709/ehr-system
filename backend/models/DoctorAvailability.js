const mongoose = require('mongoose');

// Weekly recurring schedule per doctor
const weeklySlotSchema = new mongoose.Schema({
  day: { type: Number, min: 0, max: 6, required: true }, // 0=Sun, 1=Mon ... 6=Sat
  slots: [{ type: String }], // e.g. ['09:00 AM', '10:00 AM']
}, { _id: false });

// Date-specific overrides (block a day or add extra slots)
const overrideSchema = new mongoose.Schema({
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  slots: [{ type: String }],              // empty array = day off
  isOff: { type: Boolean, default: false },
}, { _id: false });

const doctorAvailabilitySchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  weeklySchedule: [weeklySlotSchema],
  overrides: [overrideSchema],
  slotDuration: { type: Number, default: 30 }, // minutes (for display only)
}, { timestamps: true });

module.exports = mongoose.model('DoctorAvailability', doctorAvailabilitySchema);
