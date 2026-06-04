const bcrypt = require('bcryptjs');
const pool = require('./db');

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

    const { rows: existingUsers } = await client.query('SELECT id FROM users LIMIT 1');
    if (existingUsers.length === 0) {
      const superHash = await bcrypt.hash('super123', 10);
      const adminHash = await bcrypt.hash('admin123', 10);

      await client.query(
        `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)`,
        [
          'super@rios.fit', superHash, 'Super Admin', 'super_admin',
          'admin@rios.fit', adminHash, 'Admin User', 'admin',
        ]
      );

      const today = new Date();
      const addDays = (d, n) => {
        const r = new Date(d);
        r.setDate(r.getDate() + n);
        return r.toISOString().split('T')[0];
      };
      const subDays = (d, n) => addDays(d, -n);

      const members = [
        ['Arjun Mehta', '9876543210', 'arjun@example.com', 'monthly', 'active', addDays(today, 12), subDays(today, 18)],
        ['Priya Sharma', '9123456789', 'priya@example.com', 'quarterly', 'active', addDays(today, 45), subDays(today, 45)],
        ['Rohit Verma', '9988776655', 'rohit@example.com', 'monthly', 'active', subDays(today, 2), subDays(today, 32)],
        ['Sneha Patel', '9001234567', 'sneha@example.com', 'yearly', 'active', addDays(today, 180), subDays(today, 185)],
        ['Karan Singh', '9765432100', null, 'monthly', 'active', addDays(today, 3), subDays(today, 27)],
        ['Meera Nair', '9654321098', 'meera@example.com', 'quarterly', 'cancelled', subDays(today, 10), subDays(today, 100)],
        ['Dev Choudhary', '9543210987', null, 'monthly', 'active', subDays(today, 5), subDays(today, 35)],
        ['Ananya Iyer', '9432109876', 'ananya@example.com', 'monthly', 'active', addDays(today, 6), subDays(today, 24)],
      ];

      for (const [name, phone, email, sub, status, due, joined] of members) {
        await client.query(
          `INSERT INTO members (name, phone, email, subscription_type, status, due_date, joined_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [name, phone, email, sub, status, due, joined]
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
