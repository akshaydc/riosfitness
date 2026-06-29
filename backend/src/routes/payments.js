const express = require('express');
const pool = require('../db');
const { authenticate, requireSuperAdmin } = require('../auth');
const { sendPaymentReceipt } = require('../whatsapp');

const router = express.Router();
router.use(authenticate);

router.post('/', async (req, res) => {
  const { member_id, amount, payment_method, note, balance_pending } = req.body;
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

    const subMap = { monthly: 30, quarterly: 90, '6_months': 180, yearly: 365, annual: 365 };
    const days = subMap[member.subscription_type] || 30;

    const base = member.due_date && new Date(member.due_date) > new Date()
      ? new Date(member.due_date)
      : new Date();
    base.setDate(base.getDate() + days);
    const newDue = base.toISOString().split('T')[0];

    const newBalance = balance_pending != null ? parseInt(balance_pending) : 0;
    await client.query(
      `UPDATE members SET due_date = $1, status = 'active', balance_pending = $2, updated_at = NOW() WHERE id = $3`,
      [newDue, newBalance, member_id]
    );

    const today = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const datePart = `${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}`;
    const receiptId = `RCT-${datePart}-${String(payment.id).padStart(4, '0')}`;
    const membershipId = member.membership_id || `#${String(member_id).padStart(4, '0')}`;

    const { rows: [receiptUser] } = await client.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
    const recordedBy = receiptUser?.name || 'Staff';

    await client.query(
      `INSERT INTO receipts (id, payment_id, member_id, member_name, membership_id, amount, method, paid_date, recorded_by, new_due_date, note, receipt_data, subscription_type, balance_pending)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (id) DO NOTHING`,
      [
        receiptId, payment.id, member_id, member.name, membershipId,
        amount, payment_method || 'Cash',
        today.toISOString().split('T')[0],
        recordedBy, newDue, note || null,
        JSON.stringify({ receiptId, memberName: member.name, membershipId, amount, method: payment_method || 'Cash', paidDate: today.toISOString().split('T')[0], recordedBy, newDueDate: newDue, note: note || null }),
        member.subscription_type || null, newBalance,
      ]
    );

    await client.query('COMMIT');
    sendPaymentReceipt(
      { ...member, due_date: newDue },
      payment,
      { id: receiptId, paid_date: today.toISOString().split('T')[0] }
    ).catch(err => console.error('[WhatsApp]', err));
    res.status(201).json({ payment, new_due_date: newDue, receipt_id: receiptId, recorded_by: recordedBy, balance_pending: newBalance });
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

router.patch('/:id', requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { amount, method, note } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [existing] } = await client.query(
      'SELECT * FROM payments WHERE id = $1',
      [id]
    );
    if (!existing) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Payment not found' });
    }

    const setClauses = [];
    const vals = [];
    let n = 1;
    if (amount != null) { setClauses.push(`amount = $${n++}`); vals.push(amount); }
    if (method != null) { setClauses.push(`payment_method = $${n++}`); vals.push(method); }
    if (note !== undefined) { setClauses.push(`note = $${n++}`); vals.push(note || null); }

    if (!setClauses.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No fields to update' });
    }
    vals.push(id);
    const { rows: [updated] } = await client.query(
      `UPDATE payments SET ${setClauses.join(', ')} WHERE id = $${n} RETURNING *`,
      vals
    );

    const { rows: [receipt] } = await client.query(
      'SELECT * FROM receipts WHERE payment_id = $1',
      [id]
    );
    if (receipt) {
      const rClauses = [];
      const rVals = [];
      let rn = 1;
      if (amount != null) { rClauses.push(`amount = $${rn++}`); rVals.push(amount); }
      if (method != null) { rClauses.push(`method = $${rn++}`); rVals.push(method); }
      if (note !== undefined) { rClauses.push(`note = $${rn++}`); rVals.push(note || null); }

      const data = typeof receipt.receipt_data === 'string'
        ? JSON.parse(receipt.receipt_data)
        : (receipt.receipt_data || {});
      if (amount != null) data.amount = amount;
      if (method != null) data.method = method;
      if (note !== undefined) data.note = note || null;
      rClauses.push(`receipt_data = $${rn++}`);
      rVals.push(JSON.stringify(data));

      rVals.push(id);
      await client.query(
        `UPDATE receipts SET ${rClauses.join(', ')} WHERE payment_id = $${rn}`,
        rVals
      );
    }

    await client.query('COMMIT');
    res.json(updated);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.delete('/:id', requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [payment] } = await client.query(
      'SELECT * FROM payments WHERE id = $1',
      [id]
    );
    if (!payment) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Payment not found' });
    }

    const { rows: [receipt] } = await client.query(
      'SELECT * FROM receipts WHERE payment_id = $1',
      [id]
    );

    const { rows: [member] } = await client.query(
      'SELECT * FROM members WHERE id = $1 FOR UPDATE',
      [payment.member_id]
    );

    const subMap = { monthly: 30, quarterly: 90, '6_months': 180, yearly: 365, annual: 365 };
    const subType = receipt?.subscription_type || member.subscription_type;
    const days = subMap[subType] || 30;

    const baseDue = member.due_date ? new Date(member.due_date) : new Date();
    baseDue.setDate(baseDue.getDate() - days);
    const newDue = baseDue.toISOString().split('T')[0];

    if (receipt) {
      await client.query('DELETE FROM receipts WHERE payment_id = $1', [id]);
    }
    await client.query('DELETE FROM payments WHERE id = $1', [id]);
    await client.query(
      'UPDATE members SET due_date = $1, updated_at = NOW() WHERE id = $2',
      [newDue, payment.member_id]
    );

    await client.query('COMMIT');
    res.json({ success: true, new_due_date: newDue });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
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
