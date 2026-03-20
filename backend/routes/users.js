const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const checkPermission = require('../middleware/permission');
const upload = require('../middleware/upload');
const {
  getPatients, getDoctors, getUserById,
  updateUser, deleteUser, getDashboardStats, uploadAvatar, getAnalytics,
} = require('../controllers/userController');

router.get('/stats',        protect, authorize('admin', 'doctor', 'superadmin'), getDashboardStats);
router.get('/analytics',    protect, authorize('admin', 'doctor', 'superadmin'), getAnalytics);
router.get('/patients',     protect, checkPermission('patients', 'view'), getPatients);
router.get('/doctors',      protect, getDoctors);
router.post('/:id/avatar',  protect, upload.single('avatar'), uploadAvatar);
router.get('/:id',          protect, getUserById);
router.put('/:id',          protect, updateUser);
router.delete('/:id',       protect, authorize('admin', 'superadmin'), checkPermission('patients', 'delete'), deleteUser);

module.exports = router;
