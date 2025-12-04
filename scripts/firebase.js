// Firebase Configuration and Services
// Handles Firebase initialization and database operations

// Import Firebase modules (using CDN version for compatibility)
// Note: This will be loaded via CDN in HTML

class FirebaseService {
    constructor() {
        this.app = null;
        this.db = null;
        this.auth = null;
        this.initialized = false;
    }

    // Initialize Firebase
    async init() {
        try {
            console.log('🔥 Initializing Firebase...');
            
            // Firebase configuration
            const firebaseConfig = {
                apiKey: "AIzaSyCoYBX0bQLfm7v41KTQAkmkfyfJlz0jrbw",
                authDomain: "dbopus.firebaseapp.com",
                projectId: "dbopus",
                storageBucket: "dbopus.firebasestorage.app",
                messagingSenderId: "609404656580",
                appId: "1:609404656580:web:f0681399ec68e7c6962291",
                measurementId: "G-0F33N6PTWV"
            };

            // Initialize Firebase
            this.app = firebase.initializeApp(firebaseConfig);
            this.db = firebase.firestore();
            this.auth = firebase.auth();
            
            // Enable offline persistence
            try {
                await this.db.enablePersistence();
                console.log('✅ Firebase offline persistence enabled');
            } catch (error) {
                console.warn('⚠️ Firebase persistence failed:', error);
            }
            
            this.initialized = true;
            console.log('✅ Firebase initialized successfully');
            
            return true;
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            return false;
        }
    }

    // Check if Firebase is initialized
    isInitialized() {
        return this.initialized;
    }

    // Get Firestore database
    getDB() {
        if (!this.initialized) {
            throw new Error('Firebase not initialized');
        }
        return this.db;
    }

    // Get Auth service
    getAuth() {
        if (!this.initialized) {
            throw new Error('Firebase not initialized');
        }
        return this.auth;
    }
}

// Firebase Reports Service
class FirebaseReportsService {
    constructor(firebaseService) {
        this.firebase = firebaseService;
        this.db = null;
        this.reportsCollection = 'reports';
        this.sharedReportsCollection = 'shared_reports';
        this.usersCollection = 'users';
    }

    // Initialize the service
    async init() {
        if (!this.firebase.isInitialized()) {
            await this.firebase.init();
        }
        this.db = this.firebase.getDB();
        console.log('✅ Firebase Reports Service initialized');
    }

    // Create a new report
    async createReport(reportData, authorId) {
        try {
            console.log('📝 Creating report in Firebase...', reportData.title);
            
            // Estrutura exata como você especificou
            const report = {
                titulo: reportData.title,
                conteudo: reportData.description,
                autor: authorId,
                compartilhadoCom: [], // Array vazio inicialmente
                criadoEm: Date.now(),
                missionDate: reportData.missionDate,
                status: reportData.status,
                authorName: reportData.authorName
            };

            // Salvar no Firestore na coleção "relatorios"
            const docRef = await this.db.collection('relatorios').add(report);
            
            // Adicionar o ID do documento ao objeto
            report.id = docRef.id;
            
            console.log('✅ Report created in Firebase:', docRef.id);
            return {
                success: true,
                report: {
                    id: docRef.id,
                    title: report.titulo,
                    description: report.conteudo,
                    authorId: report.autor,
                    authorName: report.authorName,
                    createdAt: new Date(report.criadoEm).toISOString(),
                    missionDate: report.missionDate,
                    status: report.status,
                    sharedWith: report.compartilhadoCom
                },
                message: 'Relatório criado e salvo na nuvem!'
            };
            
        } catch (error) {
            console.error('❌ Error creating report in Firebase:', error);
            return {
                success: false,
                message: 'Erro ao salvar relatório na nuvem: ' + error.message
            };
        }
    }

