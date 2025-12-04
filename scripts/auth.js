// Authentication Service Module
// Handles user login, logout, and session management

class AuthService {
    constructor() {
        this.currentUser = null;
        this.sessionKey = 'opus_vitalis_session';
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
            // Input validation
            if (!username || !password) {
                return {
                    success: false,
                    message: 'Por favor, preencha usuário e senha'
                };
            }

            if (typeof username !== 'string' || typeof password !== 'string') {
                return {
                    success: false,
                    message: 'Formato inválido de credenciais'
                };
            }

            const isValid = await this.dataLoader.validateUserCredentials(username.trim(), password);
            
            if (this.dataLoader.isUsingFallbackData()) {
                console.warn('Sistema operando com dados de fallback');
            }
            
            return {
                success: isValid,
                message: isValid ? 'Credenciais válidas' : 'Usuário ou senha inválidos',
                usingFallback: this.dataLoader.isUsingFallbackData()
            };
        } catch (error) {
            console.error('Error validating credentials:', error);
            return {
                success: false,
                message: error.message.includes('carregar') ? 
                    error.message : 
                    'Erro interno do sistema. Verifique sua conexão e tente novamente.'
            };
        }
    }

    // Load user data from database
    async loadUserData(username) {
        try {
            if (!username || typeof username !== 'string') {
                throw new Error('Nome de usuário inválido');
            }

            const userData = await this.dataLoader.getUserByUsername(username.trim());
            
            if (!userData) {
                throw new Error('Dados do usuário não encontrados');
            }

            return userData;
        } catch (error) {
            console.error('Error loading user data:', error);
            throw new Error(`Erro ao carregar dados do usuário: ${error.message}`);
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

            // Create session with error handling
            try {
                this.currentUser = userData;
                localStorage.setItem(this.sessionKey, JSON.stringify(userData));
            } catch (storageError) {
                console.error('Error saving session:', storageError);
                return {
                    success: false,
                    message: 'Erro ao salvar sessão. Verifique se o armazenamento local está habilitado.'
                };
            }

            const successMessage = validation.usingFallback ? 
                'Login realizado com sucesso! (Modo offline)' : 
                'Login realizado com sucesso!';

            return {
                success: true,
                message: successMessage,
                user: userData,
                usingFallback: validation.usingFallback
            };
        } catch (error) {
            console.error('Error during login:', error);
            return {
                success: false,
                message: error.message.includes('carregar') ? 
                    error.message : 
                    'Erro interno do sistema. Tente novamente.'
            };
        }
    }

    // Handle logout process
    handleLogout() {
        try {
            console.log('Starting logout process...');
            
            // Clear current user
            this.currentUser = null;
            
            // Remove session from localStorage
            localStorage.removeItem(this.sessionKey);
            
            // Also clear any other related data
            localStorage.removeItem('opus_vitalis_reports');
            localStorage.removeItem('opus_vitalis_notifications');
            
            console.log('Session data cleared successfully');
            
            // Redirect to login page
            window.location.href = 'login.html';
            
        } catch (error) {
            console.error('Error during logout:', error);
            
            // Force clear and redirect even if there's an error
            try {
                this.currentUser = null;
                localStorage.clear(); // Clear all localStorage as last resort
            } catch (clearError) {
                console.error('Error clearing localStorage:', clearError);
            }
            
            // Force redirect
            window.location.href = 'login.html';
        }
    }

    // Check if user has active session
    checkSession() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            if (!sessionData) {
                this.currentUser = null;
                return false;
            }

            const userData = JSON.parse(sessionData);
            
            // Validate session data structure
            if (!userData || !userData.id || !userData.username) {
                console.warn('Invalid session data found, clearing session');
                this.currentUser = null;
                try {
                    localStorage.removeItem(this.sessionKey);
                } catch (removeError) {
                    console.error('Error removing invalid session:', removeError);
                }
                return false;
            }

            // Validate required fields
            if (!userData.name && !userData.username) {
                console.warn('Session missing required user data');
                this.currentUser = null;
                try {
                    localStorage.removeItem(this.sessionKey);
                } catch (removeError) {
                    console.error('Error removing incomplete session:', removeError);
                }
                return false;
            }

            this.currentUser = userData;
            return true;
        } catch (error) {
            console.error('Error checking session:', error);
            this.currentUser = null;
            
            // Clear corrupted session data
            try {
                localStorage.removeItem(this.sessionKey);
            } catch (clearError) {
                console.error('Error clearing corrupted session:', clearError);
            }
            return false;
        }
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