require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = require('./db');

async function clearData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM receipts');
    await client.query('DELETE FROM payments');
    await client.query('DELETE FROM members');
    await client.query('COMMIT');
    console.log('All member data cleared successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to clear data:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

clearData().then(() => process.exit(0));
