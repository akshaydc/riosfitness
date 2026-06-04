const express = require('express');
const pool = require('../db');
const { authenticate, requireSuperAdmin } = require('../auth');

const router = express.Router();
router.use(authenticate);

router.post('/', async (req, res) => {
  const { member_id, amount, payment_method, note } = req.body;
  if (!member_id || !amount) {
    return res.status(400).json({ error: 'member_id and amount are required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: members } = await client.query(
      'SELECT * FROM members WHERE id = $1 FOR UPDATE',
      [member_id]
    );
    if (!members[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Member not found' });
    }
    const member = members[0];

    const { rows: [payment] } = await client.query(
      `INSERT INTO payments (member_id, amount, payment_method, note, recorded_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [member_id, amount, payment_method || 'Cash', note || null, req.user.id]
    );

    const subMap = { monthly: 30, quarterly: 90, yearly: 365 };
    const days = subMap[member.subscription_type] || 30;

    const base = member.due_date && new Date(member.due_date) > new Date()
      ? new Date(member.due_date)
      : new Date();
    base.setDate(base.getDate() + days);
    const newDue = base.toISOString().split('T')[0];

    await client.query(
      `UPDATE members SET due_date = $1, status = 'active', updated_at = NOW() WHERE id = $2`,
      [newDue, member_id]
    );

    await client.query('COMMIT');
    res.status(201).json({ payment, new_due_date: newDue });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.get('/', async (req, res) => {
  const { member_id } = req.query;
  try {
    let query = `
      SELECT p.*, m.name AS member_name, u.name AS recorded_by_name
      FROM payments p
      JOIN members m ON m.id = p.member_id
      LEFT JOIN users u ON u.id = p.recorded_by
    `;
    const params = [];
    if (member_id) {
      query += ' WHERE p.member_id = $1';
      params.push(member_id);
    }
    query += ' ORDER BY p.paid_at DESC LIMIT 100';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/revenue', requireSuperAdmin, async (req, res) => {
  try {
    const { rows: monthly } = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', paid_at), 'Mon YYYY') AS month,
        DATE_TRUNC('month', paid_at) AS month_date,
        SUM(amount) AS total
      FROM payments
      WHERE paid_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      GROUP BY DATE_TRUNC('month', paid_at)
      ORDER BY month_date ASC
    `);

    const { rows: byType } = await pool.query(`
      SELECT m.subscription_type, SUM(p.amount) AS total, COUNT(p.id) AS count
      FROM payments p
      JOIN members m ON m.id = p.member_id
      WHERE p.paid_at >= DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY m.subscription_type
      ORDER BY total DESC
    `);

    res.json({ monthly, by_type: byType });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
