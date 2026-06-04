const express = require('express');
const pool = require('../db');
const { authenticate } = require('../auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { from_date, to_date, search, page = '1' } = req.query;
  const limit = 50;
  const offset = (parseInt(page) - 1) * limit;

  const where = [];
  const params = [];
  let idx = 1;

  if (from_date) {
    where.push(`r.paid_date >= $${idx++}`);
    params.push(from_date);
  }
  if (to_date) {
    where.push(`r.paid_date <= $${idx++}`);
    params.push(to_date);
  }
  if (search) {
    where.push(`(r.member_name ILIKE $${idx} OR r.membership_id ILIKE $${idx} OR r.id ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM receipts r ${whereClause}`, params
    );
    const total = parseInt(countRows[0].count);

    const { rows } = await pool.query(
      `SELECT * FROM receipts r ${whereClause} ORDER BY r.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    res.json({ receipts: rows, total, page: parseInt(page), pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/member/:memberId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM receipts WHERE member_id = $1 ORDER BY created_at DESC`,
      [req.params.memberId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:receiptId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM receipts WHERE id = $1`, [req.params.receiptId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Receipt not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
