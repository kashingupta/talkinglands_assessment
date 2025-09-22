const request = require('supertest');
const app = require('../src/index.js');

describe('Points API', () => {
  let createdPointId;

  it('should create a point', async () => {
    const res = await request(app)
      .post('/points')
      .send({
        name: 'Test Point',
        geom: { type: 'Point', coordinates: [77.6, 12.97] }
      })
      .expect(201);
    expect(res.body.name).toBe('Test Point');
    expect(res.body.geom.type).toBe('Point');
    createdPointId = res.body.id;
  });

  it('should get the created point', async () => {
    const res = await request(app)
      .get(`/points/${createdPointId}`)
      .expect(200);
    expect(res.body.id).toBe(createdPointId);
  });

  it('should update the point partially', async () => {
    const res = await request(app)
      .patch(`/points/${createdPointId}`)
      .send({ name: 'Updated Point' })
      .expect(200);
    expect(res.body.name).toBe('Updated Point');
  });

  it('should delete the point', async () => {
    await request(app)
      .delete(`/points/${createdPointId}`)
      .expect(204);
  });

});
