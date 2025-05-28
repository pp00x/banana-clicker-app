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

  describe('User Management API Endpoints (Admin Only)', () => {
    let adminToken;

    beforeEach(async () => {
      await User.deleteMany({});

      const adminData = {
        username: 'superadmin_test',
        email: 'admin_test@example.com',
        password: 'password123',
        role: 'admin',
      };
      await User.create(adminData);

      const loginResponse = await request(app).post('/api/auth/login').send({
        email: adminData.email,
        password: adminData.password,
      });
      if (loginResponse.body.token) {
        adminToken = loginResponse.body.token;
      } else {
        throw new Error('Admin user login failed during test setup.');
      }
      expect(adminToken).toBeDefined();
    });

    describe('POST /api/users - Admin Create Player', () => {
      it('admin should successfully create a new player', async () => {
        const newPlayerData = {
          username: 'newplayer',
          email: 'player@example.com',
          password: 'playerpassword',
          displayName: 'New Player',
        };
        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(newPlayerData);

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe(
          'User created successfully by admin!'
        );
        expect(response.body.user.username).toBe(newPlayerData.username);
        expect(response.body.user.email).toBe(newPlayerData.email);
        expect(response.body.user.role).toBe('player');
      });

      it('admin should fail to create player if required fields are missing', async () => {
        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ email: 'test@example.com' });
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe(
          'Please provide username, email, and password.'
        );
      });

      it('admin should fail to create player if email is already in use', async () => {
        await User.create({
          username: 'p1',
          email: 'takenemail@example.com',
          password: 'p',
        });

        const newPlayerData = {
          username: 'newplayer2',
          email: 'takenemail@example.com',
          password: 'playerpassword',
        };
        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(newPlayerData);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(
          /Email already in use|User creation failed/i
        );
      });
    });

    describe('GET /api/users - Admin List Players', () => {
      it('admin should successfully retrieve a list of users', async () => {
        await User.create({
          username: 'player1',
          email: 'player1@example.com',
          password: 'password123',
        });
        await User.create({
          username: 'player2',
          email: 'player2@example.com',
          password: 'password123',
        });

        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Users retrieved successfully!');
        expect(response.body.users).toBeInstanceOf(Array);

        expect(response.body.users.length).toBeGreaterThanOrEqual(3);

        response.body.users.forEach((user) => {
          expect(user.password).toBeUndefined();
          expect(user.isDeleted).toBe(false);
        });
      });

      it('should not list soft-deleted users', async () => {
        await User.create({
          username: 'player3',
          email: 'player3@example.com',
          password: 'password123',
        });
        await User.create({
          username: 'deletedplayer',
          email: 'deletedplayer@example.com',
          password: 'password123',
          isDeleted: true,
        });

        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        const usernames = response.body.users.map((u) => u.username);
        expect(usernames).not.toContain('deletedplayer');

        const foundPlayer3 = response.body.users.find(
          (u) => u.username === 'player3'
        );
        expect(foundPlayer3).toBeDefined();

        const foundAdmin = response.body.users.find(
          (u) => u.username === 'superadmin_test'
        );
        expect(foundAdmin).toBeDefined();
        expect(response.body.users.length).toBe(2); // player3 + superadmin_test
      });

      it('non-admin user should fail to retrieve the list of users (403 Forbidden)', async () => {
        const playerData = {
          username: 'playerattempt',
          email: 'playerattempt@example.com',
          password: 'password123',
        };
        await User.create(playerData);
        const playerLoginResponse = await request(app)
          .post('/api/auth/login')
          .send({ email: playerData.email, password: playerData.password });
        const playerToken = playerLoginResponse.body.token;
        expect(playerToken).toBeDefined();

        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${playerToken}`);

        expect(response.statusCode).toBe(403);
      });

      it('should fail to retrieve list of users without a token (401 Unauthorized)', async () => {
        const response = await request(app).get('/api/users');

        expect(response.statusCode).toBe(401);
      });
    });

    describe('GET /api/users/:userId - Admin Get Player Details', () => {
      let testPlayer;

      beforeEach(async () => {
        testPlayer = await User.create({
          username: 'detailplayer',
          email: 'detail@example.com',
          password: 'password123',
          displayName: 'Detail Player',
        });
      });

      it('admin should successfully retrieve details for an existing player', async () => {
        const response = await request(app)
          .get(`/api/users/${testPlayer._id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe(
          'User details retrieved successfully!'
        );
        expect(response.body.user).toBeDefined();
        expect(response.body.user._id).toBe(testPlayer._id.toString());
        expect(response.body.user.username).toBe(testPlayer.username);
        expect(response.body.user.password).toBeUndefined();
      });

      it('admin should get 404 for a non-existent userId', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .get(`/api/users/${nonExistentId}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe(
          'User not found or has been deleted.'
        );
      });

      it('admin should get 404 for a soft-deleted user', async () => {
        const softDeletedPlayer = await User.create({
          username: 'softdeleted',
          email: 'softdeleted@example.com',
          password: 'password123',
          isDeleted: true,
        });
        const response = await request(app)
          .get(`/api/users/${softDeletedPlayer._id}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe(
          'User not found or has been deleted.'
        );
      });

      it('admin should get 400 for an invalid userId format', async () => {
        const response = await request(app)
          .get('/api/users/invalidObjectIdFormat')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Invalid user ID format.');
      });

      it('non-admin user should fail to retrieve player details (403 Forbidden)', async () => {
        const playerData = {
          username: 'playerdetailattempt',
          email: 'playerdetailattempt@example.com',
          password: 'password123',
        };
        await User.create(playerData);
        const playerLoginResponse = await request(app)
          .post('/api/auth/login')
          .send({ email: playerData.email, password: playerData.password });
        const playerToken = playerLoginResponse.body.token;

        const response = await request(app)
          .get(`/api/users/${testPlayer._id}`)
          .set('Authorization', `Bearer ${playerToken}`);
        expect(response.statusCode).toBe(403);
      });

      it('should fail to retrieve player details without a token (401 Unauthorized)', async () => {
        const response = await request(app).get(`/api/users/${testPlayer._id}`);
        expect(response.statusCode).toBe(401);
      });
    });
  });

  it('should login an existing user successfully with correct credentials', async () => {
    const userData = {
      username: 'loginuser',
      email: 'login@example.com',
      password: 'password123',
      displayName: 'Login User',
    };
    await User.create(userData);

    const response = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Login successful!');
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe('login@example.com');
  });

  it('should fail to login with incorrect password', async () => {
    const userData = {
      username: 'loginuserwp',
      email: 'loginwp@example.com',
      password: 'password123',
    };
    await User.create(userData);

    const response = await request(app).post('/api/auth/login').send({
      email: 'loginwp@example.com',
      password: 'wrongpassword',
    });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('Invalid credentials.');
  });

  it('should fail to login with non-existent email', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'nonexistent@example.com',
      password: 'password123',
    });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('Invalid credentials.');
  });

  it('should fail to login if user account is blocked', async () => {
    await User.create({
      username: 'blockeduser',
      email: 'blocked@example.com',
      password: 'password123',
      isBlocked: true,
    });

    const response = await request(app).post('/api/auth/login').send({
      email: 'blocked@example.com',
      password: 'password123',
    });
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe(
      'Your account is blocked. Please contact support.'
    );
  });

  it('should fail to login if user account is soft-deleted', async () => {
    await User.create({
      username: 'deleteduser',
      email: 'deleted@example.com',
      password: 'password123',
      isDeleted: true,
    });

    const response = await request(app).post('/api/auth/login').send({
      email: 'deleted@example.com',
      password: 'password123',
    });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('Invalid credentials.');
  });
});
