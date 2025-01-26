import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
// Document Management Routes

import {
    uploadDocument,
    getDocuments,
} from '../../controllers/communication-documents/documentController.js';
import { uploadMiddleware } from '../../config/uploadConfig.js';

const router = express.Router();

router.post('/upload-document', authenticateToken, uploadMiddleware, uploadDocument);
router.post('/get-documents', authenticateToken, getDocuments);

export default router;