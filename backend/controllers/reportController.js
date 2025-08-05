import pool from '../db.js';

export const getRegionalReport = async (req, res) => {
    const { periode } = req.query;
    if (!periode || periode.length !== 6) {
        return res.status(400).json({ message: 'Parameter "periode" (format YYYYMM) diperlukan.' });
    }

    const periodeInt = parseInt(periode, 10);
    const yearInt = parseInt(periode.substring(0, 4), 10);

    const reportQuery = `
        WITH AllRegionals AS (
            -- Membuat daftar semua regional yang ada di data sales
            SELECT DISTINCT regional FROM public.sales_data WHERE regional IS NOT NULL
        ),
        MonthlyData AS (
            -- Menghitung revenue MTD per regional
            SELECT 
                s.regional,
                SUM(mr.revenue) as mtd_revenue
            FROM public.monthly_revenues mr
            JOIN public.sales_data s ON mr.cust_order_number = s.cust_order_number
            WHERE mr.periode = $1
            GROUP BY s.regional
        ),
        YearlyData AS (
            -- Menghitung revenue YTD per regional
            SELECT 
                s.regional,
                SUM(mr.revenue) as ytd_revenue
            FROM public.monthly_revenues mr
            JOIN public.sales_data s ON mr.cust_order_number = s.cust_order_number
            WHERE mr.periode >= ($2 * 100 + 1) AND mr.periode <= $1
            GROUP BY s.regional
        ),
        TargetData AS (
            -- Menghitung target MTD dan YTD per regional
            SELECT
                regional,
                SUM(CASE WHEN periode = $1 THEN target ELSE 0 END) as mtd_target,
                SUM(target) as ytd_target
            FROM public.targets
            WHERE periode >= ($2 * 100 + 1) AND periode <= $1
            GROUP BY regional
        )
        -- Menggabungkan semua data menggunakan LEFT JOIN dari daftar semua regional
        SELECT
            ar.regional,
            COALESCE(td.mtd_target, 0) as tgt_mtd,
            COALESCE(md.mtd_revenue, 0) as real_mtd,
            CASE WHEN COALESCE(td.mtd_target, 0) = 0 THEN 0 ELSE (COALESCE(md.mtd_revenue, 0) / td.mtd_target) * 100 END as ach_mtd,
            RANK() OVER (ORDER BY (CASE WHEN COALESCE(td.mtd_target, 0) = 0 THEN 0 ELSE (COALESCE(md.mtd_revenue, 0) / td.mtd_target) END) DESC) as rank_mtd,
            
            COALESCE(td.ytd_target, 0) as tgt_ytd,
            COALESCE(yd.ytd_revenue, 0) as real_ytd,
            CASE WHEN COALESCE(td.ytd_target, 0) = 0 THEN 0 ELSE (COALESCE(yd.ytd_revenue, 0) / td.ytd_target) * 100 END as ach_ytd,
            RANK() OVER (ORDER BY (CASE WHEN COALESCE(td.ytd_target, 0) = 0 THEN 0 ELSE (COALESCE(yd.ytd_revenue, 0) / td.ytd_target) END) DESC) as rank_ytd
        FROM AllRegionals ar
        LEFT JOIN MonthlyData md ON ar.regional = md.regional
        LEFT JOIN YearlyData yd ON ar.regional = yd.regional
        LEFT JOIN TargetData td ON ar.regional = td.regional
        ORDER BY ar.regional;
    `;

    try {
        const { rows } = await pool.query(reportQuery, [periodeInt, yearInt]);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching regional report data:", err);
        res.status(500).json({ message: 'Failed to fetch report data.' });
    }
};
