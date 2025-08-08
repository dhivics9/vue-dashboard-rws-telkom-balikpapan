// File: backend/controllers/reportController.js
import pool from '../db.js';

export const getRegionalReport = async (req, res) => {
    const { periode } = req.query;
    if (!periode || periode.length !== 6) {
        return res.status(400).json({ message: 'Parameter "periode" (format YYYYMM) diperlukan.' });
    }

    const periodeInt = parseInt(periode, 10);
    const yearInt = parseInt(periode.substring(0, 4), 10);
    const monthInt = parseInt(periode.substring(4, 6), 10);

    // --- QUERY BARU YANG JAUH LEBIH SEDERHANA (HANYA DARI targets_ogd) ---
    const reportQuery = `
        WITH AggregatedData AS (
            SELECT
                regional,
                -- Hitung total MTD (Month-to-Date)
                SUM(CASE WHEN periode = $1 THEN target ELSE 0 END) as tgt_mtd,
                SUM(CASE WHEN periode = $1 THEN revenue ELSE 0 END) as real_mtd,
                -- Hitung total YTD (Year-to-Date)
                SUM(CASE WHEN periode >= ($2 * 100 + 1) AND periode <= $1 THEN target ELSE 0 END) as tgt_ytd,
                SUM(CASE WHEN periode >= ($2 * 100 + 1) AND periode <= $1 THEN revenue ELSE 0 END) as real_ytd
            FROM 
                public.targets_ogd
            WHERE 
                SUBSTRING(periode::text FROM 1 FOR 4) = $2::text -- Filter hanya untuk tahun yang relevan
            GROUP BY 
                regional
        )
        -- Hitung kolom kalkulasi (ACH & RANK) dari data yang sudah diagregasi
        SELECT
            regional,
            tgt_mtd,
            real_mtd,
            CASE WHEN tgt_mtd = 0 THEN 0 ELSE (real_mtd / tgt_mtd) * 100 END as ach_mtd,
            RANK() OVER (ORDER BY (CASE WHEN tgt_mtd = 0 THEN 0 ELSE (real_mtd / tgt_mtd) END) DESC) as rank_mtd,
            tgt_ytd,
            real_ytd,
            CASE WHEN tgt_ytd = 0 THEN 0 ELSE (real_ytd / tgt_ytd) * 100 END as ach_ytd,
            RANK() OVER (ORDER BY (CASE WHEN tgt_ytd = 0 THEN 0 ELSE (real_ytd / tgt_ytd) END) DESC) as rank_ytd
        FROM 
            AggregatedData
        ORDER BY 
            regional;
    `;

    try {
        const { rows } = await pool.query(reportQuery, [periodeInt, yearInt]);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching regional report data:", err);
        res.status(500).json({ message: 'Failed to fetch report data.' });
    }
};

export const getProductSummaryReport = async (req, res) => {
    // Ambil semua filter dari query string
    const { periode, regional, witel, lccd, stream, customer_type } = req.query;

    if (!periode || periode.length !== 6) {
        return res.status(400).json({ message: 'Parameter "periode" (format YYYYMM) diperlukan.' });
    }

    let whereClauses = ['periode = $1'];
    const queryParams = [parseInt(periode, 10)];
    let paramIndex = 2;

    // Bangun klausa WHERE secara dinamis
    if (regional && regional !== 'All') {
        whereClauses.push(`regional = $${paramIndex++}`);
        queryParams.push(regional);
    }
    if (witel && witel !== 'All') {
        whereClauses.push(`witel = $${paramIndex++}`);
        queryParams.push(witel);
    }
    if (lccd && lccd !== 'All') {
        whereClauses.push(`lccd = $${paramIndex++}`);
        queryParams.push(lccd);
    }
    if (stream && stream !== 'All') {
        whereClauses.push(`stream = $${paramIndex++}`);
        queryParams.push(stream);
    }
    if (customer_type && customer_type !== 'All') {
        whereClauses.push(`customer_type = $${paramIndex++}`);
        queryParams.push(customer_type);
    }
    const whereString = `WHERE ${whereClauses.join(' AND ')}`;

    // Query ini mengambil data detail, dikelompokkan per produk dan pelanggan
    const query = `
        SELECT
            product_name,
            customer_name,
            SUM(target) as sum_target,
            SUM(revenue) as sum_revenue
        FROM
            public.targets_ogd
        ${whereString}
        GROUP BY
            product_name, customer_name
        ORDER BY
            product_name, customer_name;
    `;

    try {
        const { rows } = await pool.query(query, queryParams);

        // --- Transformasi data dari "datar" menjadi "hierarkis" ---
        const report = {};
        rows.forEach(row => {
            if (!report[row.product_name]) {
                // Jika produk ini baru pertama kali ditemukan, buat entri baru
                report[row.product_name] = {
                    product_name: row.product_name,
                    total_target: 0,
                    total_revenue: 0,
                    customers: []
                };
            }
            // Tambahkan data pelanggan ke dalam produk yang sesuai
            report[row.product_name].customers.push({
                customer_name: row.customer_name,
                target: parseFloat(row.sum_target),
                revenue: parseFloat(row.sum_revenue)
            });
            // Akumulasi total untuk produk
            report[row.product_name].total_target += parseFloat(row.sum_target);
            report[row.product_name].total_revenue += parseFloat(row.sum_revenue);
        });

        // Ubah objek menjadi array untuk dikirim ke frontend
        const finalReport = Object.values(report);

        res.json(finalReport);

    } catch (err) {
        console.error("Error fetching product summary report:", err);
        res.status(500).json({ message: 'Failed to fetch report data.' });
    }
};

