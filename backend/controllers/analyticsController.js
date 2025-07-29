import pool from '../db.js';
import * as XLSX from 'xlsx';
import fs from 'fs';

// Upload and Process Excel File
export const uploadAnalyticsFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'File is required.' });
    }
    const filePath = req.file.path;
    const client = await pool.connect();
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJsonData = XLSX.utils.sheet_to_json(worksheet);

        const normalizeKeys = (obj) => {
            const newObj = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const normalizedKey = key.replace(/\s+/g, '_').toLowerCase();
                    newObj[normalizedKey] = obj[key];
                }
            }
            return newObj;
        };
        const jsonData = rawJsonData.map(normalizeKeys);

        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE public.revenues RESTART IDENTITY');
        for (const row of jsonData) {
            const query = `
                INSERT INTO public.revenues(regional, witel, lccd, stream, product_name, gl_account, bp_number, customer_name, customer_type, target, revenue, periode, target_rkapp)
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`;
            const values = [
                row.regional, row.witel, row.lccd, row.stream, row.product_name,
                row.gl_account, row.bp_number, row.customer_name, row.customer_type,
                parseFloat(row.target) || 0, parseFloat(row.revenue) || 0,
                parseInt(row.periode) || null, parseFloat(row.target_rkapp) || 0
            ];
            await client.query(query, values);
        }
        await client.query('COMMIT');
        res.status(200).json({ message: 'Data processed successfully.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error processing analytics file:", err);
        res.status(500).json({ message: 'Failed to process file.', error: err.message });
    } finally {
        client.release();
        fs.unlinkSync(filePath);
    }
};

// Get Analytics Data with Filters
export const getAnalyticsData = async (req, res) => {
    const { regional, witel, year, month, status } = req.query;
    let whereClauses = [];
    const queryParams = [];
    let paramIndex = 1;

    if (regional && regional !== 'All Regionals') {
        whereClauses.push(`regional = $${paramIndex++}`);
        queryParams.push(regional);
    }
    if (witel && witel !== 'All Witels') {
        whereClauses.push(`witel = $${paramIndex++}`);
        queryParams.push(witel);
    }
    if (status && status !== 'All') {
        whereClauses.push(`rev_type = $${paramIndex++}`);
        queryParams.push(status);
    }
    if (year && year !== 'All Years') {
        whereClauses.push(`SUBSTRING(periode::text FROM 1 FOR 4) = $${paramIndex++}`);
        queryParams.push(year);
    }
    if (month && month !== 'All') {
        whereClauses.push(`SUBSTRING(periode::text FROM 5 FOR 2) = $${paramIndex++}`);
        queryParams.push(month);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    try {
        const [summaryRes, tableRes, filterOptionsRes] = await Promise.all([
            pool.query(`SELECT COALESCE(SUM(revenue), 0) as "totalRevenue" FROM public.revenues ${whereString}`, queryParams),
            pool.query(`SELECT * FROM public.revenues ${whereString} ORDER BY id`, queryParams),
            pool.query(`SELECT 
                ARRAY_AGG(DISTINCT regional) as regionals, 
                ARRAY_AGG(DISTINCT witel) as witels,
                ARRAY_AGG(DISTINCT SUBSTRING(periode::text FROM 1 FOR 4)) as years
                FROM public.revenues`)
        ]);
        res.json({
            summary: summaryRes.rows[0],
            tableData: tableRes.rows,
            filterOptions: {
                regionals: ['All Regionals', ...(filterOptionsRes.rows[0].regionals || []).filter(Boolean).sort()],
                witels: ['All Witels', ...(filterOptionsRes.rows[0].witels || []).filter(Boolean).sort()],
                years: ['All Years', ...(filterOptionsRes.rows[0].years || []).filter(Boolean).sort((a,b) => b-a)],
            }
        });
    } catch (err) {
        console.error("Error fetching analytics data:", err);
        res.status(500).json({ message: 'Failed to fetch analytics data.' });
    }
};
