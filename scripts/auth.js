// Authentication Service Module
// Handles user login, logout, and session management

class AuthService {
    constructor() {
        this.currentUser = null;
        this.sessionKey = 'ordem_paranormal_session';
        this.dataLoader = new DataLoader();
    }

    // Initialize authentication service
    async init() {
        // Check for existing session
        this.checkSession();
    }

    // Validate credentials against static database
    async validateCredentials(username, password) {
        try {
            const isValid = await this.dataLoader.validateUserCredentials(username, password);
            return {
                success: isValid,
                message: isValid ? 'Credenciais válidas' : 'Usuário ou senha inválidos'
            };
        } catch (error) {
            console.error('Error validating credentials:', error);
            return {
                success: false,
                message: 'Erro ao validar credenciais. Tente novamente.'
            };
        }
    }

    // Load user data from database
    async loadUserData(username) {
        try {
            const userData = await this.dataLoader.getUserByUsername(username);
            return userData;
        } catch (error) {
            console.error('Error loading user data:', error);
            return null;
        }
    }

    // Handle login process
    async handleLogin(username, password) {
        try {
            // Validate credentials
            const validation = await this.validateCredentials(username, password);
            
            if (!validation.success) {
                return validation;
            }

            // Load user data
            const userData = await this.loadUserData(username);
            
            if (!userData) {
                return {
                    success: false,
                    message: 'Erro ao carregar dados do usuário'
                };
            }

            // Create session
            this.currentUser = userData;
            localStorage.setItem(this.sessionKey, JSON.stringify(userData));

            return {
                success: true,
                message: 'Login realizado com sucesso!',
                user: userData
            };
        } catch (error) {
            console.error('Error during login:', error);
            return {
                success: false,
                message: 'Erro interno do sistema. Tente novamente.'
            };
        }
    }

    // Handle logout process
    handleLogout() {
        this.currentUser = null;
        localStorage.removeItem(this.sessionKey);
        window.location.href = 'login.html';
    }

    // Check if user has active session
    checkSession() {
        const sessionData = localStorage.getItem(this.sessionKey);
        if (sessionData) {
            try {
                this.currentUser = JSON.parse(sessionData);
                return true;
            } catch (error) {
                localStorage.removeItem(this.sessionKey);
                return false;
            }
        }
        return false;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Export for use in other modules
window.AuthService = AuthService;