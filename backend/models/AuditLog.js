const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true }, // e.g. 'VIEW_RECORD', 'CREATE_RECORD'
    resource: { type: String }, // e.g. 'Record', 'Appointment'
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: String },
    ip: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
