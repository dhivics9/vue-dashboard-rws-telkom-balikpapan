// File: backend/server.js

// --- Import Package ---
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Inisialisasi dan konfigurasi ---
const app = express();
const PORT = 3000;
const db = new sqlite3.Database('./database/wholphin.db');


app.use(cors({ origin: 'http://localhost:5173' })); // Sesuaikan dengan url nanti kalo berubah
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- konfigurasi Multer untuk Menyimpan File ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Simpan file di folder 'uploads/'
  },
  filename: function (req, file, cb) {
    // fungsi untuk membuat nama file yang unik untuk menghindari tumpang tindih
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// --- API Endpoints untuk Projek D (Dokumen) ---

// Endpoint untuk UPLOAD dokumen baru
app.post('/api/documents', upload.single('documentFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'File dokumen tidak boleh kosong.' });
    }
    
    // Data dari file yang diupload
    const { originalname, path: filePath, size, mimetype } = req.file;
    const { document_type, description, ...specificDetails } = req.body;

    if (!document_type) {
        fs.unlinkSync(filePath); 
        return res.status(400).json({ message: '`document_type` harus diisi.' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const docSql = `INSERT INTO documents (file_name, file_path, file_size, file_type) VALUES (?, ?, ?, ?)`;
        db.run(docSql, [originalname, filePath, size, mimetype], function (err) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Gagal menyimpan file.', error: err.message });
            }
            const documentId = this.lastID;

            const detailSql = `INSERT INTO document_details (document_type, description, document_id) VALUES (?, ?, ?)`;
            db.run(detailSql, [document_type, description, documentId], function (err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ message: 'Gagal menyimpan detail dokumen.', error: err.message });
                }
                const detailId = this.lastID;

                let specificSql;
                let specificParams;
                
                switch (document_type) {
                    case 'berita_acara':
                        specificSql = `INSERT INTO details_berita_acara (detail_id, nama_pelanggan, lokasi_kerja, jenis_layanan, mo, SID, bw_prev, bw_new, tanggal_mulai) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                        specificParams = [detailId, specificDetails.nama_pelanggan, specificDetails.lokasi_kerja, specificDetails.jenis_layanan, specificDetails.mo, specificDetails.SID, specificDetails.bw_prev, specificDetails.bw_new, specificDetails.tanggal_mulai];
                        break;
                    case 'resign_letter':
                        specificSql = `INSERT INTO details_resign_letter (detail_id, employee_name, employee_id, last_day_of_work, reason) VALUES (?, ?, ?, ?, ?)`;
                        specificParams = [detailId, specificDetails.employee_name, specificDetails.employee_id, specificDetails.last_day_of_work, specificDetails.reason];
                        break;
                    default:
                        db.run('ROLLBACK');
                        return res.status(400).json({ message: 'Tipe dokumen tidak valid.' });
                }

                db.run(specificSql, specificParams, function (err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ message: 'Gagal menyimpan detail spesifik.', error: err.message });
                    }
                    db.run('COMMIT');
                    res.status(201).json({ message: 'Dokumen berhasil di-upload!', id: detailId });
                });
            });
        });
    });
});

// Endpoint untuk GET ALL dokumen
app.get('/api/documents', (req, res) => {
    const sql = `
        SELECT 
            dd.id,
            dd.document_type,
            d.file_name,
            d.file_type,          -- PASTIKAN BARIS INI ADA
            d.upload_timestamp,
            COALESCE(dba.nama_pelanggan, drl.employee_name) as primary_subject
        FROM 
            document_details dd
        JOIN 
            documents d ON dd.document_id = d.id
        LEFT JOIN 
            details_berita_acara dba ON dd.id = dba.detail_id
        LEFT JOIN 
            details_resign_letter drl ON dd.id = drl.detail_id
        ORDER BY 
            d.upload_timestamp DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Error database saat GET all:", err.message);
            return res.status(500).json({ message: 'Gagal mengambil daftar dokumen.' });
        }
        res.json(rows);
    });
});

