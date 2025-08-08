// File: backend/routes/uploadRoutes.js
import express from 'express';
import { uploadAllFiles } from '../controllers/uploadController.js';
import multer from 'multer';

const tempUpload = multer({ dest: 'uploads/' });
const router = express.Router();

// Endpoint untuk menerima 4 file sekaligus
router.post('/all', tempUpload.fields([
    { name: 'revenueFile', maxCount: 1 },
    { name: 'ncxFile', maxCount: 1 },
    { name: 'salesFile', maxCount: 1 },
    { name: 'targetFile', maxCount: 1 }
]), uploadAllFiles);

export default router;
