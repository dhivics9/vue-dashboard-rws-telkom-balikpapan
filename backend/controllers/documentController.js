import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all documents with details
export const getAllDocuments = async (req, res) => {
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
};


// Get document details by ID
export const getDocumentById = async (req, res) => {
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
        } else if (docType === 'other') {
            query = `SELECT * FROM public.document_details dd JOIN public.documents d ON dd.document_id = d.id WHERE dd.id = $1`;
        } else {
            return res.status(400).json({ message: 'Unknown document type.' });
        }
        
        const { rows } = await pool.query(query, [id]);
        res.json(rows[0]);
    } catch (err) {
        console.error("Error fetching document detail:", err);
        res.status(500).json({ message: 'Failed to fetch document detail.' });
    }
};

// Upload a new document
export const uploadDocument = async (req, res) => {
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

        const docRes = await client.query(
            'INSERT INTO public.documents (file_name, file_path, file_size, file_type) VALUES ($1, $2, $3, $4) RETURNING id',
            [originalname, filePath, size, mimetype]
        );
        const documentId = docRes.rows[0].id;

        const detailRes = await client.query(
            'INSERT INTO public.document_details (document_type, description, document_id) VALUES ($1, $2, $3) RETURNING id',
            [document_type, description, documentId]
        );
        const detailId = detailRes.rows[0].id;
        
        let specificSql, specificParams;
        let requiresSpecificInsert = true;

        switch (document_type) {
            case 'berita_acara':
                specificSql = `INSERT INTO public.details_berita_acara (detail_id, nama_pelanggan, lokasi_kerja, jenis_layanan, mo, sid, bw_prev, bw_new, tanggal_mulai) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
                specificParams = [detailId, specificDetails.nama_pelanggan, specificDetails.lokasi_kerja, specificDetails.jenis_layanan, specificDetails.mo, specificDetails.sid, specificDetails.bw_prev, specificDetails.bw_new, specificDetails.tanggal_mulai];
                break;
            case 'resign_letter':
                specificSql = `INSERT INTO public.details_resign_letter (detail_id, employee_name, employee_id, last_day_of_work, reason) VALUES ($1, $2, $3, $4, $5)`;
                specificParams = [detailId, specificDetails.employee_name, specificDetails.employee_id, specificDetails.last_day_of_work, specificDetails.reason];
                break;
            case 'other':
                requiresSpecificInsert = false;
                break;
            default:
                throw new Error('Invalid document type');
        }

        if (requiresSpecificInsert) {
            await client.query(specificSql, specificParams);
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Document uploaded successfully!', id: detailId });

    } catch (err) {
        await client.query('ROLLBACK');
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        console.error("Error uploading document:", err);
        res.status(500).json({ message: 'Failed to upload document.', error: err.message });
    } finally {
        client.release();
    }
};

// Delete document details
export const deleteDocument = async (req, res) => {
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
};

// Preview document by ID
export const previewDocument = async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query(`SELECT d.file_path FROM public.documents d JOIN public.document_details dd ON d.id = dd.document_id WHERE dd.id = $1`, [id]);
        if (rows.length > 0) {
            const absolutePath = path.resolve(__dirname, '..', rows[0].file_path);
            res.sendFile(absolutePath);
        } else {
            res.status(404).json({ message: 'File not found.' });
        }
    } catch (err) {
        console.error("Error previewing document:", err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Download document by ID
export const downloadDocument = async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query(`SELECT d.file_path, d.file_name FROM public.documents d JOIN public.document_details dd ON d.id = dd.document_id WHERE dd.id = $1`, [id]);
        if (rows.length > 0) {
            const absolutePath = path.resolve(__dirname, '..', rows[0].file_path);
            res.download(absolutePath, rows[0].file_name);
        } else {
            res.status(404).json({ message: 'File not found.' });
        }
    } catch (err) {
        console.error("Error downloading document:", err);
        res.status(500).json({ message: 'Server error.' });
    }
};
