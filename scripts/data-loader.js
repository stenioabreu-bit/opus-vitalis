// Data Loading Utility
// Handles loading and validation of JSON data files

class DataLoader {
    constructor() {
        try {
            console.log('Initializing DataLoader...');
            this.usersCache = null;
            this.teamsCache = null;
            this.reportsCache = null;
            console.log('DataLoader initialized successfully');
        } catch (error) {
            console.error('Error in DataLoader constructor:', error);
            throw error;
        }
    }

    // Load users data from JSON file
    async loadUsers() {
        if (this.usersCache) {
            return this.usersCache;
        }

        try {
            const response = await fetch('data/users.json');
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn('Users file not found, using fallback data');
                    this.usersCache = this.getFallbackUsers();
                    return this.usersCache;
                }
                throw new Error(`Erro ao carregar dados dos usuários (${response.status}): ${response.statusText}`);
            }
            
            const data = await response.json();
            if (!data || typeof data !== 'object') {
                throw new Error('Formato inválido do arquivo de usuários');
            }
            
            this.usersCache = data;
            return this.usersCache;
        } catch (error) {
            console.error('Error loading users:', error);
            
            // If it's a network error or parsing error, provide fallback
            if (error instanceof TypeError || error.name === 'SyntaxError') {
                console.warn('Network or parsing error, using fallback users data');
                this.usersCache = this.getFallbackUsers();
                return this.usersCache;
            }
            
            throw new Error(`Não foi possível carregar os dados dos usuários: ${error.message}`);
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
                if (response.status === 404) {
                    console.warn('Teams file not found, using fallback data');
                    this.teamsCache = this.getFallbackTeams();
                    return this.teamsCache;
                }
                throw new Error(`Erro ao carregar dados das equipes (${response.status}): ${response.statusText}`);
            }
            
            const data = await response.json();
            if (!data || typeof data !== 'object') {
                throw new Error('Formato inválido do arquivo de equipes');
            }
            
            this.teamsCache = data;
            return this.teamsCache;
        } catch (error) {
            console.error('Error loading teams:', error);
            
            // If it's a network error or parsing error, provide fallback
            if (error instanceof TypeError || error.name === 'SyntaxError') {
                console.warn('Network or parsing error, using fallback teams data');
                this.teamsCache = this.getFallbackTeams();
                return this.teamsCache;
            }
            
            throw new Error(`Não foi possível carregar os dados das equipes: ${error.message}`);
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
                if (response.status === 404) {
                    console.warn('Reports file not found, using fallback data');
                    this.reportsCache = this.getFallbackReports();
                    return this.reportsCache;
                }
                throw new Error(`Erro ao carregar relatórios (${response.status}): ${response.statusText}`);
            }
            
            const data = await response.json();
            if (!data || typeof data !== 'object') {
                throw new Error('Formato inválido do arquivo de relatórios');
            }
            
            this.reportsCache = data;
            return this.reportsCache;
        } catch (error) {
            console.error('Error loading reports:', error);
            
            // If it's a network error or parsing error, provide fallback
            if (error instanceof TypeError || error.name === 'SyntaxError') {
                console.warn('Network or parsing error, using fallback reports data');
                this.reportsCache = this.getFallbackReports();
                return this.reportsCache;
            }
            
            throw new Error(`Não foi possível carregar os relatórios: ${error.message}`);
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

    // Get fallback reports data when file loading fails
    getFallbackReports() {
        console.log('Using fallback reports data');
        return {
            "report_fallback_001": {
                "id": "report_fallback_001",
                "title": "Sistema Inicializado",
                "description": "Sistema de relatórios inicializado com sucesso. Dados de fallback carregados.",
                "missionDate": "2024-12-04",
                "status": "completed",
                "authorId": "user_001",
                "authorName": "Sistema",
                "createdAt": "2024-12-04T10:00:00.000Z",
                "updatedAt": "2024-12-04T10:00:00.000Z",
                "isPublic": false
            }
        };
    }

    // Check if system is running with fallback data
    isUsingFallbackData() {
        return this.usersCache && Object.keys(this.usersCache).length === 1 && 
               this.usersCache.bella_evans && 
               this.teamsCache && Object.keys(this.teamsCache).length === 1;
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