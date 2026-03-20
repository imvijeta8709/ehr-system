const RolePermission = require('../models/RolePermission');

/**
 * checkPermission(module, action)
 * Middleware factory — verifies the logged-in user's role has the given
 * action on the given module. Superadmin/admin always pass.
 *
 * Usage:  router.post('/', protect, checkPermission('patients', 'create'), handler)
 */
const checkPermission = (module, action) => async (req, res, next) => {
  try {
    const { role } = req.user;

    // Superadmin and admin bypass all permission checks
    if (role === 'superadmin' || role === 'admin') return next();

    const doc = await RolePermission.findOne({ role }).lean();
    if (!doc) {
      return res.status(403).json({ success: false, message: 'No permissions configured for this role' });
    }

    const modulePerms = doc.permissions?.[module];
    if (!modulePerms || !modulePerms[action]) {
      return res.status(403).json({
        success: false,
        message: `Your role does not have '${action}' permission on '${module}'`,
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = checkPermission;
