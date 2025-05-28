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

    describe('PUT /api/users/:userId - Admin Edit Player Details', () => {
      let playerToEdit;

      beforeEach(async () => {
        playerToEdit = await User.create({
          username: 'editplayer',
          email: 'edit@example.com',
          password: 'password123',
          displayName: 'Edit Me Player',
        });
      });

      it('admin should successfully update displayName and avatarUrl', async () => {
        const updates = {
          displayName: 'Updated Name',
          avatarUrl: 'http://example.com/newavatar.png',
        };
        const response = await request(app)
          .put(`/api/users/${playerToEdit._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updates);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe(
          'User updated successfully by admin!'
        );
        expect(response.body.user.displayName).toBe(updates.displayName);
        expect(response.body.user.avatarUrl).toBe(updates.avatarUrl);

        const userInDb = await User.findById(playerToEdit._id);
        expect(userInDb.displayName).toBe(updates.displayName);
        expect(userInDb.avatarUrl).toBe(updates.avatarUrl);
      });

      it('admin should successfully update username to a unique one', async () => {
        const updates = { username: 'uniqueUpdatedUsername' };
        const response = await request(app)
          .put(`/api/users/${playerToEdit._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updates);
        expect(response.statusCode).toBe(200);
        expect(response.body.user.username).toBe(updates.username);
      });

      it('admin should successfully update email to a unique one', async () => {
        const updates = { email: 'uniqueUpdatedEmail@example.com' };
        const expectedEmailInResponse = 'uniqueupdatedemail@example.com';
        const response = await request(app)
          .put(`/api/users/${playerToEdit._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updates);
        expect(response.statusCode).toBe(200);
        expect(response.body.user.email).toBe(expectedEmailInResponse);
      });

      it('admin should successfully update role', async () => {
        const updates = { role: 'admin' };
        const response = await request(app)
          .put(`/api/users/${playerToEdit._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updates);
        expect(response.statusCode).toBe(200);
        expect(response.body.user.role).toBe('admin');
      });

      it('admin should fail to update username if new username is taken', async () => {
        await User.create({
          username: 'existingUsername',
          email: 'other@example.com',
          password: 'p',
        });
        const updates = { username: 'existingUsername' };
        const response = await request(app)
          .put(`/api/users/${playerToEdit._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updates);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe(
          'Username already taken by another account.'
        );
      });

      it('admin should fail to update email if new email is taken', async () => {
        await User.create({
          username: 'otheruser',
          email: 'existingEmail@example.com',
          password: 'p',
        });
        const updates = { email: 'existingEmail@example.com' };
        const response = await request(app)
          .put(`/api/users/${playerToEdit._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updates);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe(
          'Email already in use by another account.'
        );
      });

      it('admin should fail to update with an invalid role', async () => {
        const updates = { role: 'invalidRole' };
        const response = await request(app)
          .put(`/api/users/${playerToEdit._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updates);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe(
          'Invalid role specified. Must be "player" or "admin".'
        );
      });

      it('should not update password via this endpoint', async () => {
        const originalUser = await User.findById(playerToEdit._id);
        const originalPasswordHash = originalUser.password;

        const updates = { password: 'newPasswordAttempt123' };
        const response = await request(app)
          .put(`/api/users/${playerToEdit._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updates);

        expect(response.statusCode).toBe(200);
        const userInDb = await User.findById(playerToEdit._id);
        expect(userInDb.password).toBe(originalPasswordHash);
      });
    });
    describe('DELETE /api/users/:userId - Admin Soft Delete Player', () => {
      let playerToDelete;
      let anotherAdminUser;

      beforeEach(async () => {
        // Admin user (superadmin_test) is created by the outer beforeEach of 'User Management'
        playerToDelete = await User.create({
          username: 'deleteplayer',
          email: 'delete@example.com',
          password: 'password123',
        });
        anotherAdminUser = await User.create({
          username: 'anotheradmintodelete',
          email: 'anotheradmin@example.com',
          password: 'password123',
          role: 'admin',
        });
      });

      it('admin should successfully soft-delete an existing player', async () => {
        const response = await request(app)
          .delete(`/api/users/${playerToDelete._id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('User soft deleted successfully.');

        const userInDb = await User.findById(playerToDelete._id);
        expect(userInDb.isDeleted).toBe(true);

        // Verify GET /api/users/:userId returns 404 for this user
        const getResponse = await request(app)
          .get(`/api/users/${playerToDelete._id}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(getResponse.statusCode).toBe(404);
      });

      it('admin should receive success message when attempting to soft-delete an already soft-deleted player', async () => {
        playerToDelete.isDeleted = true;
        await playerToDelete.save();

        const response = await request(app)
          .delete(`/api/users/${playerToDelete._id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe(
          'User was already marked as deleted.'
        );
      });

      it('admin should get 404 when attempting to soft-delete a non-existent userId', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .delete(`/api/users/${nonExistentId}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe('User not found.');
      });

      it('admin should get 400 for an invalid userId format when attempting to delete', async () => {
        const response = await request(app)
          .delete('/api/users/invalidObjectIdFormat')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Invalid user ID format.');
      });

      it('admin should not be able to soft-delete themselves', async () => {
        const adminUserFromDB = await User.findOne({
          email: 'admin_test@example.com',
        }); // This is the admin from outer beforeEach
        expect(adminUserFromDB).not.toBeNull();

        const response = await request(app)
          .delete(`/api/users/${adminUserFromDB._id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body.message).toBe(
          'Admins cannot delete their own account.'
        );
      });

      it('admin should not be able to soft-delete another admin', async () => {
        const response = await request(app)
          .delete(`/api/users/${anotherAdminUser._id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body.message).toBe(
          'Admins cannot delete other admin accounts.'
        );
      });

      it('non-admin user should fail to soft-delete a player (403 Forbidden)', async () => {
        const playerData = {
          username: 'playerdeleteattempt',
          email: 'playerdeleteattempt@example.com',
          password: 'password123',
        };
        await User.create(playerData);
        const playerLoginResponse = await request(app)
          .post('/api/auth/login')
          .send({ email: playerData.email, password: playerData.password });
        const playerToken = playerLoginResponse.body.token;

        const response = await request(app)
          .delete(`/api/users/${playerToDelete._id}`)
          .set('Authorization', `Bearer ${playerToken}`);
        expect(response.statusCode).toBe(403);
      });
    });
  });

  // The misplaced DELETE describe block (lines 491-599) is removed by this diff.
  // It will be re-inserted correctly in the next step.

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
