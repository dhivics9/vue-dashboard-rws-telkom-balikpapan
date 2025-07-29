import pool from '../db.js';

export const getRegionalReport = async (req, res) => {
    const { periode } = req.query;

    if (!periode || periode.length !== 6) {
        return res.status(400).json({ message: 'Parameter "periode" (format YYYYMM) diperlukan.' });
    }

    const periodeInt = parseInt(periode, 10);
    const yearInt = parseInt(periode.substring(0, 4), 10);
    const monthInt = parseInt(periode.substring(4, 6), 10);

    const reportQuery = `
        WITH MonthlyData AS (
            SELECT
                regional,
                SUM(target) as mtd_target,
                SUM(revenue) as mtd_revenue
            FROM public.revenues
            WHERE periode = $1
            GROUP BY regional
        ),
        YearlyData AS (
            SELECT
                regional,
                SUM(target) as ytd_target,
                SUM(revenue) as ytd_revenue
            FROM public.revenues
            WHERE periode >= ($2 * 100 + 1) AND periode <= $1
            GROUP BY regional
        )
        SELECT
            COALESCE(m.regional, y.regional) as regional,
            COALESCE(m.mtd_target, 0) as tgt_mtd,
            COALESCE(m.mtd_revenue, 0) as real_mtd,
            CASE 
                WHEN COALESCE(m.mtd_target, 0) = 0 THEN 0 
                ELSE (COALESCE(m.mtd_revenue, 0) / m.mtd_target) * 100 
            END as ach_mtd,
            RANK() OVER (ORDER BY (CASE WHEN COALESCE(m.mtd_target, 0) = 0 THEN 0 ELSE (COALESCE(m.mtd_revenue, 0) / m.mtd_target) END) DESC) as rank_mtd,
            
            COALESCE(y.ytd_target, 0) as tgt_ytd,
            COALESCE(y.ytd_revenue, 0) as real_ytd,
            CASE 
                WHEN COALESCE(y.ytd_target, 0) = 0 THEN 0 
                ELSE (COALESCE(y.ytd_revenue, 0) / y.ytd_target) * 100 
            END as ach_ytd,
            RANK() OVER (ORDER BY (CASE WHEN COALESCE(y.ytd_target, 0) = 0 THEN 0 ELSE (COALESCE(y.ytd_revenue, 0) / y.ytd_target) END) DESC) as rank_ytd
        FROM MonthlyData m
        FULL OUTER JOIN YearlyData y ON m.regional = y.regional
        ORDER BY regional;
    `;

    try {
        const { rows } = await pool.query(reportQuery, [periodeInt, yearInt]);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching regional report data:", err);
        res.status(500).json({ message: 'Failed to fetch report data.' });
    }
};