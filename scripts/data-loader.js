// Data Loading Utility
// Handles loading and validation of JSON data files

class DataLoader {
    constructor() {
        this.usersCache = null;
        this.teamsCache = null;
        this.reportsCache = null;
    }

    // Load users data from JSON file
    async loadUsers() {
        if (this.usersCache) {
            return this.usersCache;
        }

        try {
            const response = await fetch('data/users.json');
            if (!response.ok) {
                throw new Error(`Failed to load users: ${response.status}`);
            }
            this.usersCache = await response.json();
            return this.usersCache;
        } catch (error) {
            console.error('Error loading users:', error);
            throw error;
        }
    }

    // Load teams data from JSON file
    async loadTeams() {
        if (this.teamsCache) {
            return this.teamsCache;
        }

        try {
            const response = await fetch('data/teams.json');
            if (!response.ok) {
                throw new Error(`Failed to load teams: ${response.status}`);
            }
            this.teamsCache = await response.json();
            return this.teamsCache;
        } catch (error) {
            console.error('Error loading teams:', error);
            throw error;
        }
    }

    // Load reports data from JSON file
    async loadReports() {
        if (this.reportsCache) {
            return this.reportsCache;
        }

        try {
            const response = await fetch('data/reports.json');
            if (!response.ok) {
                throw new Error(`Failed to load reports: ${response.status}`);
            }
            this.reportsCache = await response.json();
            return this.reportsCache;
        } catch (error) {
            console.error('Error loading reports:', error);
            throw error;
        }
    }

    // Validate user credentials against loaded database
    async validateUserCredentials(username, password) {
        const users = await this.loadUsers();
        
        // Check if user exists in database
        if (!users[username]) {
            return false;
        }

        // Validate password
        return users[username].password === password;
    }

    // Get user by username
    async getUserByUsername(username) {
        const users = await this.loadUsers();
        return users[username] || null;
    }

    // Clear cache (useful for testing)
    clearCache() {
        this.usersCache = null;
        this.teamsCache = null;
        this.reportsCache = null;
    }
}

// Export for use in other modules and tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLoader;
} else {
    window.DataLoader = DataLoader;
}