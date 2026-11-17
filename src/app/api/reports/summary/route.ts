import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const txSummary = await query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(*) as total_transactions
      FROM transactions
    `);

    const profitSummary = await query(`
      SELECT 
        COALESCE(SUM((selling_price - cost_price) * quantity), 0) as estimated_profit
      FROM transaction_items
    `);

    return NextResponse.json({
      totalRevenue: parseFloat(txSummary.rows[0].total_revenue),
      totalTransactions: parseInt(txSummary.rows[0].total_transactions, 10),
      estimatedProfit: parseFloat(profitSummary.rows[0].estimated_profit),
    });
  } catch (error: any) {
    console.error('Error fetching summary reports:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
