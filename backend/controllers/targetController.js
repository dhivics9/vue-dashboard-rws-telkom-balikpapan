import pool from '../db.js';
import XLSX from 'xlsx';
import fs from 'fs';

export const uploadTargetFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'File Target (OGD) diperlukan.' });
    }
    const filePath = req.file.path;
    const client = await pool.connect();
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
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
        const targetData = rawData.map(normalizeKeys);

        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE public.targets_ogd RESTART IDENTITY');
        for (const row of targetData) {
            await client.query(
                `INSERT INTO public.targets_ogd (regional, witel, lccd, stream, product_name, gl_account, bp_number, customer_name, customer_type, target, revenue, periode, target_rkapp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [row.regional, row.witel, row.lccd, row.stream, row.product_name, row.gl_account, row.bp_number, row.customer_name, row.customer_type, row.target, row.revenue, row.periode, row.target_rkapp]
            );
        }
        await client.query('COMMIT');
        res.status(200).json({ message: `Berhasil meng-upload ${targetData.length} baris data target.` });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error saat upload data target:", err);
        res.status(500).json({ message: 'Gagal memproses file target.', error: err.message });
    } finally {
        client.release();
        fs.unlinkSync(filePath);
    }
};
