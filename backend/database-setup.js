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

// db.serialize supaya setiap perintah dijalankan secara berurutan
db.serialize(() => {
  console.log("Membuat tabel jika belum ada...");

  // Tabel Projek D (Dokumen)
  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      order_type TEXT NOT NULL,
      description TEXT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabel Projek R&S (Revenue & Sales)
  db.run(`
    CREATE TABLE IF NOT EXISTS revenues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      periode INTEGER,
      cust_order_number TEXT,
      product_label TEXT,
      customer_name TEXT,
      product_name TEXT,
      product_group_name TEXT,
      lccd TEXT,
      regional TEXT,
      witel TEXT,
      rev_type TEXT,
      revenue REAL
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