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

    // Check if there's old data to migrate
    hasOldData() {
        return this.needsMigration();
    }

    // Migrate data with detailed results
    migrateData() {
        try {
            let sessionsMigrated = 0;
            let reportsMigrated = 0;
            
            console.log('🔄 Iniciando migração detalhada...');
            
            // Migrate session
            const sessionData = localStorage.getItem(this.oldKeys.session);
            if (sessionData) {
                localStorage.setItem(this.newKeys.session, sessionData);
                localStorage.removeItem(this.oldKeys.session);
                sessionsMigrated = 1;
                console.log(`✅ Sessão migrada`);
            }
            
            // Migrate reports
            const reportsData = localStorage.getItem(this.oldKeys.reports);
            if (reportsData) {
                localStorage.setItem(this.newKeys.reports, reportsData);
                localStorage.removeItem(this.oldKeys.reports);
                try {
                    const parsed = JSON.parse(reportsData);
                    reportsMigrated = Object.keys(parsed).length;
                } catch (e) {
                    reportsMigrated = 1;
                }
                console.log(`✅ Relatórios migrados: ${reportsMigrated}`);
            }
            
            // Migrate notifications
            const notificationsData = localStorage.getItem(this.oldKeys.notifications);
            if (notificationsData) {
                localStorage.setItem(this.newKeys.notifications, notificationsData);
                localStorage.removeItem(this.oldKeys.notifications);
                console.log(`✅ Notificações migradas`);
            }
            
            // Migrate comments
            const commentsData = localStorage.getItem(this.oldKeys.comments);
            if (commentsData) {
                localStorage.setItem(this.newKeys.comments, commentsData);
                localStorage.removeItem(this.oldKeys.comments);
                console.log(`✅ Comentários migrados`);
            }
            
            return {
                success: true,
                sessionsMigrated,
                reportsMigrated,
                message: 'Migração concluída com sucesso'
            };
            
        } catch (error) {
            console.error('❌ Erro durante migração detalhada:', error);
            return {
                success: false,
                sessionsMigrated: 0,
                reportsMigrated: 0,
                message: error.message
            };
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
window.MigrationService = OpusVitalisMigration;