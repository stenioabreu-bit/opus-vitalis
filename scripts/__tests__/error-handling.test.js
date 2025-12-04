/**
 * Tests for enhanced error handling and user feedback
 * Validates: Requirements 3.3, 4.1, 4.2, 4.3, 4.4
 */

// Mock DOM elements for testing
const mockElement = {
    innerHTML: '',
    disabled: false,
    dataset: {},
    classList: {
        add: jest.fn(),
        remove: jest.fn()
    },
    style: {},
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    parentNode: null
};

const mockDocument = {
    getElementById: jest.fn(() => mockElement),
    createElement: jest.fn(() => mockElement),
    body: mockElement
};

global.document = mockDocument;

// Import the modules we want to test
const DataLoader = require('../data-loader.js');

describe('Enhanced Error Handling Tests', () => {
    let dataLoader;
    
    beforeEach(() => {
        dataLoader = new DataLoader();
        // Reset mocks
        global.fetch = jest.fn();
        jest.clearAllMocks();
    });

    describe('DataLoader Error Handling', () => {
        test('should handle network errors gracefully', async () => {
            // Mock fetch to throw network error
            global.fetch.mockRejectedValue(new TypeError('Network error'));
            
            // Should not throw, should return fallback data
            const users = await dataLoader.loadUsers();
            
            expect(users).toBeDefined();
            expect(users.bella_evans).toBeDefined();
            expect(users.bella_evans.username).toBe('bella_evans');
        });

        test('should handle 404 errors with fallback data', async () => {
            // Mock fetch to return 404
            global.fetch.mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });
            
            const users = await dataLoader.loadUsers();
            
            expect(users).toBeDefined();
            expect(users.bella_evans).toBeDefined();
        });

        test('should handle invalid JSON with fallback data', async () => {
            // Mock fetch to return invalid JSON
            global.fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockRejectedValue(new SyntaxError('Invalid JSON'))
            });
            
            const users = await dataLoader.loadUsers();
            
            expect(users).toBeDefined();
            expect(users.bella_evans).toBeDefined();
        });

        test('should handle server errors with meaningful messages', async () => {
            // Mock fetch to return 500 error
            global.fetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });
            
            await expect(dataLoader.loadUsers()).rejects.toThrow('Não foi possível carregar os dados dos usuários');
        });

        test('should detect fallback data usage', async () => {
            // Mock fetch to return 404 to trigger fallback
            global.fetch.mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });
            
            await dataLoader.loadUsers();
            await dataLoader.loadTeams();
            
            expect(dataLoader.isUsingFallbackData()).toBe(true);
        });
    });

    describe('Fallback Data Integrity', () => {
        test('should provide valid fallback users data', () => {
            const fallbackUsers = dataLoader.getFallbackUsers();
            
            expect(fallbackUsers).toBeDefined();
            expect(fallbackUsers.bella_evans).toBeDefined();
            expect(fallbackUsers.bella_evans.id).toBe('user_001');
            expect(fallbackUsers.bella_evans.username).toBe('bella_evans');
            expect(fallbackUsers.bella_evans.password).toBe('sãocristovão2016');
        });

        test('should provide valid fallback teams data', () => {
            const fallbackTeams = dataLoader.getFallbackTeams();
            
            expect(fallbackTeams).toBeDefined();
            expect(fallbackTeams.team_alpha).toBeDefined();
            expect(fallbackTeams.team_alpha.id).toBe('team_alpha');
            expect(fallbackTeams.team_alpha.leaderId).toBe('user_002');
        });

        test('should provide empty fallback reports data', () => {
            const fallbackReports = dataLoader.getFallbackReports();
            
            expect(fallbackReports).toBeDefined();
            expect(typeof fallbackReports).toBe('object');
            expect(Object.keys(fallbackReports)).toHaveLength(0);
        });
    });
});