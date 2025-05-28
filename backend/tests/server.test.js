const request = require('supertest');
const { app, httpServer } = require('../app');

beforeAll(async () => {
  // @shelf/jest-mongodb handles DB setup and MONGO_URL
});

afterAll(async () => {
  if (httpServer && httpServer.listening) {
    // This block might be needed if tests started the main httpServer.
    // For now, supertest(app) handles server lifecycle for these tests.
  }
  // jest-mongodb handles its own DB server teardown.
});

describe('GET / - Basic Server Test', () => {
  it('should respond with "Banana Clicker Backend is Alive!"', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Banana Clicker Backend is Alive!');
  });
});

describe('Auth Endpoints Basic Validation', () => {
  it('POST /api/auth/register - should fail if required fields are missing', async () => {
    const response = await request(app).post('/api/auth/register').send({});
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      'Please provide username, email, and password.'
    );
  });

  it('POST /api/auth/login - should fail if required fields are missing', async () => {
    const response = await request(app).post('/api/auth/login').send({});
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Please provide email and password.');
  });
});
