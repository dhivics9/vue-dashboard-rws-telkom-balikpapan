import pool from '../db.js';
import XLSX from 'xlsx';
import fs from 'fs';

const processExcelFile = (filePath) => {
    if (!filePath) return [];
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    const normalizeKeys = (obj) => {
        const newObj = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const normalizedKey = key.trim().replace(/\s+/g, '_').toLowerCase();
                newObj[normalizedKey] = obj[key];
            }
        }
        return newObj;
    };

    return rawData.map(normalizeKeys);
};

// Fungsi utama untuk memproses semua file
export const uploadAllFiles = async (req, res) => {
    if (!req.files || !req.files.revenueFile || !req.files.ncxFile || !req.files.salesFile || !req.files.targetFile) {
        Object.values(req.files).forEach(fileArray => fs.unlinkSync(fileArray[0].path));
        return res.status(400).json({ message: 'Semua empat file Excel diperlukan.' });
    }

    const files = {
        revenue: req.files.revenueFile[0].path,
        ncx: req.files.ncxFile[0].path,
        sales: req.files.salesFile[0].path,
        target: req.files.targetFile[0].path,
    };

    const client = await pool.connect();
    console.log('Memulai proses upload multi-file...');

    try {
        console.log('Membaca dan menormalisasi semua file Excel...');
        const revenueData = processExcelFile(files.revenue);
        const ncxData = processExcelFile(files.ncx);
        const salesData = processExcelFile(files.sales);
        const targetData = processExcelFile(files.target);
        console.log(`Data diterima: ${revenueData.length} revenue, ${ncxData.length} NCX, ${salesData.length} sales, ${targetData.length} target.`);

        console.log('Memasukkan data ke tabel...');
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE public.revenue_api, public.sales_api, public.ncx_api, public.targets_ogd RESTART IDENTITY');

        for (const row of revenueData) {
            await client.query(
                `INSERT INTO public.revenue_api (periode, cust_order_number, product_label, customer_name, product_name, product_group_name, lccd, regional, witel, rev_type, revenue)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [row.periode, row.cust_order_number, row.product_label, row.customer_name, row.product_name, row.product_group_name, row.lccd, row.regional, row.witel, row.rev_type, row.revenue]
            );
        }
        console.log(`✅ ${revenueData.length} baris dimasukkan ke revenue_api.`);

        for (const row of salesData) {
             await client.query(
                `INSERT INTO public.sales_api (periode, cust_order_number, product_label, customer_name, product_name, product_group_name, lccd, regional, witel, sales_type, sales_amount)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [row.periode, row.cust_order_number, row.product_label, row.customer_name, row.product_name, row.product_group_name, row.lccd, row.regional, row.witel, row.sales_type, row.sales_amount]
            );
        }
        console.log(`✅ ${salesData.length} baris dimasukkan ke sales_api.`);

        for (const row of ncxData) {
            await client.query(
                `INSERT INTO public.ncx_api (li_product_name, ca_account_name, order_id, li_sid, quote_subtype, sa_x_addr_city, sa_x_addr_latitude, sa_x_addr_latitude2, sa_x_addr_longlitude, sa_x_addr_longlitude2, billing_type_cd, price_type_cd, x_mrc_tot_net_pri, x_nrc_tot_net_pri, quote_createdby_name, agree_num, agree_type, agree_end_date, agree_status, li_milestone, order_created_date, sa_witel, sa_account_status, sa_account_address_name, billing_activation_date, billing_activation_status, billcomp_date, li_milestone_date, witel, bw)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)`,
                [row.li_product_name, row.ca_account_name, row.order_id, row.li_sid, row.quote_subtype, row.sa_x_addr_city, row.sa_x_addr_latitude, row.sa_x_addr_latitude2, row.sa_x_addr_longlitude, row.sa_x_addr_longlitude2, row.billing_type_cd, row.price_type_cd, row.x_mrc_tot_net_pri, row.x_nrc_tot_net_pri, row.quote_createdby_name, row.agree_num, row.agree_type, row.agree_end_date, row.agree_status, row.li_milestone, row.order_created_date, row.sa_witel, row.sa_account_status, row.sa_account_address_name, row.billing_activation_date, row.billing_activation_status, row.billcomp_date, row.li_milestone_date, row.witel, row.bw]
            );
        }
        console.log(`✅ ${ncxData.length} baris dimasukkan ke ncx_api.`);

        for (const row of targetData) {
            await client.query(
                `INSERT INTO public.targets_ogd (regional, witel, lccd, stream, product_name, gl_account, bp_number, customer_name, customer_type, target, revenue, periode, target_rkapp)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [row.regional, row.witel, row.lccd, row.stream, row.product_name, row.gl_account, row.bp_number, row.customer_name, row.customer_type, row.target, row.revenue, row.periode, row.target_rkapp]
            );
        }
        console.log(`✅ ${targetData.length} baris dimasukkan ke targets_ogd.`);

        await client.query('COMMIT');
        console.log('Proses upload multi-file berhasil.');
        res.status(200).json({ message: 'Semua data berhasil di-upload dan disimpan.' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error selama proses upload multi-file:", err);
        res.status(500).json({ message: 'Proses upload gagal.', error: err.message });
    } finally {
        client.release();
        Object.values(files).forEach(filePath => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });
    }
};
