// Session Guard - Protects pages that require authentication
// Include this script in any page that requires login

class SessionGuard {
    constructor() {
        this.authService = null;
        this.redirectUrl = 'login.html';
        this.checkInterval = null;
    }

    // Initialize session guard
    async init() {
        try {
            // Wait for AuthService to be available
            if (typeof AuthService === 'undefined') {
                console.error('AuthService not loaded. Make sure auth.js is included before session-guard.js');
                this.forceRedirect();
                return false;
            }

            this.authService = new AuthService();
            
            // Check session immediately
            if (!this.checkSession()) {
                this.redirectToLogin();
                return false;
            }

            // Start periodic session checking
            this.startPeriodicCheck();
            
            console.log('Session guard initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing session guard:', error);
            this.forceRedirect();
            return false;
        }
    }

    // Check if user has valid session
    checkSession() {
        try {
            if (!this.authService) {
                return false;
            }

            const hasSession = this.authService.checkSession();
            const currentUser = this.authService.getCurrentUser();

            if (!hasSession || !currentUser) {
                console.log('No valid session found');
                return false;
            }

            // Validate user data structure
            if (!currentUser.id || !currentUser.username) {
                console.log('Invalid user data in session');
                this.clearSession();
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking session:', error);
            return false;
        }
    }

    // Clear corrupted session
    clearSession() {
        try {
            if (this.authService) {
                this.authService.currentUser = null;
            }
            localStorage.removeItem('opus_vitalis_session');
        } catch (error) {
            console.error('Error clearing session:', error);
        }
    }

    // Redirect to login page
    redirectToLogin() {
        console.log('Redirecting to login page');
        try {
            // Show message if Utils is available
            if (typeof Utils !== 'undefined') {
                Utils.showMessage('Sessão expirada. Redirecionando para login...', 'error');
            }
            
            // Small delay to show message
            setTimeout(() => {
                window.location.href = this.redirectUrl;
            }, 1000);
        } catch (error) {
            console.error('Error during redirect:', error);
            this.forceRedirect();
        }
    }

    // Force redirect without any dependencies
    forceRedirect() {
        window.location.href = this.redirectUrl;
    }

    // Start periodic session checking
    startPeriodicCheck() {
        // Check session every 2 minutes
        this.checkInterval = setInterval(() => {
            if (!this.checkSession()) {
                this.stopPeriodicCheck();
                this.redirectToLogin();
            }
        }, 2 * 60 * 1000);
    }

    // Stop periodic session checking
    stopPeriodicCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    // Get current user safely
    getCurrentUser() {
        try {
            if (!this.authService) {
                return null;
            }
            return this.authService.getCurrentUser();
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    // Check if user has specific role
    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    }

    // Check if user is team leader
    isTeamLeader() {
        return this.hasRole('leader');
    }

    // Cleanup when page unloads
    cleanup() {
        this.stopPeriodicCheck();
    }
}

// Global session guard instance
window.sessionGuard = new SessionGuard();

// Auto-initialize disabled to prevent conflicts
// Pages should initialize session guard manually if needed

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.sessionGuard) {
        window.sessionGuard.cleanup();
    }
});

// Export for use in other modules
window.SessionGuard = SessionGuard;