const express = require('express');
const {query} = require('../db.js');
const {assertPointGeoJSON, parsePagination} = require('../validators.js');

const router = express.Router();

// Create point
router.post('/', async (req, res, next) => {
  try {
    const { name, properties = {}, geom } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    assertPointGeoJSON(geom);

    const sql = `
      INSERT INTO points (name, properties, geom)
      VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326))
      RETURNING id, name, properties,
        ST_AsGeoJSON(geom)::json AS geom,
        created_at, updated_at
    `;
    const r = await query(sql, [name, properties, JSON.stringify(geom)]);
    res.status(201).json(r.rows[0]);
  } catch (e) { next(e); }
});

// List points with optional bbox and within polygon filter
router.get('/', async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const { bbox, within } = req.query; // bbox=west,south,east,north; within=GeoJSON Polygon

    let where = [];
    let params = [];
    let idx = 1;

    if (bbox) {
      const [minx, miny, maxx, maxy] = bbox.split(',').map(Number);
      where.push(`geom && ST_MakeEnvelope($${idx++}, $${idx++}, $${idx++}, $${idx++}, 4326)`);
      params.push(minx, miny, maxx, maxy);
    }

    if (within) {
      where.push(`ST_Within(geom, ST_SetSRID(ST_GeomFromGeoJSON($${idx++}), 4326))`);
      params.push(within);
    }

    const sql = `
      SELECT id, name, properties, ST_AsGeoJSON(geom)::json AS geom, created_at, updated_at
      FROM points
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);

    const r = await query(sql, params);
    res.json({ count: r.rowCount, items: r.rows });
  } catch (e) { next(e); }
});

// Get by id
router.get('/:id', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT id, name, properties, ST_AsGeoJSON(geom)::json AS geom, created_at, updated_at
       FROM points WHERE id = $1`,
      [req.params.id]
    );
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { next(e); }
});

// Update (partial)
router.patch('/:id', async (req, res, next) => {
  try {
    const fields = [];
    const params = [];
    let idx = 1;

    if (req.body.name !== undefined) {
      fields.push(`name = $${idx++}`);
      params.push(req.body.name);
    }
    if (req.body.properties !== undefined) {
      fields.push(`properties = $${idx++}`);
      params.push(req.body.properties);
    }
    if (req.body.geom !== undefined) {
      assertPointGeoJSON(req.body.geom);
      fields.push(`geom = ST_SetSRID(ST_GeomFromGeoJSON($${idx++}), 4326)`);
      params.push(JSON.stringify(req.body.geom));
    }

    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    const sql = `
      UPDATE points SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, name, properties, ST_AsGeoJSON(geom)::json AS geom, created_at, updated_at
    `;
    const r = await query(sql, params);
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { next(e); }
});

// Delete
router.delete('/:id', async (req, res, next) => {
  try {
    const r = await query(`DELETE FROM points WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) { next(e); }
});

// Nearest point to a given coordinate
router.get('/nearest/to', async (req, res, next) => {
  try {
    const { lon, lat, limit = 1 } = req.query;
    if (lon === undefined || lat === undefined) {
      return res.status(400).json({ error: 'lon and lat are required' });
    }
    const sql = `
      SELECT id, name, properties, ST_AsGeoJSON(geom)::json AS geom,
             ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography) AS meters
      FROM points
      ORDER BY geom <-> ST_SetSRID(ST_MakePoint($1,$2), 4326)
      LIMIT $3
    `;
    const r = await query(sql, [Number(lon), Number(lat), Number(limit)]);
    res.json({ items: r.rows });
  } catch (e) { next(e); }
});

module.exports = router;
