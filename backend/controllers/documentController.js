const Record = require('../models/Record');
const User   = require('../models/User');
const AuditLog = require('../models/AuditLog');
const fs = require('fs');
const path = require('path');

// ── Helper: resolve absolute path of an uploaded file ───────────
function resolveFilePath(fileUrl) {
  // fileUrl stored as "/uploads/filename.ext"
  const filename = path.basename(fileUrl);
  return path.join(__dirname, '..', 'uploads', filename);
}

// POST /api/documents/upload
// Body: patientId (required), recordId (optional), category, description
// Files: multipart "files" field (up to 10)
exports.uploadDocuments = async (req, res) => {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const { patientId, recordId, category = 'general', description = '' } = req.body;

    // Validate patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const attachments = req.files.map(f => ({
      filename: f.originalname,
      fileUrl: `/uploads/${f.filename}`,
      fileType: f.mimetype,
      fileSize: f.size,
      category,
      description,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    }));

    // If linked to a specific record, push into that record's attachments
    if (recordId) {
      const record = await Record.findById(recordId);
      if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
      record.attachments.push(...attachments);
      await record.save();
    }

    // Also store in a standalone patient-level document list (virtual via Record with no diagnosis)
    // We use a dedicated "document" record type — a Record with type='document'
    const docRecord = await Record.findOneAndUpdate(
      { patient: patientId, _docStore: true },
      {
        $setOnInsert: {
          patient: patientId,
          doctor: req.user._id,
          visitDate: new Date(),
          diagnosis: '__document_store__',
          _docStore: true,
        },
        $push: { attachments: { $each: attachments } },
      },
      { upsert: true, new: true }
    );

    AuditLog.create({
      user: req.user._id,
      action: 'UPLOAD_DOCUMENTS',
      resource: 'Document',
      resourceId: docRecord._id,
      ip: req.ip,
    }).catch(() => {});

    res.status(201).json({ success: true, attachments, count: attachments.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/documents?patientId=&category=&page=&limit=
exports.getDocuments = async (req, res) => {
  try {
    const { patientId, category, page = 1, limit = 20 } = req.query;

    // Patients can only see their own documents
    const resolvedPatientId = req.user.role === 'patient' ? req.user._id : patientId;
    if (!resolvedPatientId) {
      return res.status(400).json({ success: false, message: 'patientId is required' });
    }

    // Gather attachments from ALL records for this patient
    const records = await Record.find({ patient: resolvedPatientId })
      .populate('doctor', 'name')
      .select('attachments visitDate diagnosis _docStore');

    // Flatten all attachments, tag with record info
    let docs = [];
    for (const rec of records) {
      for (const att of rec.attachments) {
        if (category && att.category !== category) continue;
        docs.push({
          _id: att._id,
          filename: att.filename,
          fileUrl: att.fileUrl,
          fileType: att.fileType,
          fileSize: att.fileSize,
          category: att.category || 'general',
          description: att.description || '',
          uploadedAt: att.uploadedAt || rec.createdAt,
          recordId: rec._docStore ? null : rec._id,
          recordDiagnosis: rec._docStore ? null : rec.diagnosis,
          doctor: rec.doctor,
        });
      }
    }

    // Sort newest first
    docs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    const total = docs.length;
    const start = (page - 1) * limit;
    const paginated = docs.slice(start, start + parseInt(limit));

    res.json({ success: true, total, pages: Math.ceil(total / limit), documents: paginated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/documents/:attachmentId?patientId=
exports.deleteDocument = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const { patientId } = req.query;

    const resolvedPatientId = req.user.role === 'patient' ? req.user._id : patientId;

    // Find the record containing this attachment
    const record = await Record.findOne({
      patient: resolvedPatientId,
      'attachments._id': attachmentId,
    });
    if (!record) return res.status(404).json({ success: false, message: 'Document not found' });

    const att = record.attachments.id(attachmentId);

    // Delete physical file
    try {
      const filePath = resolveFilePath(att.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch { /* ignore fs errors */ }

    record.attachments.pull(attachmentId);
    await record.save();

    AuditLog.create({
      user: req.user._id,
      action: 'DELETE_DOCUMENT',
      resource: 'Document',
      resourceId: attachmentId,
      ip: req.ip,
    }).catch(() => {});

    res.json({ success: true, message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
