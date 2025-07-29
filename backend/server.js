// --- Import Package ---
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import pg from 'pg';
import XLSX from 'xlsx';

dotenv.config(); 
const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.connect(async (err, client, release) => {
  if (err) {
    return console.error('Error acquiring client for connection test:', err.stack);
  }
  try {
    const res = await client.query('SELECT current_database()');
    console.log('Successfully connected to PostgreSQL. Current database:', res.rows[0].current_database);
  } catch (dbErr) {
    console.error('Error during database connection test:', dbErr.stack);
  }
  release();
});

const app = express();
const PORT = 3000;
const allowedOrigins = [
  'http://localhost:5173',
  'http://192.168.56.1:5173',
  'http://192.168.1.4:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });
const tempUpload = multer({ dest: 'uploads/' });

app.get('/api/reports/regional', async (req, res) => {
    // Ambil parameter periode dari URL, contoh: ?periode=202506
    const { periode } = req.query;

    if (!periode || periode.length !== 6) {
        return res.status(400).json({ message: 'Parameter "periode" (format YYYYMM) diperlukan.' });
    }

    const year = periode.substring(0, 4);
    const month = periode.substring(4, 6);
    const reportQuery = `
        WITH MonthlyData AS (
            -- 1. Ambil data hanya untuk bulan yang dipilih
            SELECT
                regional,
                SUM(target) as mtd_target,
                SUM(revenue) as mtd_revenue
            FROM public.revenues
            WHERE periode = $1
            GROUP BY regional
        ),
        YearlyData AS (
            -- 2. Ambil data dari awal tahun hingga bulan yang dipilih
            SELECT
                regional,
                SUM(target) as ytd_target,
                SUM(revenue) as ytd_revenue
            FROM public.revenues
            WHERE SUBSTRING(periode::text FROM 1 FOR 4) = $2 -- Filter berdasarkan tahun
              AND SUBSTRING(periode::text FROM 5 FOR 2)::int <= $3 -- Filter hingga bulan yang dipilih
            GROUP BY regional
        )
        -- 3. Gabungkan semuanya dan hitung kolom-kolom kalkulasi
        SELECT
            COALESCE(m.regional, y.regional) as regional,
            COALESCE(m.mtd_target, 0) as tgt_mtd,
            COALESCE(m.mtd_revenue, 0) as real_mtd,
            -- Hitung Achievement MTD (hindari pembagian dengan nol)
            CASE 
                WHEN COALESCE(m.mtd_target, 0) = 0 THEN 0 
                ELSE (COALESCE(m.mtd_revenue, 0) / m.mtd_target) * 100 
            END as ach_mtd,
            -- Buat peringkat berdasarkan Achievement MTD
            RANK() OVER (ORDER BY (CASE WHEN COALESCE(m.mtd_target, 0) = 0 THEN 0 ELSE (COALESCE(m.mtd_revenue, 0) / m.mtd_target) END) DESC) as rank_mtd,
            
            COALESCE(y.ytd_target, 0) as tgt_ytd,
            COALESCE(y.ytd_revenue, 0) as real_ytd,
            -- Hitung Achievement YTD
            CASE 
                WHEN COALESCE(y.ytd_target, 0) = 0 THEN 0 
                ELSE (COALESCE(y.ytd_revenue, 0) / y.ytd_target) * 100 
            END as ach_ytd,
            RANK() OVER (ORDER BY (CASE WHEN COALESCE(y.ytd_target, 0) = 0 THEN 0 ELSE (COALESCE(y.ytd_revenue, 0) / y.ytd_target) END) DESC) as rank_ytd
        FROM MonthlyData m
        FULL OUTER JOIN YearlyData y ON m.regional = y.regional
        ORDER BY m.regional;
    `;

    try {
        const { rows } = await pool.query(reportQuery, [periode, year, month]);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching regional report data:", err);
        res.status(500).json({ message: 'Failed to fetch report data.' });
    }
});


app.post('/api/analytics/upload', tempUpload.single('analyticsFile'), async (req, res) => {
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
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `;
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
});

app.get('/api/analytics/data', async (req, res) => {
    try {
        const [summaryRes, tableRes, filterOptionsRes] = await Promise.all([
            pool.query(`SELECT COALESCE(SUM(revenue), 0) as "totalRevenue" FROM public.revenues`),
            pool.query('SELECT * FROM public.revenues ORDER BY id'),
            pool.query(`SELECT ARRAY_AGG(DISTINCT regional) as regionals, ARRAY_AGG(DISTINCT witel) as witels FROM public.revenues`)
        ]);
        res.json({
            summary: summaryRes.rows[0],
            tableData: tableRes.rows,
            filterOptions: {
                regionals: ['All Regionals', ...(filterOptionsRes.rows[0].regionals || []).sort()],
                witels: ['All Witels', ...(filterOptionsRes.rows[0].witels || []).sort()],
            }
        });
    } catch (err) {
        console.error("Error fetching analytics data:", err);
        res.status(500).json({ message: 'Failed to fetch analytics data.' });
    }
});

app.get('/api/documents', async (req, res) => {
  const sql = `
    SELECT dd.id, dd.document_type, d.file_name, d.file_type, d.upload_timestamp,
           COALESCE(dba.nama_pelanggan, drl.employee_name) as primary_subject
    FROM public.document_details dd
    JOIN public.documents d ON dd.document_id = d.id
    LEFT JOIN public.details_berita_acara dba ON dd.id = dba.detail_id
    LEFT JOIN public.details_resign_letter drl ON dd.id = drl.detail_id
    ORDER BY d.upload_timestamp DESC`;
  try {
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ message: 'Failed to fetch documents.' });
  }
});

app.get('/api/documents/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const typeRes = await pool.query("SELECT document_type FROM public.document_details WHERE id = $1", [id]);
        if (typeRes.rows.length === 0) {
            return res.status(404).json({ message: 'Document not found.' });
        }
        const docType = typeRes.rows[0].document_type;
        let query;
        if (docType === 'berita_acara') {
            query = `SELECT * FROM public.document_details dd JOIN public.documents d ON dd.document_id = d.id JOIN public.details_berita_acara dba ON dd.id = dba.detail_id WHERE dd.id = $1`;
        } else if (docType === 'resign_letter') {
            query = `SELECT * FROM public.document_details dd JOIN public.documents d ON dd.document_id = d.id JOIN public.details_resign_letter drl ON dd.id = drl.detail_id WHERE dd.id = $1`;
        } else {
            return res.status(400).json({ message: 'Unknown document type.' });
        }
        const { rows } = await pool.query(query, [id]);
        res.json(rows[0]);
    } catch (err) {
        console.error("Error fetching document detail:", err);
        res.status(500).json({ message: 'Failed to fetch document detail.' });
    }
});

app.post('/api/documents', upload.single('documentFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'File is required.' });
    const { originalname, path: filePath, size, mimetype } = req.file;
    const { document_type, description, ...specificDetails } = req.body;
    if (!document_type) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ message: 'document_type is required.' });
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const docRes = await client.query('INSERT INTO public.documents (file_name, file_path, file_size, file_type) VALUES ($1, $2, $3, $4) RETURNING id', [originalname, filePath, size, mimetype]);
        const documentId = docRes.rows[0].id;
        const detailRes = await client.query('INSERT INTO public.document_details (document_type, description, document_id) VALUES ($1, $2, $3) RETURNING id', [document_type, description, documentId]);
        const detailId = detailRes.rows[0].id;
        let specificSql, specificParams;
        if (document_type === 'berita_acara') {
            specificSql = `INSERT INTO public.details_berita_acara (detail_id, nama_pelanggan, lokasi_kerja, jenis_layanan, mo, sid, bw_prev, bw_new, tanggal_mulai) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
            specificParams = [detailId, specificDetails.nama_pelanggan, specificDetails.lokasi_kerja, specificDetails.jenis_layanan, specificDetails.mo, specificDetails.sid, specificDetails.bw_prev, specificDetails.bw_new, specificDetails.tanggal_mulai];
        } else if (document_type === 'resign_letter') {
            specificSql = `INSERT INTO public.details_resign_letter (detail_id, employee_name, employee_id, last_day_of_work, reason) VALUES ($1, $2, $3, $4, $5)`;
            specificParams = [detailId, specificDetails.employee_name, specificDetails.employee_id, specificDetails.last_day_of_work, specificDetails.reason];
        } else {
            throw new Error('Invalid document type');
        }
        await client.query(specificSql, specificParams);
        await client.query('COMMIT');
        res.status(201).json({ message: 'Document uploaded successfully!', id: detailId });
    } catch (err) {
        await client.query('ROLLBACK');
        fs.unlinkSync(filePath);
        console.error("Error uploading document:", err);
        res.status(500).json({ message: 'Failed to upload document.', error: err.message });
    } finally {
        client.release();
    }
});

