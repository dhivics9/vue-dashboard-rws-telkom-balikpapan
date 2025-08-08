import express from 'express';
import { getRegionalReport, getProductSummaryReport } from '../controllers/reportController.js';

const router = express.Router();

router.get('/regional', getRegionalReport);
router.get('/product-summary', getProductSummaryReport);


export default router;