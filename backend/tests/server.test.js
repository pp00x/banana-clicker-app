const request = require('supertest');
const { app, httpServer } = require('../app');
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const User = require('../src/models/User');

beforeAll(async () => {
  await connectDB();
});

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
  if (httpServer && httpServer.listening) {
    //
  }
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

  it('should register a new user successfully with valid data', async () => {
    const response = await request(app).post('/api/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe('User registered successfully!');
    expect(response.body.token).toBeDefined();
    expect(response.body.user.username).toBe('testuser');
    expect(response.body.user.email).toBe('test@example.com');
    expect(response.body.user.role).toBe('player');

    const userInDb = await User.findOne({ email: 'test@example.com' });
    expect(userInDb).not.toBeNull();
    expect(userInDb.username).toBe('testuser');
  });

  it('should fail to register if email is already in use', async () => {
    await User.create({
      username: 'existinguser',
      email: 'exists@example.com',
      password: 'password123',
    });

    const response = await request(app).post('/api/auth/register').send({
      username: 'newuser',
      email: 'exists@example.com',
      password: 'password123',
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Email already in use.');
  });

  it('should fail to register if username is already taken', async () => {
    await User.create({
      username: 'takenuser',
      email: 'unique@example.com',
      password: 'password123',
    });

    const response = await request(app).post('/api/auth/register').send({
      username: 'takenuser',
      email: 'newemail@example.com',
      password: 'password123',
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Username already taken.');
  });

  it('should fail to register with an invalid email format', async () => {
    const response = await request(app).post('/api/auth/register').send({
      username: 'testuserinvalidemail',
      email: 'invalid-email',
      password: 'password123',
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Please provide a valid email address.');
  });

  it('POST /api/auth/login - should fail if required fields are missing', async () => {
    const response = await request(app).post('/api/auth/login').send({});
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Please provide email and password.');
  });
});
