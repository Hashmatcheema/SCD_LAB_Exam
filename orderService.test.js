const orderService = require('../src/services/orderService');

describe('Order Service Tests', () => {
    beforeEach(() => {
        orderService.resetOrders();
        orderService.resetProducts();
    });

    describe('createOrder', () => {
        test('Order creation - should create order with valid data', () => {
            const validOrder = {
                userId: 1,
                productId: 1,
                quantity: 2
            };

            const result = orderService.createOrder(validOrder);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.userId).toBe(1);
            expect(result.data.productId).toBe(1);
            expect(result.data.quantity).toBe(2);
            expect(result.data.total).toBeDefined();
            expect(result.data.status).toBe('completed');
            expect(result.error).toBeUndefined();

            // Verify order was added
            const allOrders = orderService.getAllOrders();
            expect(allOrders.length).toBe(1);
        });

        test('Order creation - should reject order with insufficient stock', () => {
            const invalidOrder = {
                userId: 1,
                productId: 1, 
                quantity: 15  
            };

            const result = orderService.createOrder(invalidOrder);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Insufficient stock');
            expect(result.data).toBeUndefined();

            const allOrders = orderService.getAllOrders();
            expect(allOrders.length).toBe(0);
        });

        test('Order creation - should reject order with invalid quantity', () => {
            const invalidOrder = {
                userId: 1,
                productId: 1,
                quantity: 0 
            };

            const result = orderService.createOrder(invalidOrder);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Quantity must be a positive integer');
            expect(result.data).toBeUndefined();

            const invalidOrder2 = {
                userId: 1,
                productId: 1,
                quantity: -5
            };

            const result2 = orderService.createOrder(invalidOrder2);
            expect(result2.success).toBe(false);
            expect(result2.error).toBe('Quantity must be a positive integer');

            // Test with non-integer quantity
            const invalidOrder3 = {
                userId: 1,
                productId: 1,
                quantity: 2.5
            };

            const result3 = orderService.createOrder(invalidOrder3);
            expect(result3.success).toBe(false);
            expect(result3.error).toBe('Quantity must be a positive integer');
        });

        test('Order creation - should reject order with missing required fields', () => {
            const incompleteOrder = {
                userId: 1,
                productId: 1
            };

            const result = orderService.createOrder(incompleteOrder);

            expect(result.success).toBe(false);
            expect(result.error).toBe('UserId, productId, and quantity are required fields');
        });

        test('Order creation - should reject order with non-existent product', () => {
            const invalidOrder = {
                userId: 1,
                productId: 999, 
                quantity: 1
            };

            const result = orderService.createOrder(invalidOrder);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Product not found');
        });
    });
});

