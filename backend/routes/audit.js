const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const checkPermission = require('../middleware/permission');
const { getAuditLogs } = require('../controllers/auditController');

router.get('/', protect, checkPermission('audit', 'view'), getAuditLogs);

module.exports = router;
