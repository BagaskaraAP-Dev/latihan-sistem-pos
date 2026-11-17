import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    let sql = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (name ILIKE $${params.length} OR sku ILIKE $${params.length})`;
    }

    if (category.trim() && category !== 'Semua') {
      params.push(category.trim());
      sql += ` AND category = $${params.length}`;
    }

    sql += ' ORDER BY id ASC';

    const result = await query(sql, params);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sku, name, category, cost_price, selling_price, stock } = body;

    if (!sku || !name || !category || cost_price === undefined || selling_price === undefined || stock === undefined) {
      return NextResponse.json({ error: 'Data produk tidak lengkap' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO products (sku, name, category, cost_price, selling_price, stock)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [sku.trim(), name.trim(), category.trim(), Number(cost_price), Number(selling_price), parseInt(stock, 10)]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'SKU produk sudah terdaftar' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
