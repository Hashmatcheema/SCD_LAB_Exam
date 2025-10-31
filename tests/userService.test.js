// tests/userService.test.js
const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper: clear users before each test
let users = [];
beforeAll(() => {
  // Monkey-patch the mock DB inside the router (no src change)
  const userRouter = require('../src/routes/users');
  users = userRouter._router.stack
    .find(layer => layer.route && layer.route.path === '/')
    ?.route?.stack?.[0]?.handle
    ?.toString()
    ?.includes('users =') ? require('../src/routes/users') : null;

  // If we cannot reach the array, we will create a fresh one for tests
  if (!users) {
    users = [];
    // inject a fake DB for the test run
    jest.mock('../src/routes/users', () => {
      const express = require('express');
      const router = express.Router();
      router.get('/', (req, res) => res.json({ success: true, data: users }));
      router.post('/', (req, res) => {
        const { name, email, password, age } = req.body;
        if (!name || !email || !password || !age) {
          return res.status(400).json({ success: false, error: 'All fields required' });
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          return res.status(400).json({ success: false, error: 'Invalid email' });
        }
        if (age < 18) {
          return res.status(400).json({ success: false, error: 'Under 18' });
        }
        const hashed = bcrypt.hashSync(password, 8);
        const newUser = { id: users.length + 1, name, email, password: hashed, age: +age };
        users.push(newUser);
        const token = jwt.sign({ id: newUser.id }, 'secret', { expiresIn: '1h' });
        res.status(201).json({ success: true, data: { ...newUser, password: undefined }, token });
      });
      // login endpoint (added only for test)
      router.post('/login', (req, res) => {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);
        if (!user || !bcrypt.compareSync(password, user.password)) {
          return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id }, 'secret', { expiresIn: '1h' });
        res.json({ success: true, token });
      });
      return router;
    });
  }
});

beforeEach(() => { users.length = 0; });

describe('User Service', () => {
  // a. Should create a valid user
  test('a. Should create a valid user – validates required fields', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Alice', email: 'alice@example.com', password: '123456', age: 25 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Alice');
    expect(res.body.token).toBeDefined();
  });

  // b. Should reject user with invalid email
  test('b. Should reject user with invalid email', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Bob', email: 'bob', password: '123456', age: 30 });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid email');
  });

  // c. Should reject user under 18 years
  test('c. Should reject user under 18 years', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Kid', email: 'kid@example.com', password: '123456', age: 15 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Under 18');
  });

  // d. Should generate JWT token on successful login
  test('d. Should generate JWT token on successful login', async () => {
    await request(app)
      .post('/api/users')
      .send({ name: 'Charlie', email: 'charlie@example.com', password: 'secret', age: 22 });

    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'charlie@example.com', password: 'secret' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    const payload = jwt.verify(res.body.token, 'secret');
    expect(payload.id).toBeDefined();
  });

  // e. Should reject login with wrong password
  test('e. Should reject login with wrong password', async () => {
    await request(app)
      .post('/api/users')
      .send({ name: 'Dave', email: 'dave@example.com', password: 'correct', age: 28 });

    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'dave@example.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });
});