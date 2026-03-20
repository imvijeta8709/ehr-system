const RolePermission = require('../models/RolePermission');

// Full permissions object for superadmin/admin — all actions true on all modules
const buildFullPermissions = () => {
  const perms = {};
  RolePermission.schema.statics.ALL_MODULES.forEach((mod) => {
    perms[mod] = { view: true, create: true, edit: true, delete: true };
  });
  return perms;
};

// GET /api/permissions/:role  — any authenticated user
exports.getPermissions = async (req, res) => {
  try {
    const { role } = req.params;

    if (role === 'superadmin' || role === 'admin') {
      return res.json({ success: true, role, permissions: buildFullPermissions() });
    }

    const doc = await RolePermission.findOne({ role }).lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Role not found' });

    res.json({ success: true, role, permissions: doc.permissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/permissions  — superadmin only, returns all role configs
exports.getAllPermissions = async (req, res) => {
  try {
    const docs = await RolePermission.find({}).lean();
    res.json({
      success: true,
      permissions: docs,
      allModules: RolePermission.ALL_MODULES,
      allActions: RolePermission.ALL_ACTIONS,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/permissions/:role  — superadmin only
// Body: { permissions: { patients: { view: true, create: false, ... }, ... } }
exports.updatePermissions = async (req, res) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ success: false, message: 'permissions must be an object' });
    }

    // Validate module keys and action values
    const validModules = RolePermission.ALL_MODULES;
    const validActions = RolePermission.ALL_ACTIONS;

    for (const [mod, actions] of Object.entries(permissions)) {
      if (!validModules.includes(mod)) {
        return res.status(400).json({ success: false, message: `Invalid module: ${mod}` });
      }
      for (const [act, val] of Object.entries(actions)) {
        if (!validActions.includes(act)) {
          return res.status(400).json({ success: false, message: `Invalid action: ${act}` });
        }
        if (typeof val !== 'boolean') {
          return res.status(400).json({ success: false, message: `Action value must be boolean: ${act}` });
        }
      }
    }

    const doc = await RolePermission.findOneAndUpdate(
      { role },
      { permissions },
      { new: true, upsert: true }
    ).lean();

    res.json({ success: true, role: doc.role, permissions: doc.permissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
