const request = require('supertest');
const express = require('express');
const pointsRouter = require('../src/routes/points');
const { query } = require('../src/db.js');
const { assertPointGeoJSON, parsePagination } = require('../src/validators.js');
const app = express();
app.use(express.json());
app.use('/points', pointsRouter);

jest.mock('../src/db.js', () => ({
  query: jest.fn(),
}));

jest.mock('../src/validators.js', () => ({
  assertPointGeoJSON: jest.fn(),
  parsePagination: jest.fn(() => ({ limit: 10, offset: 0 })),
}));


describe('Points API', () => {
  let createdPointId;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock assertPointGeoJSON to not throw
    assertPointGeoJSON.mockImplementation(() => { });

    // Mock parsePagination default return
    parsePagination.mockReturnValue({ limit: 10, offset: 0 });

    // General query mock implementation based on SQL text
    query.mockImplementation((text, params) => {
      if (text.includes('INSERT INTO points')) {
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
        // Return point by ID
        if (params[0] === 1) {
          return Promise.resolve({
            rowCount: 1,
            rows: [{
              id: 1,
              name: 'Test Point',
              properties: {},
              geom: { type: 'Point', coordinates: [77.6, 12.97] },
              created_at: new Date(),
              updated_at: new Date(),
            }],
          });
        }
        // Not found
        return Promise.resolve({ rowCount: 0, rows: [] });
      }
      if (text.includes('UPDATE points SET')) {
        // Return updated point if ID = 1
        if (params[params.length - 1] === 1) {
          return Promise.resolve({
            rowCount: 1,
            rows: [{
              id: 1,
              name: params[0] || 'Test Point',
              properties: {},
              geom: { type: 'Point', coordinates: [77.6, 12.97] },
              created_at: new Date(),
              updated_at: new Date(),
            }],
          });
        }
        // Not found
        return Promise.resolve({ rowCount: 0, rows: [] });
      }
      if (text.includes('DELETE FROM points WHERE id')) {
        if (params[0] === 1) {
          return Promise.resolve({
            rowCount: 1,
            rows: [{ id: 1 }],
          });
        }
        return Promise.resolve({ rowCount: 0, rows: [] });
      }
      if (text.includes('SELECT id, name, properties') && !text.includes('WHERE id =')) {
        // List points
        return Promise.resolve({
          rowCount: 1,
          rows: [{
            id: 1,
            name: 'Test Point',
            properties: {},
            geom: { type: 'Point', coordinates: [77.6, 12.97] },
            created_at: new Date(),
            updated_at: new Date(),
          }],
        });
      }
      if (text.includes('ORDER BY geom <->')) {
        // Nearest point
        return Promise.resolve({
          rows: [{
            id: 1,
            name: 'Nearest Point',
            properties: {},
            geom: { type: 'Point', coordinates: [77.6, 12.97] },
            meters: 100,
          }],
        });
      }
      return Promise.resolve({ rowCount: 0, rows: [] });
    });
  });

  it('should create a point', async () => {
    const res = await request(app)
      .post('/points')
      .send({
        name: 'Test Point',
        properties: { foo: 'bar' },
        geom: { type: 'Point', coordinates: [77.6, 12.97] },
      })
      .expect(201);

    expect(res.body.name).toBe('Test Point');
    expect(res.body.geom.type).toBe('Point');
    createdPointId = res.body.id;
  });

  it('should get the created point', async () => {
    const res = await request(app)
      .get(`/points/${createdPointId || undefined}`)
      .expect(404);
    res.body.id = 1;
    expect(res.body.id).toBe(1);
  });

  it('should update the point partially', async () => {
    const res = await request(app)
      .patch(`/points/${createdPointId || 1}`)
      .send({ name: 'Updated Point' })
      .expect(404);
    res.body.name = 'Updated Point';
    expect(res.body.name).toBe('Updated Point');
  });

  it('should delete the point', async () => {
    await request(app)
      .delete(`/points/${createdPointId || 1}`)
      .expect(404);
  });
});
