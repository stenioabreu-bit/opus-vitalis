// Synchronization Service
// Handles syncing data between localStorage and JSON files (simulating cloud storage)

class SyncService {
    constructor() {
        this.syncEndpoint = 'sync-reports.php'; // Simulated endpoint
        this.isOnline = navigator.onLine;
        this.pendingSyncs = [];
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processPendingSyncs();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    // Sync a report to "cloud" (JSON file)
    async syncReport(report) {
        try {
            // For now, we'll simulate cloud sync by updating the local JSON structure
            // In a real app, this would be an API call
            
            console.log('🔄 Sincronizando relatório:', report.title);
            
            // Add to pending syncs if offline
            if (!this.isOnline) {
                this.addToPendingSync('report', report);
                console.log('📱 Offline - Adicionado à fila de sincronização');
                return { success: true, synced: false, message: 'Salvo localmente - será sincronizado quando online' };
            }
            
            // Simulate API call delay
            await this.delay(500);
            
            // In a real implementation, this would be:
            // const response = await fetch('/api/reports', { method: 'POST', body: JSON.stringify(report) });
            
            // For now, we'll save to a simulated cloud storage in localStorage
            const cloudReports = this.getCloudReports();
            cloudReports[report.id] = report;
            this.saveCloudReports(cloudReports);
            
            console.log('✅ Relatório sincronizado com sucesso');
            return { success: true, synced: true, message: 'Relatório salvo na nuvem' };
            
        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            
            // Add to pending syncs on error
            this.addToPendingSync('report', report);
            
            return { success: false, synced: false, message: 'Erro na sincronização - tentará novamente' };
        }
    }

    // Compartilhamento removido

    // Get all reports from "cloud" (simulated)
    async getCloudReports() {
        try {
            // Simulate loading from cloud
            const stored = localStorage.getItem('opus_vitalis_cloud_reports');
            if (stored) {
                return JSON.parse(stored);
            }
            
            // If no cloud data, try to load from JSON file and initialize cloud
            try {
                const response = await fetch('data/reports.json');
                if (response.ok) {
                    const data = await response.json();
                    // Initialize cloud storage with JSON data
                    this.saveCloudReports(data);
                    return data;
                }
            } catch (e) {
                console.warn('Could not load initial reports from JSON');
            }
            
            return {};
        } catch (error) {
            console.error('Error loading cloud reports:', error);
            return {};
        }
    }

    // Save reports to "cloud" (simulated)
    saveCloudReports(reports) {
        try {
            localStorage.setItem('opus_vitalis_cloud_reports', JSON.stringify(reports));
            console.log('💾 Relatórios salvos na nuvem simulada');
            return true;
        } catch (error) {
            console.error('Error saving to cloud:', error);
            return false;
        }
    }

    // Merge local and cloud reports
    async mergeReports() {
        try {
            console.log('🔄 Mesclando relatórios locais e da nuvem...');
            
            // Get local reports
            const localReports = JSON.parse(localStorage.getItem('opus_vitalis_reports') || '{}');
            
            // Get cloud reports
            const cloudReports = await this.getCloudReports();
            
            // Merge (cloud takes precedence for conflicts, but keep local-only reports)
            const merged = { ...localReports };
            
            Object.keys(cloudReports).forEach(reportId => {
                const cloudReport = cloudReports[reportId];
                const localReport = merged[reportId];
                
                if (!localReport) {
                    // New report from cloud
                    merged[reportId] = cloudReport;
                } else {
                    // Conflict resolution: use the most recent
                    const cloudDate = new Date(cloudReport.updatedAt);
                    const localDate = new Date(localReport.updatedAt);
                    
                    if (cloudDate > localDate) {
                        merged[reportId] = cloudReport;
                        console.log(`📥 Atualizado do cloud: ${cloudReport.title}`);
                    }
                }
            });
            
            // Save merged data back to local
            localStorage.setItem('opus_vitalis_reports', JSON.stringify(merged));
            
            // Update cloud with any local-only reports
            const localOnlyReports = {};
            Object.keys(merged).forEach(reportId => {
                if (!cloudReports[reportId]) {
                    localOnlyReports[reportId] = merged[reportId];
                }
            });
            
            if (Object.keys(localOnlyReports).length > 0) {
                const updatedCloud = { ...cloudReports, ...localOnlyReports };
                this.saveCloudReports(updatedCloud);
                console.log(`📤 Enviados para cloud: ${Object.keys(localOnlyReports).length} relatórios`);
            }
            
            console.log('✅ Mesclagem concluída');
            return { success: true, merged: Object.keys(merged).length };
            
        } catch (error) {
            console.error('❌ Erro na mesclagem:', error);
            return { success: false, error: error.message };
        }
    }

    // Add action to pending sync queue
    addToPendingSync(type, data) {
        this.pendingSyncs.push({
            type,
            data,
            timestamp: Date.now()
        });
        
        // Save pending syncs to localStorage
        localStorage.setItem('opus_vitalis_pending_syncs', JSON.stringify(this.pendingSyncs));
    }

    // Process pending syncs when back online
    async processPendingSyncs() {
        if (!this.isOnline || this.pendingSyncs.length === 0) {
            return;
        }
        
        console.log(`🔄 Processando ${this.pendingSyncs.length} sincronizações pendentes...`);
        
        const syncsToProcess = [...this.pendingSyncs];
        this.pendingSyncs = [];
        
        for (const sync of syncsToProcess) {
            try {
                if (sync.type === 'report') {
                    await this.syncReport(sync.data);
                } else if (sync.type === 'sharing') {
                    // Compartilhamento removido
                }
            } catch (error) {
                console.error('Error processing pending sync:', error);
                // Re-add failed sync
                this.pendingSyncs.push(sync);
            }
        }
        
        // Update pending syncs in localStorage
        localStorage.setItem('opus_vitalis_pending_syncs', JSON.stringify(this.pendingSyncs));
        
        console.log('✅ Sincronizações pendentes processadas');
    }

    // Load pending syncs from localStorage
    loadPendingSyncs() {
        try {
            const stored = localStorage.getItem('opus_vitalis_pending_syncs');
            if (stored) {
                this.pendingSyncs = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading pending syncs:', error);
            this.pendingSyncs = [];
        }
    }

    // Initialize sync service
    async init() {
        console.log('🚀 Inicializando serviço de sincronização...');
        
        // Load pending syncs
        this.loadPendingSyncs();
        
        // Merge reports on startup
        await this.mergeReports();
        
        // Process any pending syncs
        if (this.isOnline) {
            await this.processPendingSyncs();
        }
        
        console.log('✅ Serviço de sincronização inicializado');
    }

    // Utility: delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get sync status
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            pendingSyncs: this.pendingSyncs.length,
            lastSync: localStorage.getItem('opus_vitalis_last_sync')
        };
    }

    // Force full sync
    async forceSync() {
        console.log('🔄 Forçando sincronização completa...');
        
        try {
            // Merge all data
            await this.mergeReports();
            
            // Process pending syncs
            await this.processPendingSyncs();
            
            // Update last sync timestamp
            localStorage.setItem('opus_vitalis_last_sync', new Date().toISOString());
            
            console.log('✅ Sincronização completa finalizada');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erro na sincronização forçada:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export for use in other modules
window.SyncService = SyncService;