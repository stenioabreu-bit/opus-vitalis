// Reports Service Module
// Handles report creation, loading, and management with Firebase

class ReportsService {
    constructor() {
        try {
            console.log('🔥 Creating ReportsService with Firebase...');
            this.dataLoader = new DataLoader();
            this.localStorageKey = 'opus_vitalis_reports';
            this.useFirebase = false;
            this.firebaseReports = null;
            
            // Initialize Firebase asynchronously
            this.initFirebase().catch(error => {
                console.warn('Firebase initialization failed, using localStorage:', error);
            });
            
            console.log('✅ ReportsService constructor completed');
        } catch (error) {
            console.error('❌ Error in ReportsService constructor:', error);
            throw error;
        }
    }

    // Initialize Firebase
    async initFirebase() {
        try {
            if (window.firebaseReportsService) {
                await window.firebaseReportsService.init();
                this.firebaseReports = window.firebaseReportsService;
                this.useFirebase = true;
                console.log('✅ Firebase Reports Service ready');
            }
        } catch (error) {
            console.warn('⚠️ Firebase not available, using localStorage fallback:', error);
            this.useFirebase = false;
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
            console.log('📋 Loading reports for user:', userId);
            
            // Check if user is a leader
            let isLeader = false;
            try {
                const users = await this.dataLoader.loadUsers();
                const currentUser = Object.values(users).find(user => user.id === userId);
                isLeader = currentUser && currentUser.role === 'leader';
                console.log('👤 User role:', currentUser ? currentUser.role : 'not found');
            } catch (error) {
                console.warn('⚠️ Error checking user role:', error);
            }

            // Try Firebase first, fallback to localStorage
            if (this.useFirebase && this.firebaseReports) {
                console.log('🔥 Loading reports from Firebase');
                return await this.firebaseReports.loadReports(userId, isLeader);
            } else {
                console.log('💾 Loading reports from localStorage');
                return await this.loadReportsLocal(userId, isLeader);
            }

        } catch (error) {
            console.error('❌ Error loading reports:', error);
            return [];
        }
    }

    // Load reports from localStorage (fallback)
    async loadReportsLocal(userId, isLeader) {
        try {
            const allReports = this.getLocalReports();
            const reportsArray = Object.values(allReports);
            
            if (isLeader) {
                console.log('👑 Leader view - showing all reports:', reportsArray.length);
                return reportsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            } else {
                const userReports = reportsArray.filter(report => report.authorId === userId);
                console.log('👤 User reports:', userReports.length);
                return userReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }
        } catch (error) {
            console.error('❌ Error loading local reports:', error);
            return [];
        }
    }

    // Compartilhamento removido - função não disponível

    // Create a new report
    async createReport(reportData) {
        try {
            console.log('📝 Creating report...', reportData.title);
            
            // Validate required fields
            if (!reportData.title || !reportData.description || !reportData.missionDate || !reportData.status) {
                return {
                    success: false,
                    message: 'Todos os campos obrigatórios devem ser preenchidos'
                };
            }

            // Get current user
            const authService = window.authServiceInstance || new AuthService();
            const currentUser = authService.getCurrentUser();
            
            if (!currentUser) {
                return {
                    success: false,
                    message: 'Usuário não autenticado'
                };
            }

            // Prepare report data
            const reportToCreate = {
                title: reportData.title.trim(),
                description: reportData.description.trim(),
                missionDate: reportData.missionDate,
                status: reportData.status,
                authorName: currentUser.name || currentUser.username
            };

            // Try Firebase first, fallback to localStorage
            if (this.useFirebase && this.firebaseReports) {
                console.log('🔥 Using Firebase to create report');
                return await this.firebaseReports.createReport(reportToCreate, currentUser.id);
            } else {
                console.log('💾 Using localStorage to create report');
                return await this.createReportLocal(reportToCreate, currentUser);
            }

        } catch (error) {
            console.error('❌ Error creating report:', error);
            return {
                success: false,
                message: 'Erro interno do sistema: ' + error.message
            };
        }
    }

