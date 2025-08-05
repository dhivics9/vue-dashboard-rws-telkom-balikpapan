import pool from '../db.js';

export const getAnalyticsData = async (req, res) => {
    const { regional, witel, year, month, status } = req.query;
    let whereClauses = [];
    const queryParams = [];
    let paramIndex = 1;

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    try {
        const tableQuery = `
            SELECT 
                o.order_id, o.product_name, o.ca_account_name as customer_name,
                s.regional, s.witel, s.lccd, s.product_group_name as stream, 
                t.customer_type,
                mr.periode, mr.revenue,
                t.target, t.target_rkapp
            FROM public.orders o
            LEFT JOIN public.monthly_revenues mr ON o.order_id = mr.cust_order_number
            LEFT JOIN public.sales_data s ON o.order_id = s.cust_order_number
            LEFT JOIN public.targets t ON s.witel = t.witel AND mr.periode = t.periode
            ${whereString}
            ORDER BY o.order_id, mr.periode;
        `;

        const [summaryRes, tableRes, filterOptionsRes] = await Promise.all([
            pool.query(`SELECT COALESCE(SUM(revenue), 0) as "totalRevenue" FROM public.monthly_revenues`),
            pool.query(tableQuery, queryParams),
            pool.query(`SELECT 
                ARRAY_AGG(DISTINCT regional) as regionals, 
                ARRAY_AGG(DISTINCT witel) as witels,
                ARRAY_AGG(DISTINCT SUBSTRING(periode::text FROM 1 FOR 4)) as years
                FROM public.targets`)
        ]);
        
        res.json({
            summary: summaryRes.rows[0],
            tableData: tableRes.rows,
            filterOptions: {
                regionals: ['All Regionals', ...(filterOptionsRes.rows[0].regionals || []).filter(Boolean).sort()],
                witels: ['All Witels', ...(filterOptionsRes.rows[0].witels || []).filter(Boolean).sort()],
                years: ['All Years', ...(filterOptionsRes.rows[0].years || []).filter(Boolean).sort((a,b) => b-a)],
            }
        });
    } catch (err) {
        console.error("Error fetching analytics data:", err);
        res.status(500).json({ message: 'Failed to fetch analytics data.' });
    }
};
