import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cashierId = parseInt(params.id, 10);
    if (isNaN(cashierId)) {
      return NextResponse.json({ error: 'ID Kasir tidak valid' }, { status: 400 });
    }

    const body = await req.json();

    // Fetch existing
    const existingRes = await query('SELECT * FROM cashiers WHERE id = $1', [cashierId]);
    if (existingRes.rows.length === 0) {
      return NextResponse.json({ error: 'Akun kasir tidak ditemukan' }, { status: 404 });
    }
    const current = existingRes.rows[0];

    const rawCode = body.code;
    const rawName = body.name;
    const rawShortName = body.short_name !== undefined ? body.short_name : body.shortName;
    const rawRole = body.role;
    const rawPin = body.pin;
    const rawAvatar = body.avatar_url !== undefined ? body.avatar_url : body.avatarUrl;

    const updatedCode = rawCode ? String(rawCode).trim().toUpperCase() : current.code;
    const updatedName = rawName !== undefined ? String(rawName).trim() : current.name;
    const updatedShortName = rawShortName !== undefined ? String(rawShortName).trim().toUpperCase() : current.short_name;
    const updatedRole = rawRole !== undefined ? (rawRole === 'ADMIN' ? 'ADMIN' : 'KASIR') : current.role;
    const updatedPin = rawPin !== undefined ? String(rawPin).trim() : current.pin;
    const updatedAvatar = rawAvatar !== undefined ? (rawAvatar || null) : current.avatar_url;

    if (!updatedName) {
      return NextResponse.json({ error: 'Nama kasir tidak boleh kosong' }, { status: 400 });
    }

    if (!/^\d{4,6}$/.test(updatedPin)) {
      return NextResponse.json({ error: 'PIN kasir harus berupa 4 sampai 6 digit angka' }, { status: 400 });
    }

    // Check code collision if changed
    if (updatedCode !== current.code) {
      const collisionRes = await query('SELECT id FROM cashiers WHERE code = $1 AND id != $2', [
        updatedCode,
        cashierId,
      ]);
      if (collisionRes.rows.length > 0) {
        return NextResponse.json({ error: `Kode kasir "${updatedCode}" sudah dipakai akun lain` }, { status: 409 });
      }
    }

    // Prevent demoting the only admin
    if (current.role === 'ADMIN' && updatedRole !== 'ADMIN') {
      const adminCountRes = await query('SELECT COUNT(*) FROM cashiers WHERE role = \'ADMIN\'');
      const adminCount = parseInt(adminCountRes.rows[0].count, 10);
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Sistem harus memiliki minimal satu akun Administrator aktif' },
          { status: 400 }
        );
      }
    }

    const updateRes = await query(
      `UPDATE cashiers
       SET code = $1, name = $2, short_name = $3, role = $4, pin = $5, avatar_url = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING id, code, name, short_name, role, pin, avatar_url, created_at, updated_at`,
      [updatedCode, updatedName, updatedShortName, updatedRole, updatedPin, updatedAvatar, cashierId]
    );

    return NextResponse.json(updateRes.rows[0]);
  } catch (error: any) {
    console.error('Error updating cashier:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui data kasir' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cashierId = parseInt(params.id, 10);
    if (isNaN(cashierId)) {
      return NextResponse.json({ error: 'ID Kasir tidak valid' }, { status: 400 });
    }

    // Check existing
    const existingRes = await query('SELECT * FROM cashiers WHERE id = $1', [cashierId]);
    if (existingRes.rows.length === 0) {
      return NextResponse.json({ error: 'Akun kasir tidak ditemukan' }, { status: 404 });
    }
    const current = existingRes.rows[0];

    // Prevent deleting the only admin
    if (current.role === 'ADMIN') {
      const adminCountRes = await query('SELECT COUNT(*) FROM cashiers WHERE role = \'ADMIN\'');
      const adminCount = parseInt(adminCountRes.rows[0].count, 10);
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Tidak dapat menghapus Administrator satu-satunya dalam sistem' },
          { status: 400 }
        );
      }
    }

    await query('DELETE FROM cashiers WHERE id = $1', [cashierId]);

    return NextResponse.json({ success: true, message: `Akun ${current.name} berhasil dihapus` });
  } catch (error: any) {
    console.error('Error deleting cashier:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus data kasir' },
      { status: 500 }
    );
  }
}
