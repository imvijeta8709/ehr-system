const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPermissions,
  getAllPermissions,
  updatePermissions,
} = require('../controllers/permissionController');

// Any logged-in user can fetch their role's permissions
router.get('/:role', protect, getPermissions);

// Superadmin-only routes
router.get('/', protect, authorize('superadmin'), getAllPermissions);
router.put('/:role', protect, authorize('superadmin'), updatePermissions);

module.exports = router;
