import express from 'express';
import { getRegionalReport } from '../controllers/reportController.js';

const router = express.Router();

router.get('/regional', getRegionalReport);

export default router;