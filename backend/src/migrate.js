const bcrypt = require('bcryptjs');
const pool = require('./db');

function generateMembershipId(joinDate) {
  const d = new Date(joinDate || Date.now());
  const yyyymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const rand = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `RIOSFIT-${yyyymm}-${rand}`;
}

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        subscription_type VARCHAR(50) NOT NULL DEFAULT 'monthly',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        due_date DATE NOT NULL,
        joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        amount NUMERIC(10,2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
        paid_at TIMESTAMPTZ DEFAULT NOW(),
        note TEXT,
        recorded_by INTEGER REFERENCES users(id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
        member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        member_name TEXT NOT NULL,
        membership_id TEXT NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        method TEXT NOT NULL,
        paid_date DATE NOT NULL,
        recorded_by TEXT NOT NULL,
        new_due_date DATE,
        note TEXT,
        receipt_data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Add columns to members if missing
    await client.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS photo TEXT`);
    await client.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS timing TEXT`);
    await client.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS subscription_fee INTEGER`);
    await client.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS membership_id TEXT`);

    // Ensure unique index on membership_id (IF NOT EXISTS is safe to re-run)
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_members_membership_id ON members(membership_id)
    `);

    // Add balance_pending to members (running balance the member owes)
    await client.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS balance_pending INTEGER DEFAULT 0`);

    // Add balance_pending to receipts (point-in-time balance after payment)
    await client.query(`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS balance_pending INTEGER DEFAULT 0`);

    // Add subscription_type to receipts (tracks sub type at time of payment)
    await client.query(`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS subscription_type TEXT`);
    await client.query(`
      UPDATE receipts r SET subscription_type = m.subscription_type
      FROM members m WHERE r.member_id = m.id AND r.subscription_type IS NULL
    `);

    // Generate membership_ids for members that don't have one yet
    const { rows: needIds } = await client.query(
      `SELECT id, joined_date FROM members WHERE membership_id IS NULL ORDER BY id`
    );
    for (const m of needIds) {
      let mid;
      let attempts = 0;
      do {
        mid = generateMembershipId(m.joined_date);
        const { rows: exists } = await client.query(
          `SELECT id FROM members WHERE membership_id = $1`, [mid]
        );
        if (!exists.length) break;
        attempts++;
      } while (attempts < 20);
      await client.query(`UPDATE members SET membership_id = $1 WHERE id = $2`, [mid, m.id]);
    }

    // One-time credential migration
    const { rows: oldSuper } = await client.query(
      `SELECT id FROM users WHERE email = 'super@rios.fit'`
    );
    if (oldSuper.length > 0) {
      const migratedHash = await bcrypt.hash('Rio#2026', 10);
      await client.query(
        `UPDATE users SET email = 'sharath@rios.fit', name = 'Sharath K', password_hash = $1
         WHERE email = 'super@rios.fit'`,
        [migratedHash]
      );
      console.log('Migrated super@rios.fit → sharath@rios.fit');
    }

    const { rows: existingUsers } = await client.query('SELECT id FROM users LIMIT 1');
    if (existingUsers.length === 0) {
      const superHash = await bcrypt.hash('Rio#2026', 10);
      const adminHash = await bcrypt.hash('admin123', 10);

      await client.query(
        `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)`,
        [
          'sharath@rios.fit', superHash, 'Sharath K', 'super_admin',
          'admin@rios.fit', adminHash, 'Admin User', 'admin',
        ]
      );

      const today = new Date();
      const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r.toISOString().split('T')[0]; };
      const subDays = (d, n) => addDays(d, -n);

      const members = [
        ['Arjun Mehta',    '9876543210', 'arjun@example.com',  'monthly',   'active',    addDays(today, 12),  subDays(today, 18),  '6AM'],
        ['Priya Sharma',   '9123456789', 'priya@example.com',  'quarterly', 'active',    addDays(today, 45),  subDays(today, 45),  '7AM'],
        ['Rohit Verma',    '9988776655', 'rohit@example.com',  'monthly',   'active',    subDays(today, 2),   subDays(today, 32),  '8AM'],
        ['Sneha Patel',    '9001234567', 'sneha@example.com',  'yearly',    'active',    addDays(today, 180), subDays(today, 185), '6AM'],
        ['Karan Singh',    '9765432100', null,                 'monthly',   'active',    addDays(today, 3),   subDays(today, 27),  '5AM'],
        ['Meera Nair',     '9654321098', 'meera@example.com',  'quarterly', 'cancelled', subDays(today, 10),  subDays(today, 100), null],
        ['Dev Choudhary',  '9543210987', null,                 'monthly',   'active',    subDays(today, 5),   subDays(today, 35),  '7AM'],
        ['Ananya Iyer',    '9432109876', 'ananya@example.com', 'monthly',   'active',    addDays(today, 6),   subDays(today, 24),  '8AM'],
      ];

      for (const [name, phone, email, sub, status, due, joined, timing] of members) {
        const mid = generateMembershipId(joined);
        await client.query(
          `INSERT INTO members (name, phone, email, subscription_type, status, due_date, joined_date, timing, membership_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [name, phone, email, sub, status, due, joined, timing, mid]
        );
      }

      console.log('Database seeded with default users and members');
    }

    await client.query('COMMIT');
    console.log('Migration complete');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = migrate;
