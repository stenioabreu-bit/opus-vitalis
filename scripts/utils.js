// Utility Functions
// Common helper functions used across the application

class Utils {
    // Generate unique ID
    static generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Format date for display
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Format datetime for display
    static formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Show message to user
    static showMessage(message, type = 'info', containerId = 'message-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;

        container.innerHTML = '';
        container.appendChild(messageDiv);

        // Auto-hide after 5 seconds for success/info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 5000);
        }
    }

    // Show loading state
    static showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<span class="loading"></span> Carregando...';
            element.disabled = true;
        }
    }

    // Hide loading state
    static hideLoading(elementId, originalText) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = originalText;
            element.disabled = false;
        }
    }

    // Validate email format
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Sanitize HTML to prevent XSS
    static sanitizeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Get current timestamp
    static getCurrentTimestamp() {
        return new Date().toISOString();
    }

    // Debounce function for search inputs
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Export for use in other modules
window.Utils = Utils;