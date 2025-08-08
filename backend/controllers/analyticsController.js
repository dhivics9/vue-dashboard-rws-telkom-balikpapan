import pool from '../db.js';

export const getAnalyticsData = async (req, res) => {
    console.log('📡 Received request parameters:', req.query);
    
    const { 
        page = 1, 
        limit = 10, 
        regional, 
        witel, 
        lccd, 
        stream, 
        customer_type: customerType,
        year,
        month
    } = req.query;
    
    const currentPage = parseInt(page, 10);
    const itemsLimit = parseInt(limit, 10);
    const offset = (currentPage - 1) * itemsLimit;

    let whereClauses = [];
    const queryParams = [];
    let paramIndex = 1;

    // Filter berdasarkan parameter yang diterima
    if (regional && regional !== 'All Regionals' && regional !== 'All') {
        whereClauses.push(`regional = $${paramIndex++}`);
        queryParams.push(regional);
        console.log('🔍 Filter by regional:', regional);
    }
    
    if (witel && witel !== 'All Witels' && witel !== 'All') {
        whereClauses.push(`witel = $${paramIndex++}`);
        queryParams.push(witel);
        console.log('🔍 Filter by witel:', witel);
    }
    
    if (lccd && lccd !== 'All LCCDs' && lccd !== 'All') {
        whereClauses.push(`lccd = $${paramIndex++}`);
        queryParams.push(lccd);
        console.log('🔍 Filter by lccd:', lccd);
    }
    
    if (stream && stream !== 'All Streams' && stream !== 'All') {
        whereClauses.push(`stream = $${paramIndex++}`);
        queryParams.push(stream);
        console.log('🔍 Filter by stream:', stream);
    }
    
    if (customerType && customerType !== 'All Customer Types' && customerType !== 'All') {
        whereClauses.push(`customer_type = $${paramIndex++}`);
        queryParams.push(customerType);
        console.log('🔍 Filter by customer_type:', customerType);
    }
    
    // Filter berdasarkan tahun
    if (year && year !== 'All Years' && year !== 'All') {
        whereClauses.push(`SUBSTRING(periode::text FROM 1 FOR 4) = $${paramIndex++}`);
        queryParams.push(year);
        console.log('🔍 Filter by year:', year);
    }
    
    // Filter berdasarkan bulan
    if (month && month !== 'All' && month !== 'All Months') {
        whereClauses.push(`SUBSTRING(periode::text FROM 5 FOR 2) = $${paramIndex++}`);
        queryParams.push(month.padStart(2, '0'));
        console.log('🔍 Filter by month:', month);
    }
    
    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    console.log('📝 SQL WHERE clause:', whereString);
    console.log('📝 Query parameters:', queryParams);
    
    try {
        const dataQuery = `
            SELECT * FROM public.targets_ogd 
            ${whereString} 
            ORDER BY periode DESC, regional, witel 
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        
        const countQuery = `
            SELECT COUNT(*) as total FROM public.targets_ogd 
            ${whereString}
        `;
        
        const filterOptionsQuery = `
            SELECT 
                ARRAY_AGG(DISTINCT regional ORDER BY regional) as regionals, 
                ARRAY_AGG(DISTINCT witel ORDER BY witel) as witels,
                ARRAY_AGG(DISTINCT lccd ORDER BY lccd) as lccds,
                ARRAY_AGG(DISTINCT stream ORDER BY stream) as streams,
                ARRAY_AGG(DISTINCT customer_type ORDER BY customer_type) as "customerTypes",
                ARRAY_AGG(DISTINCT SUBSTRING(periode::text FROM 1 FOR 4) ORDER BY SUBSTRING(periode::text FROM 1 FOR 4) DESC) as years
            FROM public.targets_ogd
            WHERE regional IS NOT NULL 
            AND witel IS NOT NULL 
            AND periode IS NOT NULL
        `;
        
        console.log('🗃️ Executing queries...');
        const [tableRes, countRes, filterOptionsRes] = await Promise.all([
            pool.query(dataQuery, [...queryParams, itemsLimit, offset]),
            pool.query(countQuery, queryParams),
            pool.query(filterOptionsQuery)
        ]);
        
        const totalItems = parseInt(countRes.rows[0].total, 10);
        
        console.log(`✅ Found ${totalItems} total records, returning ${tableRes.rows.length} records for page ${currentPage}`);

        res.json({
            tableData: tableRes.rows,
            totalItems: totalItems,
            currentPage: currentPage,
            totalPages: Math.ceil(totalItems / itemsLimit),
            filterOptions: {
                regionals: ['All Regionals', ...(filterOptionsRes.rows[0]?.regionals || []).filter(Boolean)],
                witels: ['All Witels', ...(filterOptionsRes.rows[0]?.witels || []).filter(Boolean)],
                lccds: ['All LCCDs', ...(filterOptionsRes.rows[0]?.lccds || []).filter(Boolean)],
                streams: ['All Streams', ...(filterOptionsRes.rows[0]?.streams || []).filter(Boolean)],
                customerTypes: ['All Customer Types', ...(filterOptionsRes.rows[0]?.customerTypes || []).filter(Boolean)],
                years: ['All Years', ...(filterOptionsRes.rows[0]?.years || []).filter(Boolean)],
            }
        });
        
    } catch (err) {
        console.error("❌ Error fetching analytics data:", err);
        res.status(500).json({ message: 'Failed to fetch analytics data.' });
    }
};

// Tambahkan function untuk homepage summary
export const getHomepageSummary = async (req, res) => {
    try {
        console.log('🏠 Fetching homepage summary...');
        
        const summaryQuery = `
            SELECT 
                COALESCE(SUM(revenue), 0) as total_revenue,
                COALESCE(SUM(target), 0) as total_target,
                COUNT(DISTINCT customer_name) as active_customers,
                CASE 
                    WHEN SUM(target) > 0 THEN (SUM(revenue) / SUM(target)) * 100 
                    ELSE 0 
                END as achievement,
                COUNT(*) as total_records
            FROM public.targets_ogd
            WHERE SUBSTRING(periode::text FROM 1 FOR 4) = EXTRACT(YEAR FROM CURRENT_DATE)::text
        `;

        const trendQuery = `
            SELECT 
                EXTRACT(MONTH FROM TO_DATE(periode::text, 'YYYYMM')) as month,
                SUM(revenue) as monthly_revenue
            FROM public.targets_ogd
            WHERE SUBSTRING(periode::text FROM 1 FOR 4) = EXTRACT(YEAR FROM CURRENT_DATE)::text
            GROUP BY EXTRACT(MONTH FROM TO_DATE(periode::text, 'YYYYMM'))
            ORDER BY month
        `;

        const topRegionalsQuery = `
            SELECT 
                regional,
                SUM(revenue) as total_revenue
            FROM public.targets_ogd
            WHERE SUBSTRING(periode::text FROM 1 FOR 4) = EXTRACT(YEAR FROM CURRENT_DATE)::text
            GROUP BY regional
            ORDER BY total_revenue DESC
            LIMIT 5
        `;

        const [summaryRes, trendRes, topRegionalsRes] = await Promise.all([
            pool.query(summaryQuery),
            pool.query(trendQuery),
            pool.query(topRegionalsQuery)
        ]);

        const summary = summaryRes.rows[0];

        console.log('✅ Homepage summary generated successfully');

        res.json({
            kpi: {
                totalRevenue: parseFloat(summary.total_revenue) || 0,
                totalTarget: parseFloat(summary.total_target) || 0,
                activeCustomers: parseInt(summary.active_customers) || 0,
                achievement: parseFloat(summary.achievement) || 0
            },
            trend: trendRes.rows,
            topRegionals: topRegionalsRes.rows
        });

    } catch (err) {
        console.error("❌ Error fetching homepage summary:", err);
        res.status(500).json({ message: 'Failed to fetch homepage summary.' });
    }
};
