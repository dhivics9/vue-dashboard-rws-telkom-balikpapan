import dotenv from 'dotenv';
import pg from 'pg';


dotenv.config(); 
const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function runTest() {
  console.log('--- Memulai Tes Koneksi Database ---');
  const client = await pool.connect();
  
  try {
    const dbNameRes = await client.query('SELECT current_database()');
    console.log(`[OK] Berhasil terhubung ke database: ${dbNameRes.rows[0].current_database}`);
    console.log("\nMencoba mengambil daftar tabel dari schema 'public'...");
    const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    `);

    if (tablesRes.rows.length > 0) {
        console.log('[OK] Tabel yang ditemukan:');
        tablesRes.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
    } else {
        console.error('[GAGAL] Tidak ada tabel yang ditemukan di dalam schema public pada database ini.');
    }

  } catch (err) {
    console.error('\n--- TES GAGAL ---');
    console.error('Terjadi error saat menjalankan query:', err);
  } finally {
    await client.release();
    await pool.end();
    console.log('\n--- Tes Selesai ---');
  }
}

runTest();
