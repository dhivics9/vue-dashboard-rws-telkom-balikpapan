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

// Middleware untuk mengizinkan frontend mengakses backend
app.use(cors({ origin: 'http://localhost:5173' })); // Sesuaikan dengan url nanti kalo berubah
// Middleware untuk membaca body JSON
app.use(express.json());



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
app.post('/api/documents/upload', upload.single('documentFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Tidak ada file yang di-upload.' });
  }

  const { customerName, orderType, description } = req.body;
  const { originalname, path: filePath } = req.file;

  const sql = `INSERT INTO documents (customer_name, order_type, description, file_name, file_path) VALUES (?, ?, ?, ?, ?)`;
  const params = [customerName, orderType, description, originalname, filePath];

  db.run(sql, params, function(err) {
    if (err) {
      console.error("Error database saat menyimpan dokumen:", err.message);
      return res.status(500).json({ message: 'Gagal menyimpan catatan dokumen.' });
    }
    res.status(201).json({ message: 'Dokumen berhasil di-upload dan dicatat!' });
  });
});

// Endpoint untuk GET ALL dokumen
app.get('/api/documents', (req, res) => {
  const sql = "SELECT * FROM documents ORDER BY upload_timestamp DESC";
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Error database saat mengambil daftar dokumen:", err.message);
      return res.status(500).json({ message: 'Gagal mengambil daftar dokumen.' });
    }
    res.json(rows);
  });
});

// Endpoint untuk GET DETAIL satu dokumen
app.get('/api/documents/:id', (req, res) => {
  //Konversi 'id' dari string menjadi integer
  const docId = parseInt(req.params.id, 10);

  if (isNaN(docId)) {
    return res.status(400).json({ message: 'Invalid document ID.' });
  }

  const sql = "SELECT * FROM documents WHERE id = ?";
  
  db.get(sql, [docId], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Error database.' });
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ message: 'Dokumen tidak ditemukan.' });
    }
  });
});

// Endpoint untuk DELETE sebuah dokumen
app.delete('/api/documents/:id', (req, res) => {
  const docId = parseInt(req.params.id, 10); // <-- Tambahkan parseInt
  if (isNaN(docId)) return res.status(400).json({ message: 'Invalid ID' });

  db.get("SELECT file_path FROM documents WHERE id = ?", [docId], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Error saat mencari file.' });
    }
    if (row) {
      const filePath = row.file_path;

      // Hapus file fisik
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          // Tetap lanjutkan meskipun file tidak ditemukan, mungkin sudah terhapus
          console.error("Gagal menghapus file fisik:", unlinkErr.message);
        }

        // Hapus catatan dari database
        db.run("DELETE FROM documents WHERE id = ?", [docId], function(dbErr) {
          if (dbErr) {
            return res.status(500).json({ message: 'Gagal menghapus catatan dari database.' });
          }
          res.status(200).json({ message: 'Dokumen berhasil dihapus.' });
        });
      });
    } else {
      res.status(404).json({ message: 'Dokumen tidak ditemukan.' });
    }
  });
});

app.get('/api/documents/preview/:id', (req, res) => {
  const docId = parseInt(req.params.id, 10);
  if (isNaN(docId)) return res.status(400).json({ message: 'Invalid ID' });

  const sql = "SELECT file_path FROM documents WHERE id = ?";

  db.get(sql, [docId], (err, row) => {
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
app.get('/api/documents/download/:id', (req, res) => {
  const docId = parseInt(req.params.id, 10); // <-- Tambahkan parseInt
  if (isNaN(docId)) return res.status(400).json({ message: 'Invalid ID' });

  const sql = "SELECT file_path FROM documents WHERE id = ?";
  db.get(sql, [docId], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Error database.' });
    }
    if (row) {
      // res.download akan mengirim file ke pengguna
      res.download(row.file_path);
    } else {
      res.status(404).json({ message: 'File tidak ditemukan.' });
    }
  });
});

// --- Running Server ---
app.listen(PORT, () => {
  console.log(`Backend server "Wholphin" berjalan di http://localhost:${PORT}`);
});