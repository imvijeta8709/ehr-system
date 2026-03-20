const AuditLog = require('../models/AuditLog');

// GET /api/audit — admin only
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    const query = userId ? { user: userId } : {};

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, total, pages: Math.ceil(total / limit), logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
