import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID produk tidak valid' }, { status: 400 });
    }

    const body = await req.json();
    const { sku, name, category, cost_price, selling_price, stock } = body;

    const result = await query(
      `UPDATE products
       SET sku = $1, name = $2, category = $3, cost_price = $4, selling_price = $5, stock = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [sku.trim(), name.trim(), category.trim(), Number(cost_price), Number(selling_price), parseInt(stock, 10), id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating product:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'SKU produk sudah digunakan produk lain' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID produk tidak valid' }, { status: 400 });
    }

    // Check if product is referenced in transaction_items
    const refCheck = await query('SELECT COUNT(*) FROM transaction_items WHERE product_id = $1', [id]);
    if (parseInt(refCheck.rows[0].count, 10) > 0) {
      return NextResponse.json(
        { error: 'Produk tidak dapat dihapus karena sudah memiliki riwayat transaksi penjualan. Anda dapat mengubah stoknya menjadi 0.' },
        { status: 400 }
      );
    }

    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Produk berhasil dihapus', product: result.rows[0] });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
