import request from 'supertest';
import { app } from '../../src/app';

describe('GET /v1/math/add?q=10%2B10', () => {
  it('Adds the two numbers between the unicode for + in the URL', async () => {
    const res = await request(app).get('/v1/math/add?q=10%2B10');
    expect(res.status).toBe(200);
    expect(res.body.expression).toBe('10+10');
    expect(res.body.result).toBe('20');
  });
});
