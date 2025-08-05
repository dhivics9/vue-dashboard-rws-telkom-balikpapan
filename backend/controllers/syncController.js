import pool from '../db.js';
import XLSX from 'xlsx';
import fs from 'fs';
import { internalFetchRevenueData, internalFetchNcxData, internalFetchSalesData } from './toolController.js';

// --- PERBAIKAN 2: Fungsi untuk membersihkan dan menstandarkan ID ---
const sanitizeId = (id) => {
    if (!id) return null;
    // Hapus semua karakter non-angka ("2-1008" menjadi "21008")
    return id.toString().replace(/[^0-9]/g, ''); 
};

export const startSyncProcess = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'File Target (OGD) diperlukan.' });
    }
    const targetFilePath = req.file.path;
    const client = await pool.connect();
    console.log('Memulai proses sinkronisasi data...');

    try {
        // --- PERBAIKAN 1: Hentikan Race Condition dengan pemanggilan berurutan ---
        console.log('Mengambil data dari API pusat secara berurutan...');
        const ncxData = await internalFetchNcxData();
        const salesData = await internalFetchSalesData();
        const revenueData = await internalFetchRevenueData();
        
        if (!Array.isArray(revenueData) || !Array.isArray(ncxData) || !Array.isArray(salesData)) {
            throw new Error('Salah satu sumber data API tidak mengembalikan array yang valid.');
        }
        
        console.log(`Data diterima: ${revenueData.length} baris revenue, ${ncxData.length} baris NCX, ${salesData.length} baris sales.`);

        const workbook = XLSX.readFile(targetFilePath);
        const sheetName = workbook.SheetNames[0];
        const rawTargetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
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
        const targetData = rawTargetData.map(normalizeKeys);
        console.log(`Data target diterima dan dinormalisasi: ${targetData.length} baris.`);

        console.log('Memasukkan data ke tabel baru...');
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE public.monthly_revenues, public.sales_data, public.orders, public.targets RESTART IDENTITY CASCADE');

        // Load data NCX ke tabel `orders` (dengan ID yang sudah dibersihkan)
        for (const row of ncxData) {
            await client.query(
                `INSERT INTO public.orders (order_id, li_sid, ca_account_name, quote_subtype, li_milestone, order_created_date, billing_activation_date, agree_end_date, agree_status, sa_witel, quote_createdby_name, product_name, bw)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (order_id) DO NOTHING`,
                [sanitizeId(row.ORDER_ID), row.LI_SID, row.CA_ACCOUNT_NAME, row.QUOTE_SUBTYPE, row.LI_MILESTONE, row.ORDER_CREATED_DATE, row.BILLING_ACTIVATION_DATE, row.AGREE_END_DATE, row.AGREE_STATUS, row.SA_WITEL, row.QUOTE_CREATEDBY_NAME, row.LI_PRODUCT_NAME, row.BW]
            );
        }
        
        // Load data Revenue ke tabel `monthly_revenues` (dengan ID yang sudah dibersihkan)
        for (const row of revenueData) {
            const cleanOrderId = sanitizeId(row.Cust_Order_Number);
            if (cleanOrderId) { // Hanya insert jika ada ID
                await client.query(
                    `INSERT INTO public.monthly_revenues (cust_order_number, periode, revenue)
                     SELECT $1, $2, $3 WHERE EXISTS (SELECT 1 FROM public.orders WHERE order_id = $1)`,
                    [cleanOrderId, row.Periode, row.Revenue]
                );
            }
        }
        
        // Load data Sales ke tabel `sales_data` (dengan ID yang sudah dibersihkan)
        for (const row of salesData) {
            const cleanOrderId = sanitizeId(row.Cust_Order_Number);
            if (cleanOrderId) { // Hanya insert jika ada ID
                 await client.query(
                    `INSERT INTO public.sales_data (cust_order_number, product_label, product_group_name, lccd, regional, witel, sales_type, sales_amount)
                     SELECT $1, $2, $3, $4, $5, $6, $7, $8 WHERE EXISTS (SELECT 1 FROM public.orders WHERE order_id = $1)`,
                    [cleanOrderId, row.Product_Label, row.Product_Group_Name, row.LCCD, row.Regional, row.Witel, row.Sales_Type, row.Sales_Amount]
                );
            }
        }

        // Load data Target ke tabel `targets`
        for (const row of targetData) {
            await client.query(
                `INSERT INTO public.targets (periode, regional, witel, customer_type, target, target_rkapp) VALUES ($1, $2, $3, $4, $5, $6)`,
                [row.periode, row.regional, row.witel, row.customer_type, row.target, row.target_rkapp]
            );
        }

        await client.query('COMMIT');
        console.log('Proses sinkronisasi berhasil.');
        res.status(200).json({ message: 'Sinkronisasi data berhasil diselesaikan.' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error selama proses sinkronisasi:", err);
        res.status(500).json({ message: 'Proses sinkronisasi gagal.', error: err.message });
    } finally {
        client.release();
        fs.unlinkSync(targetFilePath);
    }
};