// Endpoint untuk GET DETAIL satu dokumen
app.get('/api/documents/:id', (req, res) => {
    const { id } = req.params;

    const getTypeSql = "SELECT document_type FROM document_details WHERE id = ?";
    db.get(getTypeSql, [id], (err, detail) => {
        if (err) {
            return res.status(500).json({ message: 'Error database.' });
        }
        if (!detail) {
            return res.status(404).json({ message: 'Dokumen tidak ditemukan.' });
        }

        let query;
        const documentType = detail.document_type;

        switch (documentType) {
            case 'berita_acara':
                query = `
                    SELECT * FROM document_details dd
                    JOIN documents d ON dd.document_id = d.id
                    JOIN details_berita_acara dba ON dd.id = dba.detail_id
                    WHERE dd.id = ?
                `;
                break;
            case 'resign_letter':
                 query = `
                    SELECT * FROM document_details dd
                    JOIN documents d ON dd.document_id = d.id
                    JOIN details_resign_letter drl ON dd.id = drl.detail_id
                    WHERE dd.id = ?
                `;
                break;
            default:
                return res.status(400).json({ message: 'Tipe dokumen tidak dikenal.' });
        }

        db.get(query, [id], (err, row) => {
            if (err) {
                return res.status(500).json({ message: 'Gagal mengambil detail dokumen.' });
            }
            res.json(row);
        });
    });
});

// Endpoint untuk DELETE sebuah dokumen
app.delete('/api/documents/:id', (req, res) => {
    const { id } = req.params;

    const findFileSql = `
        SELECT d.file_path 
        FROM documents d
        JOIN document_details dd ON d.id = dd.document_id
        WHERE dd.id = ?
    `;
    db.get(findFileSql, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Error mencari file.' });
        }
        if (!row) {
            return res.status(404).json({ message: 'Dokumen tidak ditemukan untuk dihapus.' });
        }

        const filePath = row.file_path;

        const deleteSql = "DELETE FROM document_details WHERE id = ?";
        db.run(deleteSql, [id], function (err) {
            if (err) {
                return res.status(500).json({ message: 'Gagal menghapus catatan dari database.' });
            }

            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error("Gagal menghapus file fisik:", unlinkErr.message);
                }
                res.status(200).json({ message: 'Dokumen berhasil dihapus.' });
            });
        });
    });
});

app.get('/api/documents/:id/preview', (req, res) => {
    const detailId = parseInt(req.params.id, 10);
    if (isNaN(detailId)) return res.status(400).json({ message: 'Invalid ID' });

    const sql = `
        SELECT d.file_path 
        FROM documents d
        JOIN document_details dd ON d.id = dd.document_id
        WHERE dd.id = ?
    `;

    db.get(sql, [detailId], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Error database.' });
        }
        if (row) {
            const absolutePath = path.resolve(__dirname, row.file_path);
            res.sendFile(absolutePath);
        } else {
            res.status(404).json({ message: 'File tidak ditemukan.' });
        }
    });
});

// Endpoint untuk DOWNLOAD sebuah dokumen
app.get('/api/documents/:id/download', (req, res) => {
    const detailId = parseInt(req.params.id, 10);
    if (isNaN(detailId)) return res.status(400).json({ message: 'Invalid ID' });

    const sql = `
        SELECT d.file_path, d.file_name
        FROM documents d
        JOIN document_details dd ON d.id = dd.document_id
        WHERE dd.id = ?
    `;

    db.get(sql, [detailId], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Error database.' });
        }
        if (row) {
            res.download(row.file_path, row.file_name);
        } else {
            res.status(404).json({ message: 'File tidak ditemukan.' });
        }
    });
});

// --- Running Server ---
app.listen(PORT, () => {
  console.log(`Backend server "Wholphin" berjalan di http://localhost:${PORT}`);
});