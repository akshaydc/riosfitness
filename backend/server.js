require('dotenv').config();
const express = require('express');
const cors = require('cors');
const migrate = require('./src/migrate');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/members', require('./src/routes/members'));
app.use('/api/payments', require('./src/routes/payments'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;

migrate().then(() => {
  app.listen(PORT, () => console.log(`Rios Fitness API running on port ${PORT}`));
}).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
