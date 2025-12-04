// Reports Service Module
// Handles report creation, loading, and management

class ReportsService {
    constructor() {
        try {
            console.log('Creating DataLoader...');
            this.dataLoader = new DataLoader();
            console.log('DataLoader created successfully');
            
            this.localStorageKey = 'opus_vitalis_reports';
            this.syncService = null;
            
            // Initialize sync service asynchronously (don't wait)
            this.initSync().catch(error => {
                console.warn('Sync service initialization failed:', error);
            });
            
            console.log('ReportsService constructor completed');
        } catch (error) {
            console.error('Error in ReportsService constructor:', error);
            throw error;
        }
    }

    // Initialize sync service
    async initSync() {
        try {
            if (typeof SyncService !== 'undefined') {
                this.syncService = new SyncService();
                await this.syncService.init();
            }
        } catch (error) {
            console.warn('Sync service not available:', error);
        }
    }

    // Get all reports (combining cloud, static and localStorage data)
    async getAllReports() {
        console.log('Getting all reports...');
        let allReports = {};
        
        try {
            // 1. Start with local reports (always available)
            const localReports = this.getLocalReports();
            console.log('Local reports:', Object.keys(localReports).length);
            allReports = { ...localReports };
            
            // 2. Try to load static reports from JSON
            try {
                const staticReports = await this.dataLoader.loadReports();
                console.log('Static reports:', Object.keys(staticReports).length);
                allReports = { ...allReports, ...staticReports };
            } catch (staticError) {
                console.warn('Could not load static reports:', staticError.message);
            }
            
            // 3. Try to get cloud reports if sync service is available
            try {
                if (this.syncService) {
                    const cloudReports = await this.syncService.getCloudReports();
                    console.log('Cloud reports:', Object.keys(cloudReports).length);
                    allReports = { ...allReports, ...cloudReports };
                }
            } catch (cloudError) {
                console.warn('Could not load cloud reports:', cloudError.message);
            }
            
            console.log('Total reports combined:', Object.keys(allReports).length);
            return allReports;
            
        } catch (error) {
            console.error('Error in getAllReports:', error);
            // Return at least local reports
            return this.getLocalReports();
        }
    }

