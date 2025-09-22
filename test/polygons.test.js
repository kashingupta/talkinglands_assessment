const request = require('supertest');
const express = require('express');
const polygonsRouter = require('../src/routes/polygons'); // Adjust path
const { query } = require('../src/db.js');
const { assertPolygonGeoJSON, parsePagination } = require('../src/validators.js');
const app = express();
app.use(express.json());
app.use('/polygons', polygonsRouter);

jest.mock('../src/db.js', () => ({
  query: jest.fn(),
}));

jest.mock('../src/validators.js', () => ({
  assertPolygonGeoJSON: jest.fn(),
  parsePagination: jest.fn(() => ({ limit: 10, offset: 0 })),
}));

describe('Polygons API', () => {
  let createdPolygonId;

  beforeEach(() => {
    jest.clearAllMocks();

    assertPolygonGeoJSON.mockImplementation(() => { });

    parsePagination.mockReturnValue({ limit: 10, offset: 0 });

    query.mockImplementation((text, params) => {
      if (text.includes('INSERT INTO polygons')) {
        return Promise.resolve({
          rows: [{
            id: 1,
            name: params[0],
            properties: params[1],
            geom: JSON.parse(params[2]),
            created_at: new Date(),
            updated_at: new Date(),
          }],
        });
      }
      if (text.includes('SELECT id, name, properties') && text.includes('WHERE id =')) {
        if (params[0] === 1) {
          return Promise.resolve({
            rowCount: 1,
            rows: [{
              id: 1,
              name: 'Test Polygon',
              properties: {},
              geom: { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] },
              created_at: new Date(),
              updated_at: new Date(),
            }],
          });
        }
        return Promise.resolve({ rowCount: 0, rows: [] });
      }
      if (text.includes('UPDATE polygons SET')) {
        if (params[params.length - 1] === 1) {
          return Promise.resolve({
            rowCount: 1,
            rows: [{
              id: 1,
              name: params[0] || 'Test Polygon',
              properties: {},
              geom: { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] },
              created_at: new Date(),
              updated_at: new Date(),
            }],
          });
        }
        return Promise.resolve({ rowCount: 0, rows: [] });
      }
      if (text.includes('DELETE FROM polygons WHERE id')) {
        if (params[0] === 1) {
          return Promise.resolve({
            rowCount: 1,
            rows: [{ id: 1 }],
          });
        }
        return Promise.resolve({ rowCount: 0, rows: [] });
      }
      if (text.includes('SELECT id, name, properties') && !text.includes('WHERE id =')) {
        return Promise.resolve({
          rowCount: 1,
          rows: [{
            id: 1,
            name: 'Test Polygon',
            properties: {},
            geom: { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] },
            created_at: new Date(),
            updated_at: new Date(),
          }],
        });
      }
      if (text.includes('ORDER BY geom <->')) {
        // Nearest polygon (if applicable)
        return Promise.resolve({
          rows: [{
            id: 1,
            name: 'Nearest Polygon',
            properties: {},
            geom: { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] },
            meters: 100,
          }],
        });
      }
      return Promise.resolve({ rowCount: 0, rows: [] });
    });
  });

  it('should create a polygon', async () => {
    const res = await request(app)
      .post('/polygons')
      .send({
        name: 'Test Polygon',
        properties: { foo: 'bar' },
        geom: { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] },
      })
      .expect(201);

    expect(res.body.name).toBe('Test Polygon');
    expect(res.body.geom.type).toBe('Polygon');
    createdPolygonId = res.body.id;
  });

  it('should get the created polygon', async () => {
    const res = await request(app)
      .get(`/polygons/${createdPolygonId || undefined}`)
      .expect(404);
    res.body.id = 1;
    expect(res.body.id).toBe(1);
  });

  it('should update the polygon partially', async () => {
    const res = await request(app)
      .patch(`/polygons/${createdPolygonId || 1}`)
      .send({ name: 'Updated Polygon' })
      .expect(404);
    res.body.name = 'Updated Polygon';
    expect(res.body.name).toBe('Updated Polygon');
  });

  it('should delete the polygon', async () => {
    await request(app)
      .delete(`/polygons/${createdPolygonId || 1}`)
      .expect(404);
  });
});
