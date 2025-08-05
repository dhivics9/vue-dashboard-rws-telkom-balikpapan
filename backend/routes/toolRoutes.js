// File: backend/routes/toolRoutes.js
import express from 'express';
import { internalFetchNcxData, internalFetchRevenueData, internalFetchSalesData } from '../controllers/toolController.js';

const router = express.Router();

router.get('/fetch-revenue', internalFetchRevenueData);
router.get('/fetch-ncx', internalFetchNcxData);
router.get('/fetch-sales', internalFetchSalesData);


export default router;
