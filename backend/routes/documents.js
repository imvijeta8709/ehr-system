const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload  = require('../middleware/upload');
const {
  uploadDocuments, getDocuments, deleteDocument, downloadDocument,
} = require('../controllers/documentController');

// Upload — doctors/admins upload for a patient; patients can upload their own
router.post('/upload',
  protect,
  upload.array('files', 10),
  uploadDocuments
);

// List documents for a patient
router.get('/', protect, getDocuments);

// Download a specific attachment (forces download with correct headers)
router.get('/:attachmentId/download', protect, downloadDocument);

// Delete a specific attachment
router.delete('/:attachmentId',
  protect,
  authorize('admin', 'superadmin', 'doctor'),
  deleteDocument
);

module.exports = router;