    // Load reports for a user
    async loadReports(userId, isLeader = false) {
        try {
            console.log('📋 Loading reports from Firebase for user:', userId);
            
            let query;
            if (isLeader) {
                // Leaders see all reports
                query = this.db.collection('relatorios')
                    .orderBy('criadoEm', 'desc');
            } else {
                // Regular users see reports where:
                // autor == userId OR compartilhadoCom contains userId
                query = this.db.collection('relatorios');
            }

            const snapshot = await query.get();
            const reports = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                
                // Se não é líder, filtrar apenas relatórios do usuário ou compartilhados com ele
                if (!isLeader) {
                    const isAuthor = data.autor === userId;
                    const isSharedWith = data.compartilhadoCom && data.compartilhadoCom.includes(userId);
                    
                    if (!isAuthor && !isSharedWith) {
                        return; // Pular este relatório
                    }
                }
                
                // Converter para formato esperado pelo frontend
                reports.push({
                    id: doc.id,
                    title: data.titulo,
                    description: data.conteudo,
                    authorId: data.autor,
                    authorName: data.authorName,
                    createdAt: new Date(data.criadoEm).toISOString(),
                    missionDate: data.missionDate,
                    status: data.status,
                    sharedWith: data.compartilhadoCom || []
                });
            });

            // Ordenar por data de criação (mais recente primeiro)
            reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            console.log(`✅ Loaded ${reports.length} reports from Firebase`);
            return reports;
            
        } catch (error) {
            console.error('❌ Error loading reports from Firebase:', error);
            return [];
        }
    }

    // Load shared reports for a user
    async loadSharedReports(userId) {
        try {
            console.log('📥 Loading shared reports from Firebase for user:', userId);
            
            // Get reports where user is in compartilhadoCom array
            const query = this.db.collection('relatorios')
                .where('compartilhadoCom', 'array-contains', userId);

            const snapshot = await query.get();
            const reports = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                
                // Converter para formato esperado pelo frontend
                reports.push({
                    id: doc.id,
                    title: data.titulo,
                    description: data.conteudo,
                    authorId: data.autor,
                    authorName: data.authorName,
                    createdAt: new Date(data.criadoEm).toISOString(),
                    missionDate: data.missionDate,
                    status: data.status,
                    sharedWith: data.compartilhadoCom || []
                });
            });

            // Ordenar por data de criação (mais recente primeiro)
            reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            console.log(`✅ Loaded ${reports.length} shared reports from Firebase`);
            return reports;
            
        } catch (error) {
            console.error('❌ Error loading shared reports from Firebase:', error);
            return [];
        }
    }

    // Share a report with other users
    async shareReport(reportId, targetUserIds, authorId) {
        try {
            console.log('🔗 Sharing report in Firebase:', reportId, 'with users:', targetUserIds);
            
            const reportRef = this.db.collection('relatorios').doc(reportId);
            const reportDoc = await reportRef.get();
            
            if (!reportDoc.exists) {
                return {
                    success: false,
                    message: 'Relatório não encontrado'
                };
            }

            const reportData = reportDoc.data();
            
            // Check if user owns the report
            if (reportData.autor !== authorId) {
                return {
                    success: false,
                    message: 'Você não tem permissão para compartilhar este relatório'
                };
            }

            // Update report with shared users - usando a estrutura correta
            const currentSharedWith = reportData.compartilhadoCom || [];
            const newSharedWith = [...new Set([...currentSharedWith, ...targetUserIds])];
            
            await reportRef.update({
                compartilhadoCom: newSharedWith
            });

            // Create sharing notifications
            await this.createSharingNotifications(reportId, targetUserIds, {
                title: reportData.titulo,
                authorName: reportData.authorName
            });

            console.log('✅ Report shared successfully in Firebase');
            return {
                success: true,
                message: `Relatório compartilhado com ${targetUserIds.length} usuário${targetUserIds.length > 1 ? 's' : ''}!`
            };
            
        } catch (error) {
            console.error('❌ Error sharing report in Firebase:', error);
            return {
                success: false,
                message: 'Erro ao compartilhar relatório: ' + error.message
            };
        }
    }

    // Create sharing notifications
    async createSharingNotifications(reportId, targetUserIds, reportData) {
        try {
            const batch = this.db.batch();
            const now = Date.now();
            
            targetUserIds.forEach(userId => {
                const notificationRef = this.db.collection('notifications').doc();
                batch.set(notificationRef, {
                    id: notificationRef.id,
                    type: 'report_shared',
                    recipientId: userId,
                    reportId: reportId,
                    reportTitle: reportData.title,
                    authorName: reportData.authorName,
                    createdAt: now,
                    read: false
                });
            });
            
            await batch.commit();
            console.log('✅ Sharing notifications created');
            
        } catch (error) {
            console.error('❌ Error creating sharing notifications:', error);
        }
    }

    // Get notifications for a user
    async getNotifications(userId) {
        try {
            const query = this.db.collection('notifications')
                .where('recipientId', '==', userId)
                .limit(50);

            const snapshot = await query.get();
            const notifications = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                notifications.push({
                    id: doc.id,
                    ...data,
                    createdAt: new Date(data.createdAt).toISOString()
                });
            });

            // Ordenar por data de criação (mais recente primeiro)
            notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return notifications;
            
        } catch (error) {
            console.error('❌ Error loading notifications:', error);
            return [];
        }
    }

    // Mark notification as read
    async markNotificationAsRead(notificationId) {
        try {
            await this.db.collection('notifications').doc(notificationId).update({
                read: true,
                readAt: new Date()
            });
            return true;
        } catch (error) {
            console.error('❌ Error marking notification as read:', error);
            return false;
        }
    }

    // Delete a report
    async deleteReport(reportId, authorId) {
        try {
            const reportRef = this.db.collection('relatorios').doc(reportId);
            const reportDoc = await reportRef.get();
            
            if (!reportDoc.exists) {
                return {
                    success: false,
                    message: 'Relatório não encontrado'
                };
            }

            const reportData = reportDoc.data();
            
            // Check if user owns the report
            if (reportData.autor !== authorId) {
                return {
                    success: false,
                    message: 'Você não tem permissão para excluir este relatório'
                };
            }

            // Delete the report
            await reportRef.delete();
            
            // Delete related notifications
            const notificationsQuery = this.db.collection('notifications')
                .where('reportId', '==', reportId);
            const notificationsSnapshot = await notificationsQuery.get();
            
            const batch = this.db.batch();
            notificationsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            console.log('✅ Report deleted from Firebase');
            return {
                success: true,
                message: 'Relatório excluído com sucesso!'
            };
            
        } catch (error) {
            console.error('❌ Error deleting report from Firebase:', error);
            return {
                success: false,
                message: 'Erro ao excluir relatório: ' + error.message
            };
        }
    }

    // Update a report
    async updateReport(reportId, reportData, authorId) {
        try {
            const reportRef = this.db.collection('relatorios').doc(reportId);
            const reportDoc = await reportRef.get();
            
            if (!reportDoc.exists) {
                return {
                    success: false,
                    message: 'Relatório não encontrado'
                };
            }

            const existingData = reportDoc.data();
            
            // Check if user owns the report
            if (existingData.autor !== authorId) {
                return {
                    success: false,
                    message: 'Você não tem permissão para editar este relatório'
                };
            }

            // Update the report usando a estrutura correta
            const updateData = {};
            if (reportData.title) updateData.titulo = reportData.title;
            if (reportData.description) updateData.conteudo = reportData.description;
            if (reportData.missionDate) updateData.missionDate = reportData.missionDate;
            if (reportData.status) updateData.status = reportData.status;

            await reportRef.update(updateData);

            console.log('✅ Report updated in Firebase');
            return {
                success: true,
                message: 'Relatório atualizado com sucesso!'
            };
            
        } catch (error) {
            console.error('❌ Error updating report in Firebase:', error);
            return {
                success: false,
                message: 'Erro ao atualizar relatório: ' + error.message
            };
        }
    }

    // Generate unique report ID
    generateReportId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 11);
        return `report_${timestamp}_${random}`;
    }

    // Get available users for sharing
    async getAvailableUsers(currentUserId) {
        try {
            // For now, return the static users from localStorage
            // In a full Firebase implementation, users would also be in Firestore
            const authService = new AuthService();
            const dataLoader = new DataLoader();
            const users = await dataLoader.loadUsers();
            
            return Object.values(users)
                .filter(user => user.id !== currentUserId)
                .sort((a, b) => a.name.localeCompare(b.name));
                
        } catch (error) {
            console.error('❌ Error loading available users:', error);
            return [];
        }
    }
}

// Export services
window.FirebaseService = FirebaseService;
window.FirebaseReportsService = FirebaseReportsService;

// Initialize global Firebase service
window.firebaseService = new FirebaseService();
window.firebaseReportsService = new FirebaseReportsService(window.firebaseService);

console.log('🔥 Firebase services loaded');