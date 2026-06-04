const express = require('express');
const pool = require('../db');
const { authenticate } = require('../auth');

const router = express.Router();
router.use(authenticate);

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
      `SELECT * FROM receipts WHERE id = $1`,
      [req.params.receiptId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Receipt not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
