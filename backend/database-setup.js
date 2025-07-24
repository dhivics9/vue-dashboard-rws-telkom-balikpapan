// File: backend/database-setup.js
import sqlite3 from 'sqlite3';

// lokasi file database
const db = new sqlite3.Database('./database/wholphin.db', (err) => {
  if (err) {
    console.error("Gagal terhubung ke database:", err.message);
  } else {
    console.log("Berhasil terhubung ke database untuk setup.");
  }
});

// --- Setup Database Tables ---
db.serialize(() => {
  console.log("Membuat tabel jika belum ada...");

  // Tabel Projek D (Dokumen)
  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabel INDUK: Menyimpan data umum untuk semua dokumen
  db.run(`
    CREATE TABLE IF NOT EXISTS document_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_type TEXT,
      description TEXT,
      document_id INTEGER NOT NULL UNIQUE,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

  // Tabel untuk 'Berita Acara'
  db.run(`
    CREATE TABLE IF NOT EXISTS details_berita_acara (
      detail_id INTEGER PRIMARY KEY,
      nama_pelanggan TEXT NOT NULL,
      lokasi_kerja TEXT NOT NULL,
      jenis_layanan TEXT NOT NULL,
      mo TEXT NOT NULL,
      SID TEXT NOT NULL,
      bw_prev TEXT NOT NULL,
      bw_new TEXT NOT NULL,
      tanggal_mulai TEXT NOT NULL,
      FOREIGN KEY (detail_id) REFERENCES document_details(id) ON DELETE CASCADE
    )
  `);

  // Tabel untuk 'Surat Pengunduran Diri'
  db.run(`
    CREATE TABLE IF NOT EXISTS details_resign_letter (
      detail_id INTEGER PRIMARY KEY,
      employee_name TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      last_day_of_work TEXT NOT NULL,
      reason TEXT,
      FOREIGN KEY (detail_id) REFERENCES document_details(id) ON DELETE CASCADE
    )
  `);

  console.log("Setup tabel selesai.");
});

// Tutup koneksi database
db.close((err) => {
  if (err) {
    console.error("Gagal menutup koneksi database:", err.message);
  } else {
    console.log("Koneksi database ditutup.");
  }
});