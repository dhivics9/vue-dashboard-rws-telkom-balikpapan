import express from 'express';
import { getAnalyticsData, uploadAnalyticsFile} from '../controllers/analyticsController.js';
import multer from 'multer';

const tempUpload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/upload', tempUpload.single('analyticsFile'), uploadAnalyticsFile);
router.get('/data', getAnalyticsData);
// router.get('/summary', getHomepageSummary);

export default router;