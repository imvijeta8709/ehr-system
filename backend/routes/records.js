const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const checkPermission = require('../middleware/permission');
const upload = require('../middleware/upload');
const {
  createRecord, getRecords, getRecordById, updateRecord, deleteRecord, getTimeline,
} = require('../controllers/recordController');

router.post('/',
  protect,
  checkPermission('records', 'create'),
  upload.array('attachments', 5),
  createRecord
);
router.get('/',                    protect, checkPermission('records', 'view'), getRecords);
router.get('/timeline/:patientId', protect, checkPermission('timeline', 'view'), getTimeline);
router.get('/:id',                 protect, checkPermission('records', 'view'), getRecordById);
router.put('/:id',
  protect,
  checkPermission('records', 'edit'),
  upload.array('attachments', 5),
  updateRecord
);
router.delete('/:id', protect, checkPermission('records', 'delete'), deleteRecord);

module.exports = router;
