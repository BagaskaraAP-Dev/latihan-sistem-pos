import { NextRequest, NextResponse } from 'next/server';
import { getClient, query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const transactionsRes = await query(`
      SELECT 
        t.id, 
        t.invoice_no, 
        t.total_amount, 
        t.payment_method, 
        t.cash_received, 
        t.change_amount, 
        t.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ti.id,
              'product_id', ti.product_id,
              'product_name', ti.product_name,
              'cost_price', ti.cost_price,
              'selling_price', ti.selling_price,
              'quantity', ti.quantity,
              'subtotal', ti.subtotal
            )
          ) FILTER (WHERE ti.id IS NOT NULL), '[]'
        ) as items
      FROM transactions t
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);

    return NextResponse.json(transactionsRes.rows);
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const client = await getClient();
  try {
    const body = await req.json();
    const { items, payment_method, cash_received } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Keranjang belanja tidak boleh kosong' }, { status: 400 });
    }

    if (!['CASH', 'QRIS'].includes(payment_method)) {
      return NextResponse.json({ error: 'Metode pembayaran tidak valid' }, { status: 400 });
    }

    await client.query('BEGIN');

    let totalAmount = 0;
    const processedItems: {
      product_id: number;
      product_name: string;
      cost_price: number;
      selling_price: number;
      quantity: number;
      subtotal: number;
    }[] = [];

    for (const item of items) {
      const pId = parseInt(item.product_id, 10);
      const qty = parseInt(item.quantity, 10);

      if (isNaN(pId) || isNaN(qty) || qty <= 0) {
        throw new Error('Data item atau jumlah tidak valid');
      }

      // Lock row for atomic update
      const prodRes = await client.query(
        'SELECT id, name, cost_price, selling_price, stock FROM products WHERE id = $1 FOR UPDATE',
        [pId]
      );

      if (prodRes.rowCount === 0) {
        throw new Error(`Produk dengan ID ${pId} tidak ditemukan`);
      }

      const product = prodRes.rows[0];
      const currentStock = parseInt(product.stock, 10);

      if (currentStock < qty) {
        throw new Error(`Stok produk "${product.name}" tidak mencukupi (Tersisa: ${currentStock}, Diminta: ${qty})`);
      }

      // Deduct stock
      await client.query(
        'UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2',
        [qty, pId]
      );

      const costPrice = parseFloat(product.cost_price);
      const sellingPrice = parseFloat(product.selling_price);
      const subtotal = sellingPrice * qty;
      totalAmount += subtotal;

      processedItems.push({
        product_id: pId,
        product_name: product.name,
        cost_price: costPrice,
        selling_price: sellingPrice,
        quantity: qty,
        subtotal: subtotal,
      });
    }

    let finalCashReceived = 0;
    let finalChange = 0;

    if (payment_method === 'CASH') {
      finalCashReceived = parseFloat(cash_received || 0);
      if (finalCashReceived < totalAmount) {
        throw new Error(`Uang tunai yang dibayarkan kurang dari total belanja (Total: ${totalAmount}, Diterima: ${finalCashReceived})`);
      }
      finalChange = finalCashReceived - totalAmount;
    } else {
      // QRIS
      finalCashReceived = totalAmount;
      finalChange = 0;
    }

    // Generate Invoice Number: INV-YYYYMMDD-RandomHex
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    const invoiceNo = `INV-${dateStr}-${randPart}`;

    const txRes = await client.query(
      `INSERT INTO transactions (invoice_no, total_amount, payment_method, cash_received, change_amount)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, invoice_no, total_amount, payment_method, cash_received, change_amount, created_at`,
      [invoiceNo, totalAmount, payment_method, finalCashReceived, finalChange]
    );

    const transaction = txRes.rows[0];

    // Insert transaction items
    for (const pItem of processedItems) {
      await client.query(
        `INSERT INTO transaction_items (transaction_id, product_id, product_name, cost_price, selling_price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [transaction.id, pItem.product_id, pItem.product_name, pItem.cost_price, pItem.selling_price, pItem.quantity, pItem.subtotal]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json(
      {
        ...transaction,
        items: processedItems,
      },
      { status: 201 }
    );
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses transaksi' }, { status: 400 });
  } finally {
    client.release();
  }
}