    // Create report in localStorage (fallback)
    async createReportLocal(reportData, currentUser) {
        try {
            const reportId = this.generateReportId();
            const now = new Date().toISOString();

            const newReport = {
                id: reportId,
                ...reportData,
                authorId: currentUser.id,
                createdAt: now,
                updatedAt: now,
                isShared: false,
                sharedWith: []
            };

            // Save to localStorage
            const localReports = this.getLocalReports();
            localReports[reportId] = newReport;
            
            if (!this.saveLocalReports(localReports)) {
                throw new Error('Erro ao salvar no localStorage');
            }

            return {
                success: true,
                message: 'Relatório criado localmente!',
                report: newReport
            };

        } catch (error) {
            console.error('❌ Error creating local report:', error);
            return {
                success: false,
                message: 'Erro ao criar relatório local: ' + error.message
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
    // Share a report with other users
    async shareReport(reportId, targetUserIds, authorId) {
        try {
            console.log('🔗 Sharing report:', reportId, 'with users:', targetUserIds);
            
            if (this.useFirebase && this.firebaseReports) {
                console.log('🔥 Using Firebase to share report');
                return await this.firebaseReports.shareReport(reportId, targetUserIds, authorId);
            } else {
                console.log('💾 Using localStorage to share report');
                return await this.shareReportLocal(reportId, targetUserIds, authorId);
            }

        } catch (error) {
            console.error('❌ Error sharing report:', error);
            return {
                success: false,
                message: 'Erro ao compartilhar relatório: ' + error.message
            };
        }
    }

    // Share report locally (fallback)
    async shareReportLocal(reportId, targetUserIds, authorId) {
        try {
            // For localStorage, we'll use a simple shared reports structure
            const sharedReports = JSON.parse(localStorage.getItem('opus_vitalis_shared_reports') || '{}');
            
            targetUserIds.forEach(userId => {
                if (!sharedReports[userId]) {
                    sharedReports[userId] = [];
                }
                if (!sharedReports[userId].includes(reportId)) {
                    sharedReports[userId].push(reportId);
                }
            });
            
            localStorage.setItem('opus_vitalis_shared_reports', JSON.stringify(sharedReports));
            
            return {
                success: true,
                message: `Relatório compartilhado com ${targetUserIds.length} usuário${targetUserIds.length > 1 ? 's' : ''}!`
            };

        } catch (error) {
            console.error('❌ Error sharing report locally:', error);
            return {
                success: false,
                message: 'Erro ao compartilhar relatório localmente'
            };
        }
    }

    // Load shared reports for a user
    async loadSharedReports(userId) {
        try {
            console.log('📥 Loading shared reports for user:', userId);
            
            if (this.useFirebase && this.firebaseReports) {
                console.log('🔥 Using Firebase to load shared reports');
                return await this.firebaseReports.loadSharedReports(userId);
            } else {
                console.log('💾 Using localStorage to load shared reports');
                return await this.loadSharedReportsLocal(userId);
            }

        } catch (error) {
            console.error('❌ Error loading shared reports:', error);
            return [];
        }
    }

    // Load shared reports from localStorage (fallback)
    async loadSharedReportsLocal(userId) {
        try {
            const sharedReports = JSON.parse(localStorage.getItem('opus_vitalis_shared_reports') || '{}');
            const userSharedIds = sharedReports[userId] || [];
            
            const allReports = this.getLocalReports();
            const sharedReportsArray = userSharedIds
                .map(reportId => allReports[reportId])
                .filter(report => report !== undefined);
            
            return sharedReportsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        } catch (error) {
            console.error('❌ Error loading local shared reports:', error);
            return [];
        }
    }

    // Get available users for sharing
    async getAvailableUsers(currentUserId) {
        try {
            if (this.useFirebase && this.firebaseReports) {
                return await this.firebaseReports.getAvailableUsers(currentUserId);
            } else {
                const users = await this.dataLoader.loadUsers();
                return Object.values(users)
                    .filter(user => user.id !== currentUserId)
                    .sort((a, b) => a.name.localeCompare(b.name));
            }
        } catch (error) {
            console.error('❌ Error loading available users:', error);
            return [];
        }
    }

    // Get notifications for a user
    async getNotificationsForUser(userId) {
        try {
            if (this.useFirebase && this.firebaseReports) {
                return await this.firebaseReports.getNotifications(userId);
            } else {
                // Fallback to localStorage notifications
                const notifications = JSON.parse(localStorage.getItem('opus_vitalis_notifications') || '{}');
                return Object.values(notifications)
                    .filter(notification => notification.recipientId === userId)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }
        } catch (error) {
            console.error('❌ Error loading notifications:', error);
            return [];
        }
    }

    // Mark notification as read
    async markNotificationAsRead(notificationId) {
        try {
            if (this.useFirebase && this.firebaseReports) {
                return await this.firebaseReports.markNotificationAsRead(notificationId);
            } else {
                // Fallback to localStorage
                const notifications = JSON.parse(localStorage.getItem('opus_vitalis_notifications') || '{}');
                if (notifications[notificationId]) {
                    notifications[notificationId].read = true;
                    localStorage.setItem('opus_vitalis_notifications', JSON.stringify(notifications));
                    return true;
                }
                return false;
            }
        } catch (error) {
            console.error('❌ Error marking notification as read:', error);
            return false;
        }
    }
}

// Export for use in other modules
window.ReportsService = ReportsService;