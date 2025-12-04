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

    // Show message to user with enhanced error handling
    static showMessage(message, type = 'info', containerId = 'message-container', options = {}) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                console.warn(`Message container '${containerId}' not found`);
                // Try to create a fallback container
                const fallbackContainer = this.createFallbackMessageContainer();
                if (!fallbackContainer) return;
                return this.showMessage(message, type, fallbackContainer.id, options);
            }

            // Validate message
            if (!message || typeof message !== 'string') {
                console.warn('Invalid message provided to showMessage');
                return;
            }

            const messageDiv = document.createElement('div');
            messageDiv.className = `message message-${type}`;
            
            // Add accessibility attributes
            messageDiv.setAttribute('role', type === 'error' ? 'alert' : 'status');
            messageDiv.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
            
            // Add icon based on message type
            let iconHTML = '';
            if (window.iconManager) {
                switch (type) {
                    case 'success':
                        iconHTML = window.iconManager.getIconHTML('success', 'icon icon-success');
                        break;
                    case 'error':
                        iconHTML = window.iconManager.getIconHTML('error', 'icon icon-error');
                        break;
                    case 'warning':
                        iconHTML = window.iconManager.getIconHTML('warning', 'icon icon-warning');
                        break;
                    case 'info':
                        iconHTML = window.iconManager.getIconHTML('info', 'icon icon-crimson');
                        break;
                }
            }
            
            // Set message content with icon
            messageDiv.innerHTML = `${iconHTML}<span>${this.sanitizeHtml(message)}</span>`;

            // Add close button for persistent messages
            if (options.persistent || type === 'error') {
                const closeButton = document.createElement('button');
                closeButton.innerHTML = '×';
                closeButton.className = 'message-close';
                closeButton.setAttribute('aria-label', 'Fechar mensagem');
                closeButton.onclick = () => {
                    if (messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                };
                messageDiv.appendChild(closeButton);
            }

            // Clear previous messages unless stacking is enabled
            if (!options.stack) {
                container.innerHTML = '';
            }
            
            container.appendChild(messageDiv);

            // Auto-hide after specified time or default
            const autoHideTime = options.autoHide !== false ? (options.duration || 5000) : null;
            if (autoHideTime && (type === 'success' || type === 'info')) {
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.style.opacity = '0';
                        setTimeout(() => {
                            if (messageDiv.parentNode) {
                                messageDiv.parentNode.removeChild(messageDiv);
                            }
                        }, 300);
                    }
                }, autoHideTime);
            }

            return messageDiv;
        } catch (error) {
            console.error('Error showing message:', error);
            // Fallback to alert if all else fails
            if (typeof alert !== 'undefined') {
                alert(`${type.toUpperCase()}: ${message}`);
            }
        }
    }

    // Show loading state with enhanced error handling
    static showLoading(elementId, loadingText = 'Carregando...') {
        try {
            const element = document.getElementById(elementId);
            if (!element) {
                console.warn(`Element '${elementId}' not found for loading state`);
                return false;
            }

            // Store original content and state
            if (!element.dataset.originalContent) {
                element.dataset.originalContent = element.innerHTML;
                element.dataset.originalDisabled = element.disabled;
            }

            // Use SVG loading icon if available
            let loadingIcon = '<span class="loading"></span>';
            if (window.iconManager) {
                loadingIcon = window.iconManager.getIconHTML('loading', 'icon icon-spin');
            }

            element.innerHTML = `${loadingIcon} ${loadingText}`;
            element.disabled = true;
            element.classList.add('loading-state');
            
            return true;
        } catch (error) {
            console.error('Error showing loading state:', error);
            return false;
        }
    }

    // Hide loading state with enhanced error handling
    static hideLoading(elementId, customText = null) {
        try {
            const element = document.getElementById(elementId);
            if (!element) {
                console.warn(`Element '${elementId}' not found for hiding loading state`);
                return false;
            }

            // Restore original content or use custom text
            const originalContent = element.dataset.originalContent;
            const originalDisabled = element.dataset.originalDisabled === 'true';
            
            element.innerHTML = customText || originalContent || 'Concluído';
            element.disabled = originalDisabled;
            element.classList.remove('loading-state');
            
            // Clean up stored data
            delete element.dataset.originalContent;
            delete element.dataset.originalDisabled;
            
            return true;
        } catch (error) {
            console.error('Error hiding loading state:', error);
            return false;
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

    // Create fallback message container if none exists
    static createFallbackMessageContainer() {
        try {
            // Check if fallback already exists
            let fallback = document.getElementById('fallback-message-container');
            if (fallback) return fallback;

            // Create fallback container
            fallback = document.createElement('div');
            fallback.id = 'fallback-message-container';
            fallback.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;

            document.body.appendChild(fallback);
            return fallback;
        } catch (error) {
            console.error('Error creating fallback message container:', error);
            return null;
        }
    }

    // Show error with retry option
    static showErrorWithRetry(message, retryCallback, containerId = 'message-container') {
        try {
            const container = document.getElementById(containerId);
            if (!container) return;

            const errorDiv = document.createElement('div');
            errorDiv.className = 'message message-error';
            errorDiv.innerHTML = `
                <div>${this.sanitizeHtml(message)}</div>
                <button class="btn btn-secondary mt-1" onclick="this.parentNode.parentNode.removeChild(this.parentNode); (${retryCallback.toString()})()">
                    Tentar Novamente
                </button>
            `;

            container.innerHTML = '';
            container.appendChild(errorDiv);
        } catch (error) {
            console.error('Error showing error with retry:', error);
            this.showMessage(message, 'error', containerId);
        }
    }

    // Handle network errors specifically
    static handleNetworkError(error, context = 'operação') {
        let message = `Erro de conexão durante ${context}. `;
        
        if (error instanceof TypeError && error.message.includes('fetch')) {
            message += 'Verifique sua conexão com a internet.';
        } else if (error.message.includes('404')) {
            message += 'Recurso não encontrado.';
        } else if (error.message.includes('500')) {
            message += 'Erro interno do servidor.';
        } else {
            message += 'Tente novamente em alguns instantes.';
        }

        return message;
    }

    // Validate required form fields
    static validateRequiredFields(formData, requiredFields) {
        const errors = [];
        
        requiredFields.forEach(field => {
            if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
                errors.push(`O campo ${field} é obrigatório`);
            }
        });

        return errors;
    }

    // Safe JSON parse with error handling
    static safeJsonParse(jsonString, fallback = null) {
        try {
            if (!jsonString || typeof jsonString !== 'string') {
                return fallback;
            }
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return fallback;
        }
    }

    // Safe localStorage operations
    static safeLocalStorageGet(key, fallback = null) {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : fallback;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return fallback;
        }
    }

    static safeLocalStorageSet(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    }

    // Show loading overlay for full page operations
    static showLoadingOverlay(message = 'Carregando...') {
        try {
            // Remove existing overlay
            this.hideLoadingOverlay();

            const overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-content">
                    <div class="loading loading-large"></div>
                    <div>${this.sanitizeHtml(message)}</div>
                </div>
            `;

            document.body.appendChild(overlay);
            return overlay;
        } catch (error) {
            console.error('Error showing loading overlay:', error);
            return null;
        }
    }

    // Hide loading overlay
    static hideLoadingOverlay() {
        try {
            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, 300);
            }
        } catch (error) {
            console.error('Error hiding loading overlay:', error);
        }
    }

    // Show notification (toast-style message)
    static showNotification(message, type = 'info', duration = 4000) {
        try {
            // Create or get notification container
            let container = document.getElementById('notification-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'notification-container';
                container.className = 'notification-container';
                document.body.appendChild(container);
            }

            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span>${this.sanitizeHtml(message)}</span>
                    <button class="message-close" onclick="this.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode)" aria-label="Fechar">×</button>
                </div>
            `;

            container.appendChild(notification);

            // Auto-remove after duration
            if (duration > 0) {
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.style.opacity = '0';
                        setTimeout(() => {
                            if (notification.parentNode) {
                                notification.parentNode.removeChild(notification);
                            }
                        }, 300);
                    }
                }, duration);
            }

            return notification;
        } catch (error) {
            console.error('Error showing notification:', error);
            return null;
        }
    }

    // Add form validation visual feedback
    static setFieldValidation(fieldId, isValid, message = '') {
        try {
            const field = document.getElementById(fieldId);
            if (!field) return false;

            const formGroup = field.closest('.form-group');
            if (!formGroup) return false;

            // Remove existing validation classes and messages
            formGroup.classList.remove('has-error', 'has-success');
            const existingMessage = formGroup.querySelector('.field-error, .field-success');
            if (existingMessage) {
                existingMessage.remove();
            }

            if (isValid) {
                formGroup.classList.add('has-success');
                if (message) {
                    const successMsg = document.createElement('span');
                    successMsg.className = 'field-success';
                    successMsg.textContent = message;
                    formGroup.appendChild(successMsg);
                }
            } else {
                formGroup.classList.add('has-error');
                if (message) {
                    const errorMsg = document.createElement('span');
                    errorMsg.className = 'field-error';
                    errorMsg.textContent = message;
                    formGroup.appendChild(errorMsg);
                }
            }

            return true;
        } catch (error) {
            console.error('Error setting field validation:', error);
            return false;
        }
    }

    // Clear all form validation states
    static clearFormValidation(formId) {
        try {
            const form = document.getElementById(formId);
            if (!form) return false;

            const formGroups = form.querySelectorAll('.form-group');
            formGroups.forEach(group => {
                group.classList.remove('has-error', 'has-success');
                const messages = group.querySelectorAll('.field-error, .field-success');
                messages.forEach(msg => msg.remove());
            });

            return true;
        } catch (error) {
            console.error('Error clearing form validation:', error);
            return false;
        }
    }

    // Show progress indicator
    static showProgress(containerId, progress = 0, message = '') {
        try {
            const container = document.getElementById(containerId);
            if (!container) return false;

            let progressContainer = container.querySelector('.progress-container');
            if (!progressContainer) {
                progressContainer = document.createElement('div');
                progressContainer.className = 'progress-container';
                progressContainer.innerHTML = `
                    <div class="progress-message"></div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                `;
                container.appendChild(progressContainer);
            }

            const messageEl = progressContainer.querySelector('.progress-message');
            const fillEl = progressContainer.querySelector('.progress-fill');

            if (messageEl) messageEl.textContent = message;
            if (fillEl) fillEl.style.width = `${Math.max(0, Math.min(100, progress))}%`;

            return true;
        } catch (error) {
            console.error('Error showing progress:', error);
            return false;
        }
    }

    // Hide progress indicator
    static hideProgress(containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container) return false;

            const progressContainer = container.querySelector('.progress-container');
            if (progressContainer) {
                progressContainer.remove();
            }

            return true;
        } catch (error) {
            console.error('Error hiding progress:', error);
            return false;
        }
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