// File: backend/routes/syncRoutes.js
import express from 'express';
import { startSyncProcess } from '../controllers/syncController.js';
import multer from 'multer';

const tempUpload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/start', tempUpload.single('targetFile'), startSyncProcess);

export default router;
