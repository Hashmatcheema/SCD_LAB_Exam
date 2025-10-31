const userService = require('../src/services/userService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('User Service Tests', () => {
    beforeEach(() => {
        // Reset users array to initial state before each test
        userService.resetUsers();
    });

    describe('createUser', () => {
        test('Should create a valid user – should validate required user fields', () => {
            // Test with all required fields present
            const validUser = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                age: 25
            };

            const result = userService.createUser(validUser);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.name).toBe('Test User');
            expect(result.data.email).toBe('test@example.com');
            expect(result.data.age).toBe(25);
            expect(result.data.password).toBeUndefined(); // Password should not be returned
            expect(result.error).toBeUndefined();
            
            // Also test missing required fields
            const incompleteUser = {
                email: 'test2@example.com',
                password: 'password123',
                age: 25
                // Missing name
            };
            const result2 = userService.createUser(incompleteUser);
            expect(result2.success).toBe(false);
            expect(result2.error).toBe('Name, email, password, and age are required fields');
        });

        test('Should reject user with invalid email', () => {
            const invalidEmailUser = {
                name: 'Test User',
                email: 'invalid-email',
                password: 'password123',
                age: 25
            };

            const result = userService.createUser(invalidEmailUser);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid email format');
            expect(result.data).toBeUndefined();
        });

        test('Should reject user under 18 years', () => {
            const underageUser = {
                name: 'Young User',
                email: 'young@example.com',
                password: 'password123',
                age: 17
            };

            const result = userService.createUser(underageUser);

            expect(result.success).toBe(false);
            expect(result.error).toBe('User must be at least 18 years old');
            expect(result.data).toBeUndefined();
        });

    });

    describe('login', () => {
        test('Should generate JWT token on successful login', () => {
            // Use existing user from seed data or create new one
            const testEmail = 'logintest@example.com';
            const testPassword = 'testpassword123';
            
            // Create a test user
            const testUser = {
                name: 'Login Test User',
                email: testEmail,
                password: testPassword,
                age: 22
            };
            userService.createUser(testUser);

            const result = userService.login(testEmail, testPassword);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.token).toBeDefined();
            expect(result.data.user).toBeDefined();
            
            // Verify token is valid JWT
            const decoded = jwt.decode(result.data.token);
            expect(decoded).toBeDefined();
            expect(decoded.email).toBe(testEmail);
        });


        test('Should reject login with wrong password', () => {
            const testEmail = 'wrongpass@example.com';
            const testPassword = 'correctpassword123';
            
            // Create a test user
            const testUser = {
                name: 'Wrong Pass User',
                email: testEmail,
                password: testPassword,
                age: 22
            };
            userService.createUser(testUser);

            const result = userService.login(testEmail, 'wrongpassword');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid email or password');
            expect(result.data).toBeUndefined();
        });
    });
});

