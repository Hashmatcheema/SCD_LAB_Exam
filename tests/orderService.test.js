// tests/orderService.test.js
const request = require('supertest');
const app = require('../src/app');

describe('Order Service', () => {
  // Reset products stock before each test
  beforeEach(async () => {
    // Re-import the router to get fresh mock DB
    delete require.cache[require.resolve('../src/routes/orders')];
    delete require.cache[require.resolve('../src/routes/products')];
  });

  // a. Order creation – should create order with valid data
  test('a. Order creation – should create order with valid data', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ userId: 99, productId: 1, quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(999.99 * 2);
    expect(res.body.data.status).toBe('completed');
  });

  // b. Order creation – should reject order with insufficient stock
  test('b. Order creation – should reject order with insufficient stock', async () => {
    // First exhaust stock of Mouse (id=2, stock=3)
    await request(app).post('/api/orders').send({ userId: 1, productId: 2, quantity: 3 });
    const res = await request(app)
      .post('/api/orders')
      .send({ userId: 1, productId: 2, quantity: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Insufficient stock');
  });

  // c. Order creation – should reject order with invalid quantity
  test('c. Order creation – should reject order with invalid quantity', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ userId: 1, productId: 1, quantity: -5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Quantity must be positive');
  });
});