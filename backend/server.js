import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pool from './db.js';

import analyticsRoutes from './routes/analyticsRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import toolRoutes from './routes/toolRoutes.js';
import syncRoutes from './routes/syncRoutes.js';

dotenv.config(); 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

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

app.use('/api/analytics', analyticsRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/sync', syncRoutes);


app.listen(PORT, () => {
  console.log(`Backend server "Wholphin" berjalan di http://localhost:${PORT}`);
});
