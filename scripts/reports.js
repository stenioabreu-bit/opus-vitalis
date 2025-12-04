// Reports Service Module
// Handles report creation, loading, and management

class ReportsService {
    constructor() {
        this.dataLoader = new DataLoader();
        this.localStorageKey = 'ordem_paranormal_reports';
    }

    // Get all reports (combining static and localStorage data)
    async getAllReports() {
        try {
            // Load static reports from JSON
            const staticReports = await this.dataLoader.loadReports();
            
            // Load dynamic reports from localStorage
            const localReports = this.getLocalReports();
            
            // Combine both sources
            return { ...staticReports, ...localReports };
        } catch (error) {
            console.error('Error loading all reports:', error);
            // Return only local reports if static loading fails
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
            const allReports = await this.getAllReports();
            // Filter reports by user ID
            return Object.values(allReports).filter(report => report.authorId === userId);
        } catch (error) {
            console.error('Error loading reports:', error);
            return [];
        }
    }

    // Load shared reports for a user
    async loadSharedReports(userId) {
        try {
            const allReports = await this.getAllReports();
            // Filter reports shared with this user
            return Object.values(allReports).filter(report => 
                report.sharedWith && report.sharedWith.includes(userId)
            );
        } catch (error) {
            console.error('Error loading shared reports:', error);
            return [];
        }
    }

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
            const authService = new AuthService();
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
                sharedWith: [],
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

            return {
                success: true,
                message: 'Relatório criado com sucesso!',
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

    // Delete a report
    async deleteReport(reportId, userId) {
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
                    message: 'Você não tem permissão para excluir este relatório'
                };
            }
            
            // Remove from localStorage (only local reports can be deleted)
            const localReports = this.getLocalReports();
            if (localReports[reportId]) {
                delete localReports[reportId];
                
                if (!this.saveLocalReports(localReports)) {
                    return {
                        success: false,
                        message: 'Erro ao excluir relatório'
                    };
                }
            } else {
                return {
                    success: false,
                    message: 'Não é possível excluir relatórios do sistema'
                };
            }
            
            return {
                success: true,
                message: 'Relatório excluído com sucesso!'
            };
            
        } catch (error) {
            console.error('Error deleting report:', error);
            return {
                success: false,
                message: 'Erro interno do sistema'
            };
        }
    }

    // Share a report with other users
    async shareReport(reportId, targetUserIds, userId) {
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
                    message: 'Você não tem permissão para compartilhar este relatório'
                };
            }
            
            // Validate target users
            if (!targetUserIds || targetUserIds.length === 0) {
                return {
                    success: false,
                    message: 'Selecione pelo menos um usuário para compartilhar'
                };
            }
            
            // Validate that target users exist
            const users = await this.dataLoader.loadUsers();
            const validUserIds = targetUserIds.filter(id => {
                const userExists = Object.values(users).some(user => user.id === id);
                if (!userExists) {
                    console.warn(`User with ID ${id} not found`);
                }
                return userExists;
            });
            
            if (validUserIds.length === 0) {
                return {
                    success: false,
                    message: 'Nenhum usuário válido selecionado'
                };
            }
            
            // Update shared list (avoid duplicates)
            const currentShared = existingReport.sharedWith || [];
            const newShared = [...new Set([...currentShared, ...validUserIds])];
            
            const updatedReport = {
                ...existingReport,
                sharedWith: newShared,
                updatedAt: new Date().toISOString()
            };
            
            // Save to localStorage (only local reports can be updated)
            const localReports = this.getLocalReports();
            if (localReports[reportId]) {
                localReports[reportId] = updatedReport;
                
                if (!this.saveLocalReports(localReports)) {
                    return {
                        success: false,
                        message: 'Erro ao compartilhar relatório'
                    };
                }
                
                // Add sharing notification
                this.addSharingNotification(reportId, validUserIds, existingReport.title, existingReport.authorName);
            }
            
            return {
                success: true,
                message: `Relatório compartilhado com ${validUserIds.length} usuário${validUserIds.length > 1 ? 's' : ''}!`,
                report: updatedReport,
                sharedWithCount: validUserIds.length
            };
            
        } catch (error) {
            console.error('Error sharing report:', error);
            return {
                success: false,
                message: 'Erro interno do sistema'
            };
        }
    }

    // Get available users for sharing
    async getAvailableUsers(currentUserId) {
        try {
            const users = await this.dataLoader.loadUsers();
            // Return all users except current user, sorted by name
            return Object.values(users)
                .filter(user => user.id !== currentUserId)
                .sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error('Error loading available users:', error);
            return [];
        }
    }

    // Add sharing notification
    addSharingNotification(reportId, targetUserIds, reportTitle, authorName) {
        try {
            const notifications = this.getSharingNotifications();
            const timestamp = new Date().toISOString();
            
            targetUserIds.forEach(userId => {
                const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
                notifications[notificationId] = {
                    id: notificationId,
                    type: 'report_shared',
                    recipientId: userId,
                    reportId: reportId,
                    reportTitle: reportTitle,
                    authorName: authorName,
                    createdAt: timestamp,
                    read: false
                };
            });
            
            this.saveSharingNotifications(notifications);
        } catch (error) {
            console.error('Error adding sharing notification:', error);
        }
    }

    // Get sharing notifications from localStorage
    getSharingNotifications() {
        try {
            const stored = localStorage.getItem('ordem_paranormal_notifications');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading notifications:', error);
            return {};
        }
    }

    // Save sharing notifications to localStorage
    saveSharingNotifications(notifications) {
        try {
            localStorage.setItem('ordem_paranormal_notifications', JSON.stringify(notifications));
            return true;
        } catch (error) {
            console.error('Error saving notifications:', error);
            return false;
        }
    }

    // Get notifications for a specific user
    async getNotificationsForUser(userId) {
        try {
            const notifications = this.getSharingNotifications();
            return Object.values(notifications)
                .filter(notification => notification.recipientId === userId)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('Error loading user notifications:', error);
            return [];
        }
    }

    // Mark notification as read
    markNotificationAsRead(notificationId) {
        try {
            const notifications = this.getSharingNotifications();
            if (notifications[notificationId]) {
                notifications[notificationId].read = true;
                this.saveSharingNotifications(notifications);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
    }

    // Check if user has permission to access a report
    async checkReportAccess(reportId, userId) {
        try {
            const report = await this.getReport(reportId);
            if (!report) return false;
            
            // Owner has full access
            if (report.authorId === userId) {
                return { hasAccess: true, accessType: 'owner' };
            }
            
            // Check if report is shared with user
            if (report.sharedWith && report.sharedWith.includes(userId)) {
                return { hasAccess: true, accessType: 'shared' };
            }
            
            // Check team leader access
            const users = await this.dataLoader.loadUsers();
            const teams = await this.dataLoader.loadTeams();
            const currentUser = Object.values(users).find(user => user.id === userId);
            const reportAuthor = Object.values(users).find(user => user.id === report.authorId);
            
            if (currentUser && reportAuthor && currentUser.role === 'leader') {
                // Check if the report author is in the leader's team
                const team = Object.values(teams).find(team => 
                    team.leaderId === userId && team.members.includes(report.authorId)
                );
                
                if (team) {
                    return { hasAccess: true, accessType: 'team_leader' };
                }
            }
            
            return { hasAccess: false, accessType: null };
        } catch (error) {
            console.error('Error checking report access:', error);
            return { hasAccess: false, accessType: null };
        }
    }
}

// Export for use in other modules
window.ReportsService = ReportsService;