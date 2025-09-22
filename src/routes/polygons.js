import express from 'express';
import { query } from '../db.js';
import { assertPolygonGeoJSON, parsePagination } from '../validators.js';

const router = express.Router();

// Create polygon
router.post('/', async (req, res, next) => {
  try {
    const { name, properties = {}, geom } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    assertPolygonGeoJSON(geom);

    const sql = `
      INSERT INTO polygons (name, properties, geom)
      VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326))
      RETURNING id, name, properties,
        ST_AsGeoJSON(geom)::json AS geom,
        created_at, updated_at
    `;
    const r = await query(sql, [name, properties, JSON.stringify(geom)]);
    res.status(201).json(r.rows[0]);
  } catch (e) { next(e); }
});

// List polygons with bbox and intersects filter
router.get('/', async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const { bbox, intersects } = req.query; // intersects=GeoJSON geometry

    let where = [];
    let params = [];
    let idx = 1;

    if (bbox) {
      const [minx, miny, maxx, maxy] = bbox.split(',').map(Number);
      where.push(`geom && ST_MakeEnvelope($${idx++}, $${idx++}, $${idx++}, $${idx++}, 4326)`);
      params.push(minx, miny, maxx, maxy);
    }

    if (intersects) {
      where.push(`ST_Intersects(geom, ST_SetSRID(ST_GeomFromGeoJSON($${idx++}), 4326))`);
      params.push(intersects);
    }

    const sql = `
      SELECT id, name, properties, ST_AsGeoJSON(geom)::json AS geom, created_at, updated_at
      FROM polygons
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
       FROM polygons WHERE id = $1`,
      [req.params.id]
    );
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { next(e); }
});

// Update polygon
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
      assertPolygonGeoJSON(req.body.geom);
      fields.push(`geom = ST_SetSRID(ST_GeomFromGeoJSON($${idx++}), 4326)`);
      params.push(JSON.stringify(req.body.geom));
    }

    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    const sql = `
      UPDATE polygons SET ${fields.join(', ')}
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
    const r = await query(`DELETE FROM polygons WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) { next(e); }
});

// Points-in-polygon query (optional cross-entity)
router.get('/:id/points', async (req, res, next) => {
  try {
    const sql = `
      SELECT p.id, p.name, p.properties, ST_AsGeoJSON(p.geom)::json AS geom
      FROM points p
      JOIN polygons g
        ON ST_Within(p.geom, g.geom)
      WHERE g.id = $1
    `;
    const r = await query(sql, [req.params.id]);
    res.json({ count: r.rowCount, items: r.rows });
  } catch (e) { next(e); }
});
export default router;
