import supertest from 'supertest';
import app from './app';

describe('/stations', () => {
  it('GET should return 200', async () => {
    const response = await supertest(app).get('/stations');
    expect(response.status).toBe(200);
    expect(Array.isArray(response)).toBeTruthy();
  });
});
