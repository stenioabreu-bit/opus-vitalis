/**
 * Property-based tests for user data validation
 * Feature: simple-login-auth, Property 4: Database validation consistency
 * Validates: Requirements 3.2
 */

const fc = require('fast-check');
const DataLoader = require('../data-loader');

// Mock fetch for testing
global.fetch = jest.fn();

describe('DataLoader Property Tests', () => {
    let dataLoader;
    
    // Sample user data for testing
    const mockUsersData = {
        "bella_evans": {
            "id": "user_001",
            "username": "bella_evans",
            "password": "sãocristovão2016",
            "name": "Bella Evans",
            "role": "agent",
            "team": "team_alpha",
            "createdAt": "2024-01-01T00:00:00Z"
        },
        "carlos_silva": {
            "id": "user_002",
            "username": "carlos_silva",
            "password": "lider2024",
            "name": "Carlos Silva",
            "role": "leader",
            "team": "team_alpha",
            "createdAt": "2024-01-01T00:00:00Z"
        }
    };

    beforeEach(() => {
        dataLoader = new DataLoader();
        dataLoader.clearCache();
        
        // Mock successful fetch response
        fetch.mockResolvedValue({
            ok: true,
            json: async () => mockUsersData
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Property 4: Database validation consistency
     * For any credential validation request, the system should always compare against the loaded user database data
     */
    test('Property 4: Database validation consistency - valid credentials from database should authenticate', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom(...Object.keys(mockUsersData)),
                async (username) => {
                    const user = mockUsersData[username];
                    const result = await dataLoader.validateUserCredentials(username, user.password);
                    
                    // For any valid credentials in the database, validation should return true
                    expect(result).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 4: Database validation consistency - invalid credentials should be rejected', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.string({ minLength: 1, maxLength: 20 }),
                async (username, password) => {
                    // Skip if this happens to be a valid combination
                    if (mockUsersData[username] && mockUsersData[username].password === password) {
                        return true;
                    }
                    
                    const result = await dataLoader.validateUserCredentials(username, password);
                    
                    // For any invalid credentials, validation should return false
                    expect(result).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 4: Database validation consistency - getUserByUsername returns consistent data', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom(...Object.keys(mockUsersData)),
                async (username) => {
                    const user = await dataLoader.getUserByUsername(username);
                    
                    // For any valid username, should return the exact user data from database
                    expect(user).toEqual(mockUsersData[username]);
                    expect(user.username).toBe(username);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 4: Database validation consistency - non-existent users return null', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 20 }),
                async (username) => {
                    // Skip if this happens to be a valid username
                    if (mockUsersData[username]) {
                        return true;
                    }
                    
                    const user = await dataLoader.getUserByUsername(username);
                    
                    // For any non-existent username, should return null
                    expect(user).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });
});