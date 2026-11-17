import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        id, 
        code, 
        name, 
        short_name, 
        role, 
        pin, 
        avatar_url, 
        created_at, 
        updated_at
      FROM cashiers
      ORDER BY 
        CASE WHEN role = 'ADMIN' THEN 0 ELSE 1 END,
        id ASC
    `);

    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Error fetching cashiers:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengambil data kasir dari database' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, short_name, role, pin, avatar_url } = body;

    const trimmedCode = (code || '').trim().toUpperCase();
    const trimmedName = (name || '').trim();
    const trimmedShortName = (short_name || trimmedName.split(' ')[0] || trimmedCode).trim().toUpperCase();
    const validRole = role === 'ADMIN' ? 'ADMIN' : 'KASIR';
    const validPin = (pin || '1234').trim();

    if (!trimmedCode) {
      return NextResponse.json({ error: 'Kode kasir wajib diisi (contoh: KSR-01)' }, { status: 400 });
    }

    if (!trimmedName) {
      return NextResponse.json({ error: 'Nama kasir wajib diisi' }, { status: 400 });
    }

    if (!/^\d{4,6}$/.test(validPin)) {
      return NextResponse.json({ error: 'PIN kasir harus berupa 4 sampai 6 digit angka' }, { status: 400 });
    }

    // Check code uniqueness
    const checkRes = await query('SELECT id FROM cashiers WHERE code = $1', [trimmedCode]);
    if (checkRes.rows.length > 0) {
      return NextResponse.json({ error: `Kode kasir "${trimmedCode}" sudah digunakan akun lain` }, { status: 409 });
    }

    const insertRes = await query(
      `INSERT INTO cashiers (code, name, short_name, role, pin, avatar_url, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, code, name, short_name, role, pin, avatar_url, created_at, updated_at`,
      [trimmedCode, trimmedName, trimmedShortName, validRole, validPin, avatar_url || null]
    );

    return NextResponse.json(insertRes.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating cashier:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menambahkan akun kasir' },
      { status: 500 }
    );
  }
}
