const AuditLog = require('../models/AuditLog');

// GET /api/audit — admin only
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, action, resource, from, to } = req.query;

    const query = {};
    if (userId)   query.user     = userId;
    if (action)   query.action   = { $regex: action, $options: 'i' };
    if (resource) query.resource = resource;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to)   query.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
    }

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
