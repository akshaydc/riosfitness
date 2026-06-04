const express = require('express');
const pool = require('../db');
const { authenticate, requireSuperAdmin } = require('../auth');

const router = express.Router();
router.use(authenticate);

router.get('/stats/summary', async (req, res) => {
  try {
    const { rows: counts } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') AS active,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
        COUNT(*) FILTER (WHERE status = 'active' AND due_date < CURRENT_DATE) AS overdue,
        COUNT(*) FILTER (WHERE status = 'active' AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') AS due_soon,
        COUNT(*) AS total
      FROM members
    `);

    const result = { ...counts[0] };

    if (req.user.role === 'super_admin') {
      const { rows: rev } = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) AS collected_month
        FROM payments
        WHERE paid_at >= DATE_TRUNC('month', CURRENT_DATE)
      `);
      result.collected_month = rev[0].collected_month;
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  const { search, status, due_filter, subscription_type } = req.query;
  try {
    let where = [];
    let params = [];
    let idx = 1;

    if (search) {
      where.push(`(m.name ILIKE $${idx} OR m.phone ILIKE $${idx} OR m.email ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    if (status && status !== 'all') {
      if (status === 'overdue') {
        where.push(`(m.status = 'active' AND m.due_date < CURRENT_DATE)`);
      } else if (status === 'due_soon') {
        where.push(`(m.status = 'active' AND m.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days')`);
      } else if (status === 'active') {
        where.push(`(m.status = 'active' AND m.due_date >= CURRENT_DATE)`);
      } else {
        where.push(`m.status = $${idx}`);
        params.push(status);
        idx++;
      }
    }

    if (due_filter === 'overdue') {
      where.push(`(m.status = 'active' AND m.due_date < CURRENT_DATE)`);
    } else if (due_filter === 'due_soon') {
      where.push(`(m.status = 'active' AND m.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days')`);
    }

    if (subscription_type && subscription_type !== 'all') {
      where.push(`m.subscription_type = $${idx}`);
      params.push(subscription_type);
      idx++;
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const { rows } = await pool.query(`
      SELECT m.*,
        COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.member_id = m.id), 0) AS total_paid
      FROM members m
      ${whereClause}
      ORDER BY m.created_at DESC
    `, params);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows: members } = await pool.query('SELECT * FROM members WHERE id = $1', [req.params.id]);
    if (!members[0]) return res.status(404).json({ error: 'Member not found' });

    const { rows: payments } = await pool.query(
      `SELECT p.*, u.name AS recorded_by_name
       FROM payments p
       LEFT JOIN users u ON u.id = p.recorded_by
       WHERE p.member_id = $1
       ORDER BY p.paid_at DESC`,
      [req.params.id]
    );

    res.json({ ...members[0], payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/photo', async (req, res) => {
  const { photo } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE members SET photo = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [photo || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Member not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const { name, phone, email, subscription_type, due_date, join_date, joined_date, notes, photo } = req.body;
  if (!name || !subscription_type) {
    return res.status(400).json({ error: 'name and subscription_type are required' });
  }

  const today = new Date().toISOString().split('T')[0];
  const joinDate = join_date || joined_date || today;

  let dueDate = due_date;
  if (!dueDate) {
    const subMap = { monthly: 30, quarterly: 90, yearly: 365 };
    const days = subMap[subscription_type] || 30;
    const d = new Date(joinDate);
    d.setDate(d.getDate() + days);
    dueDate = d.toISOString().split('T')[0];
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO members (name, phone, email, subscription_type, due_date, joined_date, notes, photo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, phone || null, email || null, subscription_type, dueDate, joinDate, notes || null, photo || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/cancel', requireSuperAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE members SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Member not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
