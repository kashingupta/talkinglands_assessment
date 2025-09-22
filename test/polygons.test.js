const request = require('supertest');
const app = require('../src/index.js');

describe('Polygons API', () => {
  let createdPolygonId;

  it('should create a polygon', async () => {
    const res = await request(app)
      .post('/polygons')
      .send({
        name: 'Test Polygon',
        geom: {
          type: 'Polygon',
          coordinates: [
            [
              [77.58, 12.96],
              [77.62, 12.96],
              [77.62, 12.99],
              [77.58, 12.99],
              [77.58, 12.96]
            ]
          ]
        }
      })
      .expect(201);
    expect(res.body.name).toBe('Test Polygon');
    expect(res.body.geom.type).toBe('Polygon');
    createdPolygonId = res.body.id;
  });

  it('should get the created polygon', async () => {
    const res = await request(app)
      .get(`/polygons/${createdPolygonId}`)
      .expect(200);
    expect(res.body.id).toBe(createdPolygonId);
  });

  it('should update the polygon partially', async () => {
    const res = await request(app)
      .patch(`/polygons/${createdPolygonId}`)
      .send({ name: 'Updated Polygon' })
      .expect(200);
    expect(res.body.name).toBe('Updated Polygon');
  });

  it('should delete the polygon', async () => {
    await request(app)
      .delete(`/polygons/${createdPolygonId}`)
      .expect(204);
  });
});
