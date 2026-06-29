const express = require('express');
const pool = require('../db');
const { authenticate, requireSuperAdmin } = require('../auth');
const { sendWelcomeMessage } = require('../whatsapp');

const router = express.Router();
router.use(authenticate);

const SUB_MAP = { monthly: 30, quarterly: 90, '6_months': 180, yearly: 365, annual: 365 };

function generateMembershipId(joinDate) {
  const d = new Date(joinDate || Date.now());
  const yyyymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const rand = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `RIOSFIT-${yyyymm}-${rand}`;
}

router.get('/stats/summary', async (req, res) => {
  try {
    const { rows: counts } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') AS active,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
        COUNT(*) FILTER (WHERE status = 'active' AND due_date < CURRENT_DATE) AS overdue,
        COUNT(*) FILTER (WHERE status = 'active' AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') AS due_soon,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE balance_pending > 0) AS balance_due_count
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
  const { search, status, due_filter, subscription_type, timing, has_balance } = req.query;
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

    if (timing && timing !== 'all') {
      where.push(`m.timing = $${idx}`);
      params.push(timing);
      idx++;
    }

    if (has_balance === 'true') {
      where.push('m.balance_pending > 0');
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

router.patch('/:id', async (req, res) => {
  const fieldMap = {
    name: 'name',
    phone: 'phone',
    email: 'email',
    subscription_type: 'subscription_type',
    timing: 'timing',
    join_date: 'joined_date',
    due_date: 'due_date',
    subscription_fee: 'subscription_fee',
    balance_pending: 'balance_pending',
    status: 'status',
    notes: 'notes',
  };

  const updates = [];
  const params = [];
  let idx = 1;

  for (const [reqField, dbField] of Object.entries(fieldMap)) {
    if (req.body[reqField] !== undefined) {
      updates.push(`${dbField} = $${idx++}`);
      params.push(req.body[reqField] === '' ? null : req.body[reqField]);
    }
  }

  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

  updates.push(`updated_at = NOW()`);
  params.push(req.params.id);

  try {
    const { rows } = await pool.query(
      `UPDATE members SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );
    if (!rows[0]) return res.status(404).json({ error: 'Member not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const {
    name, phone, email, subscription_type,
    due_date, join_date, joined_date, notes, photo,
    timing, subscription_fee, amount_paid, payment_method, balance_pending,
  } = req.body;

  if (!name || !subscription_type) {
    return res.status(400).json({ error: 'name and subscription_type are required' });
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const joinDate = join_date || joined_date || todayStr;

  let dueDate = due_date;
  if (!dueDate) {
    const days = SUB_MAP[subscription_type] || 30;
    const d = new Date(joinDate);
    d.setDate(d.getDate() + days);
    dueDate = d.toISOString().split('T')[0];
  }

  const paidAmount = parseFloat(amount_paid) || 0;
  const useTransaction = paidAmount > 0;

  if (!useTransaction) {
    // Simple insert without payment
    try {
      let membershipId;
      let attempts = 0;
      do {
        membershipId = generateMembershipId(joinDate);
        const { rows: exists } = await pool.query(
          `SELECT id FROM members WHERE membership_id = $1`, [membershipId]
        );
        if (!exists.length) break;
        attempts++;
      } while (attempts < 20);

      const { rows } = await pool.query(
        `INSERT INTO members (name, phone, email, subscription_type, due_date, joined_date,
                              notes, photo, timing, subscription_fee, membership_id, balance_pending)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [name, phone || null, email || null, subscription_type, dueDate, joinDate,
         notes || null, photo || null, timing || null, subscription_fee || null, membershipId,
         parseInt(balance_pending) || 0]
      );
      sendWelcomeMessage(rows[0]).catch(err => console.error('[WhatsApp]', err));
      return res.status(201).json(rows[0]);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // Insert member + payment + receipt in a single transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let membershipId;
    let attempts = 0;
    do {
      membershipId = generateMembershipId(joinDate);
      const { rows: exists } = await client.query(
        `SELECT id FROM members WHERE membership_id = $1`, [membershipId]
      );
      if (!exists.length) break;
      attempts++;
    } while (attempts < 20);

    const { rows: [member] } = await client.query(
      `INSERT INTO members (name, phone, email, subscription_type, due_date, joined_date,
                            notes, photo, timing, subscription_fee, membership_id, balance_pending)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [name, phone || null, email || null, subscription_type, dueDate, joinDate,
       notes || null, photo || null, timing || null, subscription_fee || null, membershipId,
       parseInt(balance_pending) || 0]
    );

    const { rows: [payment] } = await client.query(
      `INSERT INTO payments (member_id, amount, payment_method, note, recorded_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [member.id, paidAmount, payment_method || 'Cash', 'Initial payment', req.user.id]
    );

    const pad = (n) => String(n).padStart(2, '0');
    const datePart = `${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}`;
    const receiptId = `RCT-${datePart}-${String(payment.id).padStart(4, '0')}`;

    const { rows: [receiptUser] } = await client.query(
      `SELECT name FROM users WHERE id = $1`, [req.user.id]
    );
    const recordedBy = receiptUser?.name || 'Staff';

    const initBalance = parseInt(balance_pending) || 0;
    await client.query(
      `INSERT INTO receipts (id, payment_id, member_id, member_name, membership_id,
                             amount, method, paid_date, recorded_by, new_due_date, note, receipt_data, subscription_type, balance_pending)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (id) DO NOTHING`,
      [receiptId, payment.id, member.id, member.name, membershipId,
       paidAmount, payment_method || 'Cash', todayStr, recordedBy, dueDate, 'Initial payment',
       JSON.stringify({ receiptId, memberName: member.name, membershipId, amount: paidAmount }),
       subscription_type || null, initBalance]
    );

    await client.query('COMMIT');
    sendWelcomeMessage(member).catch(err => console.error('[WhatsApp]', err));
    res.status(201).json({
      ...member,
      receipt_id: receiptId,
      recorded_by: recordedBy,
      new_due_date: dueDate,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
