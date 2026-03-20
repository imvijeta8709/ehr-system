const mongoose = require('mongoose');

// All modules and the actions available on each
const ALL_MODULES = [
  'dashboard',
  'patients',
  'doctors',
  'appointments',
  'records',
  'vitals',
  'timeline',
  'audit',
  'profile',
  'notifications',
];

const ALL_ACTIONS = ['view', 'create', 'edit', 'delete'];

// Sub-schema for a single module's action flags
const moduleActionsSchema = new mongoose.Schema(
  {
    view:   { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    edit:   { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  { _id: false }
);

// Build the permissions map dynamically from ALL_MODULES
const permissionsMapDef = {};
ALL_MODULES.forEach((mod) => {
  permissionsMapDef[mod] = { type: moduleActionsSchema, default: () => ({}) };
});

const rolePermissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['doctor', 'patient'],
      required: true,
      unique: true,
    },
    permissions: {
      type: permissionsMapDef,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

rolePermissionSchema.statics.ALL_MODULES = ALL_MODULES;
rolePermissionSchema.statics.ALL_ACTIONS = ALL_ACTIONS;

// Default permission sets
const DOCTOR_DEFAULTS = {
  dashboard:    { view: true,  create: false, edit: false,  delete: false },
  patients:     { view: true,  create: true,  edit: true,   delete: false },
  doctors:      { view: true,  create: false, edit: false,  delete: false },
  appointments: { view: true,  create: true,  edit: true,   delete: false },
  records:      { view: true,  create: true,  edit: true,   delete: false },
  vitals:       { view: true,  create: true,  edit: true,   delete: false },
  timeline:     { view: true,  create: false, edit: false,  delete: false },
  audit:        { view: false, create: false, edit: false,  delete: false },
  profile:      { view: true,  create: false, edit: true,   delete: false },
  notifications:{ view: true,  create: false, edit: false,  delete: false },
};

const PATIENT_DEFAULTS = {
  dashboard:    { view: true,  create: false, edit: false,  delete: false },
  patients:     { view: false, create: false, edit: false,  delete: false },
  doctors:      { view: false, create: false, edit: false,  delete: false },
  appointments: { view: true,  create: true,  edit: false,  delete: false },
  records:      { view: true,  create: false, edit: false,  delete: false },
  vitals:       { view: true,  create: true,  edit: false,  delete: false },
  timeline:     { view: true,  create: false, edit: false,  delete: false },
  audit:        { view: false, create: false, edit: false,  delete: false },
  profile:      { view: true,  create: false, edit: true,   delete: false },
  notifications:{ view: true,  create: false, edit: false,  delete: false },
};

rolePermissionSchema.statics.seedDefaults = async function () {
  await this.findOneAndUpdate(
    { role: 'doctor' },
    { permissions: DOCTOR_DEFAULTS },
    { upsert: true, new: true }
  );
  await this.findOneAndUpdate(
    { role: 'patient' },
    { permissions: PATIENT_DEFAULTS },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('RolePermission', rolePermissionSchema);
