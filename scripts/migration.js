// Migration Script - Opus Vitalis Rebranding
// Migrates localStorage keys from old "ordem_paranormal" to new "opus_vitalis"

class OpusVitalisMigration {
    constructor() {
        this.oldKeys = {
            session: 'ordem_paranormal_session',
            reports: 'ordem_paranormal_reports',
            notifications: 'ordem_paranormal_notifications',
            comments: 'ordem_paranormal_report_comments'
        };
        
        this.newKeys = {
            session: 'opus_vitalis_session',
            reports: 'opus_vitalis_reports',
            notifications: 'opus_vitalis_notifications',
            comments: 'opus_vitalis_report_comments'
        };
    }

    // Check if migration is needed
    needsMigration() {
        return Object.values(this.oldKeys).some(key => 
            localStorage.getItem(key) !== null
        );
    }

    // Perform the migration
    migrate() {
        try {
            let migratedCount = 0;
            
            console.log('🔄 Iniciando migração para Opus Vitalis...');
            
            // Migrate each key
            Object.keys(this.oldKeys).forEach(keyType => {
                const oldKey = this.oldKeys[keyType];
                const newKey = this.newKeys[keyType];
                
                const data = localStorage.getItem(oldKey);
                if (data) {
                    // Copy to new key
                    localStorage.setItem(newKey, data);
                    
                    // Remove old key
                    localStorage.removeItem(oldKey);
                    
                    migratedCount++;
                    console.log(`✅ Migrado: ${oldKey} → ${newKey}`);
                }
            });
            
            if (migratedCount > 0) {
                console.log(`🎉 Migração concluída! ${migratedCount} chaves migradas.`);
                
                // Show user notification if Utils is available
                if (typeof Utils !== 'undefined') {
                    Utils.showMessage(
                        `Bem-vindo ao Opus Vitalis! Seus dados foram migrados com sucesso.`, 
                        'success'
                    );
                }
            } else {
                console.log('ℹ️ Nenhuma migração necessária.');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Erro durante a migração:', error);
            return false;
        }
    }

    // Auto-migrate on page load
    autoMigrate() {
        if (this.needsMigration()) {
            return this.migrate();
        }
        return true;
    }

    // Clean up any remaining old keys (for cleanup)
    cleanup() {
        try {
            Object.values(this.oldKeys).forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    console.log(`🧹 Removido: ${key}`);
                }
            });
            console.log('✨ Limpeza concluída.');
        } catch (error) {
            console.error('❌ Erro durante limpeza:', error);
        }
    }
}

// Global migration instance
window.opusVitalisMigration = new OpusVitalisMigration();

// Auto-migrate when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure other scripts are loaded
    setTimeout(() => {
        window.opusVitalisMigration.autoMigrate();
    }, 100);
});

// Export for manual use
window.OpusVitalisMigration = OpusVitalisMigration;