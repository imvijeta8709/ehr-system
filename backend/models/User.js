const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['superadmin', 'admin', 'doctor', 'patient'], default: 'patient' },
    // Patient-specific fields
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    phone: { type: String },
    address: { type: String },
    bloodGroup: { type: String },
    emergencyContact: { type: String },
    // Medical history (patient)
    allergies: [{ type: String }],
    chronicDiseases: [{ type: String }],
    pastSurgeries: [{ type: String }],
    familyHistory: { type: String },
    currentMedications: [{ type: String }],
    // Doctor-specific fields
    specialization: { type: String },
    licenseNumber: { type: String },
    experience: { type: Number },
    isActive: { type: Boolean, default: true },
    avatar: { type: String, default: '' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
