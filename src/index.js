import express from 'express';
import dotenv from 'dotenv';
import pointsRouter from '../src/routes/points.js';
import polygonsRouter from '../src/routes/polygons.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/points', pointsRouter);
app.use('/polygons', polygonsRouter);

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on :${port}`);
});
