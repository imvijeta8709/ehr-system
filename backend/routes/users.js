const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const checkPermission = require('../middleware/permission');
const {
  getPatients, getDoctors, getUserById,
  updateUser, deleteUser, getDashboardStats,
} = require('../controllers/userController');

router.get('/stats',    protect, authorize('admin', 'doctor', 'superadmin'), getDashboardStats);
router.get('/patients', protect, checkPermission('patients', 'view'), getPatients);
router.get('/doctors',  protect, checkPermission('doctors',  'view'), getDoctors);
router.get('/:id',      protect, getUserById);
router.put('/:id',      protect, updateUser);
router.delete('/:id',   protect, authorize('admin', 'superadmin'), checkPermission('patients', 'delete'), deleteUser);

module.exports = router;