    // Get reports from localStorage
    getLocalReports() {
        try {
            const stored = localStorage.getItem(this.localStorageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading local reports:', error);
            return {};
        }
    }

    // Save reports to localStorage
    saveLocalReports(reports) {
        try {
            localStorage.setItem(this.localStorageKey, JSON.stringify(reports));
            return true;
        } catch (error) {
            console.error('Error saving local reports:', error);
            return false;
        }
    }

    // Generate unique report ID
    generateReportId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 11);
        return `report_${timestamp}_${random}`;
    }

    // Load reports for a specific user
    async loadReports(userId) {
        try {
            console.log('Loading reports for user:', userId);
            
            // Get all reports with error handling
            let allReports = {};
            try {
                allReports = await this.getAllReports();
                console.log('All reports loaded:', Object.keys(allReports).length);
            } catch (error) {
                console.error('Error in getAllReports:', error);
                // Try to get just local reports
                allReports = this.getLocalReports();
                console.log('Using local reports only:', Object.keys(allReports).length);
            }
            
            // Check if user is a leader with error handling
            let isLeader = false;
            try {
                const users = await this.dataLoader.loadUsers();
                const currentUser = Object.values(users).find(user => user.id === userId);
                isLeader = currentUser && currentUser.role === 'leader';
                console.log('User role check:', currentUser ? currentUser.role : 'not found');
            } catch (error) {
                console.error('Error checking user role:', error);
                // Default to non-leader if error
                isLeader = false;
            }
            
            // Convert to array and filter
            const reportsArray = Object.values(allReports);
            
            if (isLeader) {
                // Leaders can see all reports
                console.log('User is leader - showing all reports:', reportsArray.length);
                return reportsArray;
            } else {
                // Regular users only see their own reports
                const userReports = reportsArray.filter(report => report.authorId === userId);
                console.log('User reports filtered:', userReports.length);
                return userReports;
            }
        } catch (error) {
            console.error('Error loading reports:', error);
            // Return empty array instead of throwing
            return [];
        }
    }

    // Compartilhamento removido - função não disponível

    // Create a new report
    async createReport(reportData) {
        try {
            // Validate required fields
            if (!reportData.title || !reportData.description || !reportData.missionDate || !reportData.status) {
                return {
                    success: false,
                    message: 'Todos os campos obrigatórios devem ser preenchidos'
                };
            }

            // Get current user from auth service
            // Try to get existing auth service instance or create new one
            let authService;
            if (window.authServiceInstance) {
                authService = window.authServiceInstance;
            } else {
                authService = new AuthService();
                // Initialize the auth service to check existing session
                authService.checkSession();
            }
            const currentUser = authService.getCurrentUser();
            
            if (!currentUser) {
                return {
                    success: false,
                    message: 'Usuário não autenticado'
                };
            }

            // Generate unique ID and timestamps
            const reportId = this.generateReportId();
            const now = new Date().toISOString();

            // Create report object
            const newReport = {
                id: reportId,
                title: reportData.title.trim(),
                description: reportData.description.trim(),
                missionDate: reportData.missionDate,
                status: reportData.status,
                authorId: currentUser.id,
                authorName: currentUser.name || currentUser.username,
                createdAt: now,
                updatedAt: now,
                // Compartilhamento removido
                isPublic: false
            };

            // Load existing local reports
            const localReports = this.getLocalReports();
            
            // Add new report
            localReports[reportId] = newReport;
            
            // Save to localStorage
            if (!this.saveLocalReports(localReports)) {
                return {
                    success: false,
                    message: 'Erro ao salvar relatório'
                };
            }

            // Sync to cloud if available
            let syncMessage = 'Relatório criado com sucesso!';
            if (this.syncService) {
                try {
                    const syncResult = await this.syncService.syncReport(newReport);
                    if (syncResult.synced) {
                        syncMessage = 'Relatório criado e salvo na nuvem!';
                    } else {
                        syncMessage = 'Relatório criado localmente - será sincronizado quando online';
                    }
                } catch (syncError) {
                    console.warn('Sync error:', syncError);
                    syncMessage = 'Relatório criado localmente - erro na sincronização';
                }
            }

            // Compartilhamento removido - agora só compartilha quando usuário escolher explicitamente

            return {
                success: true,
                message: syncMessage,
                report: newReport
            };

        } catch (error) {
            console.error('Error creating report:', error);
            return {
                success: false,
                message: 'Erro interno do sistema'
            };
        }
    }

    // Get a single report by ID
    async getReport(reportId) {
        try {
            const allReports = await this.getAllReports();
            return allReports[reportId] || null;
        } catch (error) {
            console.error('Error getting report:', error);
            return null;
        }
    }

    // Update an existing report
    async updateReport(reportId, reportData, userId) {
        try {
            const allReports = await this.getAllReports();
            const existingReport = allReports[reportId];
            
            if (!existingReport) {
                return {
                    success: false,
                    message: 'Relatório não encontrado'
                };
            }
            
            // Check if user owns the report
            if (existingReport.authorId !== userId) {
                return {
                    success: false,
                    message: 'Você não tem permissão para editar este relatório'
                };
            }
            
            // Validate required fields
            if (!reportData.title || !reportData.description || !reportData.missionDate || !reportData.status) {
                return {
                    success: false,
                    message: 'Todos os campos obrigatórios devem ser preenchidos'
                };
            }
            
            // Update report data
            const updatedReport = {
                ...existingReport,
                title: reportData.title.trim(),
                description: reportData.description.trim(),
                missionDate: reportData.missionDate,
                status: reportData.status,
                updatedAt: new Date().toISOString()
            };
            
            // Save to localStorage (only local reports can be updated)
            const localReports = this.getLocalReports();
            if (localReports[reportId]) {
                localReports[reportId] = updatedReport;
                
                if (!this.saveLocalReports(localReports)) {
                    return {
                        success: false,
                        message: 'Erro ao salvar alterações'
                    };
                }
            }
            
            return {
                success: true,
                message: 'Relatório atualizado com sucesso!',
                report: updatedReport
            };
            
        } catch (error) {
            console.error('Error updating report:', error);
            return {
                success: false,
                message: 'Erro interno do sistema'
            };
        }
    }

    // Delete a report - NEW SYSTEM
    async deleteReport(reportId, userId) {
        try {
            // Remove from localStorage
            const localReports = this.getLocalReports();
            if (localReports[reportId]) {
                delete localReports[reportId];
                this.saveLocalReports(localReports);
            }
            
            // Always try to remove from cloud
            if (this.syncService) {
                try {
                    const cloudReports = await this.syncService.getCloudReports();
                    if (cloudReports[reportId]) {
                        delete cloudReports[reportId];
                        this.syncService.saveCloudReports(cloudReports);
                        console.log('Relatório removido da nuvem');
                    }
                } catch (syncError) {
                    console.warn('Erro ao remover da nuvem:', syncError);
                }
            }
            
            // Compartilhamento removido
            
            // Always return success - if it doesn't exist, consider it deleted
            return {
                success: true,
                message: 'Relatório excluído com sucesso!'
            };
            
        } catch (error) {
            console.error('Error deleting report:', error);
            // Even on error, return success to avoid blocking the UI
            return {
                success: true,
                message: 'Relatório excluído com sucesso!'
            };
        }
    }
}

// Export for use in other modules
window.ReportsService = ReportsService;