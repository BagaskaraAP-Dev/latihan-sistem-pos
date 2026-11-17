import { Pool, PoolClient } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.POSTGRES_USER || 'posuser'}:${process.env.POSTGRES_PASSWORD || 'pospassword'}@${
    process.env.POSTGRES_HOST || 'pos-db'
  }:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'pos_db'}`;

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function initDb(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const client = await pool.connect();
    try {
      // 1. Create Products Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          sku VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL,
          cost_price NUMERIC(12, 2) NOT NULL,
          selling_price NUMERIC(12, 2) NOT NULL,
          stock INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Create Transactions Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id SERIAL PRIMARY KEY,
          invoice_no VARCHAR(50) UNIQUE NOT NULL,
          total_amount NUMERIC(12, 2) NOT NULL,
          payment_method VARCHAR(20) NOT NULL,
          cash_received NUMERIC(12, 2) DEFAULT 0,
          change_amount NUMERIC(12, 2) DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. Create Transaction Items Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS transaction_items (
          id SERIAL PRIMARY KEY,
          transaction_id INT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
          product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
          product_name VARCHAR(255) NOT NULL,
          cost_price NUMERIC(12, 2) NOT NULL,
          selling_price NUMERIC(12, 2) NOT NULL,
          quantity INT NOT NULL,
          subtotal NUMERIC(12, 2) NOT NULL
        );
      `);

      // 4. Auto-seeding if products table is empty
      const countRes = await client.query('SELECT COUNT(*) FROM products');
      const count = parseInt(countRes.rows[0].count, 10);

      if (count === 0) {
        console.log('Seeding initial products data for UMKM POS...');
        const initialProducts = [
          { sku: 'BRG-001', name: 'Beras Pandan Wangi 5kg', category: 'Sembako', cost_price: 68000, selling_price: 78000, stock: 20 },
          { sku: 'BRG-002', name: 'Minyak Goreng Sania 2L', category: 'Sembako', cost_price: 32000, selling_price: 36500, stock: 25 },
          { sku: 'BRG-003', name: 'Gula Pasir Gulaku 1kg', category: 'Sembako', cost_price: 15000, selling_price: 17500, stock: 30 },
          { sku: 'BRG-004', name: 'Telur Ayam Negeri 1kg', category: 'Sembako', cost_price: 26000, selling_price: 29500, stock: 15 },
          { sku: 'BRG-005', name: 'Indomie Goreng Spesial', category: 'Makanan Instan', cost_price: 2700, selling_price: 3200, stock: 150 },
          { sku: 'BRG-006', name: 'Kopi Kapal Api Spesial Mix 10s', category: 'Minuman', cost_price: 12000, selling_price: 14500, stock: 35 },
          { sku: 'BRG-007', name: 'Teh Botol Sosro Kotak 250ml', category: 'Minuman', cost_price: 3200, selling_price: 4000, stock: 3 }, // < 5 warning
          { sku: 'BRG-008', name: 'Susu Ultra Milk Cokelat 1L', category: 'Minuman', cost_price: 17500, selling_price: 20000, stock: 4 }, // < 5 warning
          { sku: 'BRG-009', name: 'Sabun Cuci Piring Sunlight 750ml', category: 'Kebersihan', cost_price: 14000, selling_price: 16500, stock: 18 },
          { sku: 'BRG-010', name: 'Sabun Mandi Lifebuoy Total 10', category: 'Kebersihan', cost_price: 4500, selling_price: 5500, stock: 40 },
          { sku: 'BRG-011', name: 'Deterjen Rinso Matic 800g', category: 'Kebersihan', cost_price: 21000, selling_price: 24500, stock: 12 },
          { sku: 'BRG-012', name: 'Air Mineral Aqua 600ml', category: 'Minuman', cost_price: 2800, selling_price: 3500, stock: 48 },
        ];

        for (const p of initialProducts) {
          await client.query(
            `INSERT INTO products (sku, name, category, cost_price, selling_price, stock)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [p.sku, p.name, p.category, p.cost_price, p.selling_price, p.stock]
          );
        }
        console.log(`Successfully seeded ${initialProducts.length} initial products.`);
      }

      isInitialized = true;
    } catch (err) {
      console.error('Error during database initialization:', err);
      throw err;
    } finally {
      client.release();
    }
  })();

  return initPromise;
}

export async function query(text: string, params?: any[]) {
  await initDb();
  return pool.query(text, params);
}

export async function getClient(): Promise<PoolClient> {
  await initDb();
  return pool.connect();
}

export default pool;