app.delete('/api/documents/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const fileRes = await client.query(`SELECT d.file_path FROM public.documents d JOIN public.document_details dd ON d.id = dd.document_id WHERE dd.id = $1`, [id]);
        if (fileRes.rows.length === 0) {
            throw new Error('Document not found');
        }
        const filePath = fileRes.rows[0].file_path;
        await client.query("DELETE FROM public.document_details WHERE id = $1", [id]);
        fs.unlink(filePath, (err) => {
            if (err) console.error("Failed to delete physical file:", err);
        });
        await client.query('COMMIT');
        res.status(200).json({ message: 'Document deleted successfully.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error deleting document:", err);
        res.status(err.message === 'Document not found' ? 404 : 500).json({ message: 'Failed to delete document.' });
    } finally {
        client.release();
    }
});

app.get('/api/documents/:id/preview', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query(`SELECT d.file_path FROM public.documents d JOIN public.document_details dd ON d.id = dd.document_id WHERE dd.id = $1`, [id]);
        if (rows.length > 0) {
            const absolutePath = path.resolve(__dirname, rows[0].file_path);
            res.sendFile(absolutePath);
        } else {
            res.status(404).json({ message: 'File not found.' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

app.get('/api/documents/:id/download', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query(`SELECT d.file_path, d.file_name FROM public.documents d JOIN public.document_details dd ON d.id = dd.document_id WHERE dd.id = $1`, [id]);
        if (rows.length > 0) {
            res.download(rows[0].file_path, rows[0].file_name);
        } else {
            res.status(404).json({ message: 'File not found.' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// --- Running Server ---
app.listen(PORT, () => {
  console.log(`Backend server "Wholphin" berjalan di http://localhost:${PORT}`);
});
