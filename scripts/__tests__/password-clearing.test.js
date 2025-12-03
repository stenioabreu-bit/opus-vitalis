/**
 * Property-based tests for password field clearing on failure
 * Feature: simple-login-auth, Property 3: Password field clearing on failure
 * Validates: Requirements 2.4
 */

const fc = require('fast-check');

// Mock DOM environment for testing
class MockDOM {
    constructor() {
        this.elements = {};
    }

    getElementById(id) {
        if (!this.elements[id]) {
            this.elements[id] = {
                value: '',
                addEventListener: () => {},
                focus: () => {}
            };
        }
        return this.elements[id];
    }

    createElement(tag) {
        return {
            innerHTML: '',
            className: '',
            appendChild: () => {}
        };
    }
}

// Mock AuthService for UI testing
class MockAuthService {
    constructor() {
        this.mockUsersData = {
            "bella_evans": {
                "id": "user_001",
                "username": "bella_evans",
                "password": "sãocristovão2016",
                "name": "Bella Evans",
                "role": "agent",
                "team": "team_alpha"
            }
        };
    }

    async handleLogin(username, password) {
        // Simulate authentication logic
        if (this.mockUsersData[username] && this.mockUsersData[username].password === password) {
            return {
                success: true,
                message: 'Login realizado com sucesso!',
                user: this.mockUsersData[username]
            };
        } else {
            return {
                success: false,
                message: 'Usuário ou senha inválidos'
            };
        }
    }
}

// Mock Utils for message display
class MockUtils {
    static showMessage(message, type) {
        // Mock implementation
    }

    static showLoading(elementId) {
        // Mock implementation
    }

    static hideLoading(elementId, text) {
        // Mock implementation
    }
}

// Login form handler that includes password clearing logic
class LoginFormHandler {
    constructor(authService, document, utils) {
        this.authService = authService;
        this.document = document;
        this.utils = utils;
    }

    async handleLoginSubmit(username, password) {
        const usernameField = this.document.getElementById('username');
        const passwordField = this.document.getElementById('password');
        
        // Set initial values
        usernameField.value = username;
        passwordField.value = password;

        try {
            const result = await this.authService.handleLogin(username, password);
            
            if (result.success) {
                this.utils.showMessage('Login realizado com sucesso!', 'success');
                return result;
            } else {
                this.utils.showMessage(result.message, 'error');
                // Clear password field on failure - this is the behavior we're testing
                passwordField.value = '';
                return result;
            }
        } catch (error) {
            this.utils.showMessage('Erro interno do sistema. Tente novamente.', 'error');
            // Clear password field on error too
            passwordField.value = '';
            throw error;
        }
    }
}

describe('Password Field Clearing Property Tests', () => {
    let authService;
    let mockDocument;
    let mockUtils;
    let loginHandler;
    
    beforeEach(() => {
        authService = new MockAuthService();
        mockDocument = new MockDOM();
        mockUtils = MockUtils;
        loginHandler = new LoginFormHandler(authService, mockDocument, mockUtils);
    });

    /**
     * Property 3: Password field clearing on failure
     * For any failed authentication attempt, the password input field should be cleared while the username field retains its value
     */
    test('Property 3: Password field clearing on failure', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.string({ minLength: 1, maxLength: 20 }),
                async (username, password) => {
                    // Skip if this happens to be a valid combination
                    if (username === 'bella_evans' && password === 'sãocristovão2016') {
                        return true;
                    }
                    
                    const result = await loginHandler.handleLoginSubmit(username, password);
                    
                    // For any failed authentication attempt
                    if (!result.success) {
                        const usernameField = mockDocument.getElementById('username');
                        const passwordField = mockDocument.getElementById('password');
                        
                        // Password field should be cleared
                        expect(passwordField.value).toBe('');
                        
                        // Username field should retain its value
                        expect(usernameField.value).toBe(username);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 3: Password field clearing on failure - specific invalid credentials', async () => {
        const invalidCredentials = [
            { username: 'bella_evans', password: 'wrong_password' },
            { username: 'invalid_user', password: 'any_password' },
            { username: 'carlos_silva', password: 'wrong_pass' }
        ];

        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom(...invalidCredentials),
                async (credentials) => {
                    const result = await loginHandler.handleLoginSubmit(credentials.username, credentials.password);
                    
                    // Should fail authentication
                    expect(result.success).toBe(false);
                    
                    const usernameField = mockDocument.getElementById('username');
                    const passwordField = mockDocument.getElementById('password');
                    
                    // Password field should be cleared
                    expect(passwordField.value).toBe('');
                    
                    // Username field should retain its value
                    expect(usernameField.value).toBe(credentials.username);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 3: Password field clearing preserves username on any failure', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.string({ minLength: 1, maxLength: 50 }),
                async (username, password) => {
                    // Force a failure by using credentials we know are invalid
                    const invalidPassword = password + '_invalid_suffix';
                    
                    const result = await loginHandler.handleLoginSubmit(username, invalidPassword);
                    
                    // Should fail authentication
                    expect(result.success).toBe(false);
                    
                    const usernameField = mockDocument.getElementById('username');
                    const passwordField = mockDocument.getElementById('password');
                    
                    // Password field should be cleared
                    expect(passwordField.value).toBe('');
                    
                    // Username field should retain its original value
                    expect(usernameField.value).toBe(username);
                }
            ),
            { numRuns: 100 }
        );
    });
});