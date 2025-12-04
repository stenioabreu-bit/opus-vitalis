// Icon Helper Functions
// Provides easy access to SVG icons throughout the application

class IconManager {
    constructor() {
        this.iconsLoaded = false;
        this.loadIcons();
    }

    // Load SVG icons into the page
    async loadIcons() {
        try {
            const response = await fetch('assets/icons/icons.svg');
            const svgText = await response.text();
            
            // Create a div to hold the SVG symbols
            const div = document.createElement('div');
            div.innerHTML = svgText;
            div.style.display = 'none';
            
            // Add to the beginning of body
            document.body.insertBefore(div, document.body.firstChild);
            
            this.iconsLoaded = true;
            console.log('Icons loaded successfully');
        } catch (error) {
            console.error('Error loading icons:', error);
        }
    }

    // Create an SVG icon element
    createIcon(iconName, className = 'icon', size = null) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        
        svg.setAttribute('class', className);
        if (size) {
            svg.setAttribute('width', size);
            svg.setAttribute('height', size);
        }
        
        use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#icon-${iconName}`);
        svg.appendChild(use);
        
        return svg;
    }

    // Get icon HTML string
    getIconHTML(iconName, className = 'icon', size = null) {
        const sizeAttr = size ? `width="${size}" height="${size}"` : '';
        return `<svg class="${className}" ${sizeAttr}><use href="#icon-${iconName}"></use></svg>`;
    }

    // Replace emoji with SVG icons in text
    replaceEmojisWithIcons(text) {
        const emojiMap = {
            // Status icons
            '✅': this.getIconHTML('check-circle', 'icon icon-success'),
            '✓': this.getIconHTML('check', 'icon icon-success'),
            '❌': this.getIconHTML('x-circle', 'icon icon-error'),
            '✗': this.getIconHTML('x', 'icon icon-error'),
            '⚠️': this.getIconHTML('alert-triangle', 'icon icon-warning'),
            '⚠': this.getIconHTML('alert-triangle', 'icon icon-warning'),
            'ℹ️': this.getIconHTML('info', 'icon icon-info'),
            
            // Action icons
            '🔄': this.getIconHTML('refresh-cw', 'icon icon-spin'),
            '⏳': this.getIconHTML('clock', 'icon icon-warning'),
            '🔍': this.getIconHTML('search', 'icon'),
            '📤': this.getIconHTML('upload', 'icon'),
            '📥': this.getIconHTML('download', 'icon'),
            '🔗': this.getIconHTML('share-2', 'icon'),
            '📋': this.getIconHTML('clipboard', 'icon'),
            '📝': this.getIconHTML('edit-3', 'icon'),
            '👁️': this.getIconHTML('eye', 'icon'),
            '✏️': this.getIconHTML('edit-2', 'icon'),
            '🗑️': this.getIconHTML('trash-2', 'icon icon-error'),
            
            // User/People icons
            '👤': this.getIconHTML('user', 'icon'),
            '👥': this.getIconHTML('users', 'icon'),
            '🔑': this.getIconHTML('key', 'icon'),
            '🚪': this.getIconHTML('log-out', 'icon'),
            
            // Navigation icons
            '📊': this.getIconHTML('bar-chart-2', 'icon'),
            '🏠': this.getIconHTML('home', 'icon'),
            '⚙️': this.getIconHTML('settings', 'icon'),
            '📁': this.getIconHTML('folder', 'icon'),
            '📄': this.getIconHTML('file-text', 'icon'),
            
            // Status/Theme icons
            '🛡️': this.getIconHTML('shield', 'icon icon-crimson'),
            '💀': this.getIconHTML('skull', 'icon icon-crimson'),
            '🎯': this.getIconHTML('target', 'icon icon-crimson'),
            '⚡': this.getIconHTML('zap', 'icon icon-warning'),
            '🔥': this.getIconHTML('flame', 'icon icon-error'),
            
            // Celebration/Success
            '🎉': this.getIconHTML('check-circle', 'icon icon-success icon-pulse'),
            '✨': this.getIconHTML('star', 'icon icon-warning icon-pulse'),
            '🚀': this.getIconHTML('trending-up', 'icon icon-success'),
            
            // Dates/Time
            '📅': this.getIconHTML('calendar', 'icon'),
            '🕐': this.getIconHTML('clock', 'icon'),
            
            // Communication
            '🔔': this.getIconHTML('bell', 'icon icon-warning'),
            '💬': this.getIconHTML('message-circle', 'icon'),
            '📧': this.getIconHTML('mail', 'icon'),
            
            // Technical
            '☁️': this.getIconHTML('cloud', 'icon'),
            '🌐': this.getIconHTML('globe', 'icon'),
            '🔧': this.getIconHTML('tool', 'icon'),
            '🧪': this.getIconHTML('flask', 'icon'),
            
            // Arrows/Navigation
            '←': this.getIconHTML('arrow-left', 'icon'),
            '→': this.getIconHTML('arrow-right', 'icon'),
            '↑': this.getIconHTML('arrow-up', 'icon'),
            '↓': this.getIconHTML('arrow-down', 'icon')
        };

        let result = text;
        for (const [emoji, icon] of Object.entries(emojiMap)) {
            result = result.replace(new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), icon);
        }
        
        return result;
    }

    // Add icon to button
    addIconToButton(button, iconName, position = 'before') {
        const icon = this.createIcon(iconName);
        
        if (position === 'before') {
            button.insertBefore(icon, button.firstChild);
        } else {
            button.appendChild(icon);
        }
    }

    // Update loading state with icon
    showLoadingIcon(elementId, text = 'Carregando...') {
        const element = document.getElementById(elementId);
        if (!element) return false;

        const loadingIcon = this.getIconHTML('loading', 'icon icon-spin');
        element.innerHTML = `${loadingIcon} ${text}`;
        element.disabled = true;
        
        return true;
    }

    // Show success message with icon
    showSuccessMessage(message, containerId = 'message-container') {
        const iconHTML = this.getIconHTML('success', 'icon icon-success');
        const messageHTML = `
            <div class="message message-success">
                ${iconHTML}
                <span>${message}</span>
            </div>
        `;
        
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = messageHTML;
        }
    }

    // Show error message with icon
    showErrorMessage(message, containerId = 'message-container') {
        const iconHTML = this.getIconHTML('error', 'icon icon-error');
        const messageHTML = `
            <div class="message message-error">
                ${iconHTML}
                <span>${message}</span>
            </div>
        `;
        
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = messageHTML;
        }
    }

    // Show warning message with icon
    showWarningMessage(message, containerId = 'message-container') {
        const iconHTML = this.getIconHTML('warning', 'icon icon-warning');
        const messageHTML = `
            <div class="message message-warning">
                ${iconHTML}
                <span>${message}</span>
            </div>
        `;
        
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = messageHTML;
        }
    }

    // Show info message with icon
    showInfoMessage(message, containerId = 'message-container') {
        const iconHTML = this.getIconHTML('info', 'icon icon-crimson');
        const messageHTML = `
            <div class="message message-info">
                ${iconHTML}
                <span>${message}</span>
            </div>
        `;
        
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = messageHTML;
        }
    }
}

// Global icon manager instance
window.iconManager = new IconManager();

// Auto-load icons when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Replace any existing emojis in the page
    setTimeout(() => {
        if (window.iconManager.iconsLoaded) {
            const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, button');
            textElements.forEach(element => {
                if (element.children.length === 0) { // Only text nodes
                    const newHTML = window.iconManager.replaceEmojisWithIcons(element.innerHTML);
                    if (newHTML !== element.innerHTML) {
                        element.innerHTML = newHTML;
                    }
                }
            });
        }
    }, 500);
});

// Export for use in other modules
window.IconManager = IconManager;