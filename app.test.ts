import supertest from 'supertest';
import app from './app';

describe('/stations', () => {
  it('GET should return 200', async () => {
    const { status, body } = await supertest(app).get('/stations');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBeTruthy();
  });
});
