import request from 'supertest';
import { app } from '../../src/app';

describe('V1 Greeting Routes', () => {
  const name = 'kassie';

  it('POST /v1/greeting/user - returns Hello {enter name}', async () => {
    const res = await request(app).post('/v1/greeting/users').send({ name: name });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe(`Hello ${name}!`);
  });

  it('POST /v1/greeting/user - returns Hello {enter name}', async () => {
    const res = await request(app).post('/v1/greeting/users').send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(undefined);
  });
});
