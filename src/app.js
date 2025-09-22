const express = require('express');
const pointsRouter = require('./routes/points');
const polygonsRouter = require('./routes/polygons');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/points', pointsRouter);
app.use('/polygons', polygonsRouter);

module.exports = app;