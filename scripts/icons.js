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
            '✅': this.getIconHTML('success', 'icon icon-success'),
            '✓': this.getIconHTML('success', 'icon icon-success'),
            '❌': this.getIconHTML('error', 'icon icon-error'),
            '✗': this.getIconHTML('error', 'icon icon-error'),
            '⚠️': this.getIconHTML('warning', 'icon icon-warning'),
            '⚠': this.getIconHTML('warning', 'icon icon-warning'),
            'ℹ️': this.getIconHTML('info', 'icon icon-crimson'),
            '🔄': this.getIconHTML('loading', 'icon icon-spin'),
            '👤': this.getIconHTML('user', 'icon'),
            '📊': this.getIconHTML('dashboard', 'icon'),
            '📝': this.getIconHTML('report', 'icon'),
            '👥': this.getIconHTML('team', 'icon'),
            '🔗': this.getIconHTML('share', 'icon'),
            '👁️': this.getIconHTML('view', 'icon'),
            '🛡️': this.getIconHTML('shield', 'icon'),
            '💀': this.getIconHTML('skull', 'icon icon-crimson'),
            '🎉': this.getIconHTML('success', 'icon icon-success icon-pulse'),
            '🚪': this.getIconHTML('logout', 'icon')
        };

        let result = text;
        for (const [emoji, icon] of Object.entries(emojiMap)) {
            result = result.replace(new RegExp(emoji, 'g'), icon);
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