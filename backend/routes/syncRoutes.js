import express from 'express';
import { startSyncProcess, triggerApiSync } from '../controllers/syncController.js';
import multer from 'multer';

const tempUpload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/start', tempUpload.single('targetFile'), startSyncProcess);
router.post('/trigger-api-sync', triggerApiSync);

export default router;
