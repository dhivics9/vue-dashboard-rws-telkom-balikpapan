// File: backend/services/syncService.js
import cron from 'node-cron';
import pool from '../db.js';
import { internalFetchRevenueData, internalFetchNcxData, internalFetchSalesData } from '../controllers/toolController.js';

export async function runApiSync() {
    console.log('Memulai sinkronisasi otomatis data API...');
    const client = await pool.connect();
    try {
        const [revenueData, ncxData, salesData] = await Promise.all([
            internalFetchRevenueData(),
            internalFetchNcxData(),
            internalFetchSalesData()
        ]);

        if (!Array.isArray(revenueData) || !Array.isArray(ncxData) || !Array.isArray(salesData)) {
            throw new Error('Salah satu sumber data API tidak mengembalikan array yang valid saat sinkronisasi otomatis.');
        }

        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE public.revenue_api, public.sales_api, public.ncx_api RESTART IDENTITY');

        // Load data baru
        for (const row of revenueData) {
            await client.query(
                `INSERT INTO public.revenue_api (periode, cust_order_number, product_label, customer_name, product_name, product_group_name, lccd, regional, witel, rev_type, revenue)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [row.Periode, row.Cust_Order_Number, row.Product_Label, row.Customer_Name, row.Product_Name, row.Product_Group_Name, row.LCCD, row.Regional, row.Witel, row.Rev_Type, row.Revenue]
            );
        }
        
        for (const row of salesData) {
            await client.query(
                `INSERT INTO public.sales_api (periode, cust_order_number, product_label, customer_name, product_name, product_group_name, lccd, regional, witel, sales_type, sales_amount)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [row.Periode, row.Cust_Order_Number, row.Product_Label, row.Customer_Name, row.Product_Name, row.Product_Group_Name, row.LCCD, row.Regional, row.Witel, row.Sales_Type, row.Sales_Amount]
            );
        }

        for (const row of ncxData) {
            await client.query(
                `INSERT INTO public.ncx_api (li_product_name, ca_account_name, order_id, li_sid, quote_subtype, sa_x_addr_city, sa_x_addr_latitude, sa_x_addr_latitude2, sa_x_addr_longlitude, sa_x_addr_longlitude2, billing_type_cd, price_type_cd, x_mrc_tot_net_pri, x_nrc_tot_net_pri, quote_createdby_name, agree_num, agree_type, agree_end_date, agree_status, li_milestone, order_created_date, sa_witel, sa_account_status, sa_account_address_name, billing_activation_date, billing_activation_status, billcomp_date, li_milestone_date, witel, bw)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30    )`,
                [row.li_product_name, row.ca_account_name, row.order_id, row.li_sid, row.quote_subtype, row.sa_x_addr_city, row.sa_x_addr_latitude, row.sa_x_addr_latitude2, row.sa_x_addr_longlitude, row.sa_x_addr_longlitude2, row.billing_type_cd, row.price_type_cd, row.x_mrc_tot_net_pri, row.x_nrc_tot_net_pri, row.quote_createdby_name, row.agree_num, row.agree_type, row.agree_end_date, row.agree_status, row.li_milestone, row.order_created_date, row.sa_witel, row.sa_account_status, row.sa_account_address_name, row.billing_activation_date, row.billing_activation_status, row.billcomp_date, row.li_milestone_date, row.witel, row.bw]
            );
        }

        await client.query('COMMIT');
        console.log(`Sinkronisasi otomatis berhasil: ${revenueData.length} revenue, ${ncxData.length} NCX, ${salesData.length} sales.`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Terjadi error pada sinkronisasi otomatis:', error.message);
    } finally {
        client.release();
    }
}

export function startSchedulers() {
    cron.schedule('0 2 * * *', () => {
        runApiSync();
    }, {
        scheduled: true,
        timezone: "Asia/Jakarta"
    });

    console.log('Scheduler untuk sinkronisasi data API telah dimulai. Akan berjalan setiap hari pukul 02:00 WIB.');
}
