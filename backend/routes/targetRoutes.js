import express from 'express';
import { uploadTargetFile } from '../controllers/targetController.js';
import multer from 'multer';

const tempUpload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/upload', tempUpload.single('targetFile'), uploadTargetFile);

export default router;
