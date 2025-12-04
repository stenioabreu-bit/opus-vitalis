/**
 * Property-based tests for report creation persistence
 * Feature: simple-login-auth, Property 5: Report creation persistence
 * Validates: Requirements 5.4, 5.5
 */

const fc = require('fast-check');

// Mock DataLoader for testing
class MockDataLoader {
    constructor() {
        this.mockReportsData = {
            "report_001": {
                "id": "report_001",
                "title": "Investigação Paranormal - Casa Abandonada",
                "description": "Relatório detalhado da investigação...",
                "missionDate": "2024-12-01",
                "status": "completed",
                "authorId": "user_001",
                "authorName": "Bella Evans",
                "createdAt": "2024-12-01T18:30:00Z",
                "updatedAt": "2024-12-01T18:30:00Z",
                "sharedWith": ["user_002"],
                "isPublic": false
            }
        };
    }

    async loadReports() {
        return this.mockReportsData;
    }
}

// Mock AuthService for testing
class MockAuthService {
    constructor() {
        this.currentUser = {
            id: "user_001",
            username: "bella_evans",
            name: "Bella Evans",
            role: "agent",
            team: "team_alpha"
        };
    }

    getCurrentUser() {
        return this.currentUser;
    }

    checkSession() {
        return true;
    }
}

// Mock ReportsService with MockDataLoader
class ReportsService {
    constructor() {
        this.dataLoader = new MockDataLoader();
        this.localStorageKey = 'ordem_paranormal_reports';
        this.mockLocalStorage = {};
    }

    // Mock localStorage methods for testing
    getLocalReports() {
        try {
            const stored = this.mockLocalStorage[this.localStorageKey];
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading local reports:', error);
            return {};
        }
    }

    saveLocalReports(reports) {
        try {
            this.mockLocalStorage[this.localStorageKey] = JSON.stringify(reports);
            return true;
        } catch (error) {
            console.error('Error saving local reports:', error);
            return false;
        }
    }

    generateReportId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `report_${timestamp}_${random}`;
    }

    async getAllReports() {
        try {
            const staticReports = await this.dataLoader.loadReports();
            const localReports = this.getLocalReports();
            return { ...staticReports, ...localReports };
        } catch (error) {
            console.error('Error loading all reports:', error);
            return this.getLocalReports();
        }
    }

    async loadReports(userId) {
        try {
            const allReports = await this.getAllReports();
            return Object.values(allReports).filter(report => report.authorId === userId);
        } catch (error) {
            console.error('Error loading reports:', error);
            return [];
        }
    }

    async createReport(reportData) {
        try {
            // Validate required fields
            if (!reportData.title || !reportData.description || !reportData.missionDate || !reportData.status) {
                return {
                    success: false,
                    message: 'Todos os campos obrigatórios devem ser preenchidos'
                };
            }

            // Get current user from mock auth service
            const authService = new MockAuthService();
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

    async getReport(reportId) {
        try {
            const allReports = await this.getAllReports();
            return allReports[reportId] || null;
        } catch (error) {
            console.error('Error getting report:', error);
            return null;
        }
    }

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
}

describe('ReportsService Property Tests', () => {
    let reportsService;
    
    beforeEach(() => {
        reportsService = new ReportsService();
        // Clear mock localStorage before each test
        reportsService.mockLocalStorage = {};
    });

    /**
     * Property 5: Report creation persistence
     * For any valid report data submitted by an authenticated user, the system should save the report with unique ID and timestamp
     */
    test('Property 5: Report creation persistence', async () => {
        const validStatuses = ['completed', 'partial', 'failed'];
        
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
                fc.string({ minLength: 10, maxLength: 2000 }).filter(s => s.trim().length >= 10),
                fc.date({ min: new Date('2020-01-01'), max: new Date() }),
                fc.constantFrom(...validStatuses),
                async (title, description, missionDate, status) => {
                    // Create report data
                    const reportData = {
                        title: title.trim(),
                        description: description.trim(),
                        missionDate: missionDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
                        status: status
                    };

                    // Create the report
                    const result = await reportsService.createReport(reportData);
                    
                    // For any valid report data, creation should succeed
                    expect(result.success).toBe(true);
                    expect(result.message).toBe('Relatório criado com sucesso!');
                    expect(result.report).toBeDefined();
                    
                    // Verify report has unique ID and timestamp
                    expect(result.report.id).toBeDefined();
                    expect(result.report.id).toMatch(/^report_\d+_[a-z0-9]+$/);
                    expect(result.report.createdAt).toBeDefined();
                    expect(result.report.updatedAt).toBeDefined();
                    
                    // Verify report data is preserved
                    expect(result.report.title).toBe(reportData.title);
                    expect(result.report.description).toBe(reportData.description);
                    expect(result.report.missionDate).toBe(reportData.missionDate);
                    expect(result.report.status).toBe(reportData.status);
                    
                    // Verify author information is set
                    expect(result.report.authorId).toBe('user_001');
                    expect(result.report.authorName).toBe('Bella Evans');
                    
                    // Verify report is persisted - should be retrievable
                    const userReports = await reportsService.loadReports('user_001');
                    const savedReport = userReports.find(r => r.id === result.report.id);
                    expect(savedReport).toBeDefined();
                    expect(savedReport.title).toBe(reportData.title);
                    expect(savedReport.description).toBe(reportData.description);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 5: Report creation persistence - unique IDs generated', async () => {
        const reportData = {
            title: 'Test Report',
            description: 'This is a test report description with enough characters.',
            missionDate: '2024-12-01',
            status: 'completed'
        };

        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 10 }),
                async (numReports) => {
                    const createdReports = [];
                    
                    // Create multiple reports
                    for (let i = 0; i < numReports; i++) {
                        const result = await reportsService.createReport({
                            ...reportData,
                            title: `${reportData.title} ${i}`
                        });
                        
                        expect(result.success).toBe(true);
                        createdReports.push(result.report);
                    }
                    
                    // Verify all IDs are unique
                    const ids = createdReports.map(r => r.id);
                    const uniqueIds = new Set(ids);
                    expect(uniqueIds.size).toBe(ids.length);
                    
                    // Verify all reports are persisted
                    const userReports = await reportsService.loadReports('user_001');
                    expect(userReports.length).toBeGreaterThanOrEqual(numReports);
                }
            ),
            { numRuns: 50 }
        );
    });

    test('Property 5: Report creation persistence - invalid data rejection', async () => {
        const invalidReportCases = [
            { title: '', description: 'Valid description', missionDate: '2024-12-01', status: 'completed' },
            { title: 'Valid title', description: '', missionDate: '2024-12-01', status: 'completed' },
            { title: 'Valid title', description: 'Valid description', missionDate: '', status: 'completed' },
            { title: 'Valid title', description: 'Valid description', missionDate: '2024-12-01', status: '' },
        ];

        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom(...invalidReportCases),
                async (invalidData) => {
                    const result = await reportsService.createReport(invalidData);
                    
                    // For any invalid report data, creation should fail
                    expect(result.success).toBe(false);
                    expect(result.message).toBe('Todos os campos obrigatórios devem ser preenchidos');
                    expect(result.report).toBeUndefined();
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 5: Report creation persistence - timestamps are valid ISO strings', async () => {
        const reportData = {
            title: 'Timestamp Test Report',
            description: 'Testing that timestamps are properly formatted ISO strings.',
            missionDate: '2024-12-01',
            status: 'completed'
        };

        await fc.assert(
            fc.asyncProperty(
                fc.constant(reportData),
                async (data) => {
                    const result = await reportsService.createReport(data);
                    
                    expect(result.success).toBe(true);
                    
                    // Verify timestamps are valid ISO strings
                    expect(result.report.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
                    expect(result.report.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
                    
                    // Verify timestamps can be parsed as valid dates
                    const createdDate = new Date(result.report.createdAt);
                    const updatedDate = new Date(result.report.updatedAt);
                    
                    expect(createdDate.getTime()).not.toBeNaN();
                    expect(updatedDate.getTime()).not.toBeNaN();
                    
                    // For new reports, created and updated timestamps should be the same
                    expect(result.report.createdAt).toBe(result.report.updatedAt);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 6: Report ownership
     * For any created report, only the original author should have edit and delete permissions
     * Feature: simple-login-auth, Property 6: Report ownership
     * Validates: Requirements 6.3
     */
    test('Property 6: Report ownership - only author can edit', async () => {
        const validStatuses = ['completed', 'partial', 'failed'];
        
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
                fc.string({ minLength: 10, maxLength: 2000 }).filter(s => s.trim().length >= 10),
                fc.date({ min: new Date('2020-01-01'), max: new Date() }),
                fc.constantFrom(...validStatuses),
                fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length >= 5), // Different user ID
                async (title, description, missionDate, status, differentUserId) => {
                    // Create report data
                    const reportData = {
                        title: title.trim(),
                        description: description.trim(),
                        missionDate: missionDate.toISOString().split('T')[0],
                        status: status
                    };

                    // Create the report (as user_001)
                    const createResult = await reportsService.createReport(reportData);
                    expect(createResult.success).toBe(true);
                    
                    const reportId = createResult.report.id;
                    const authorId = createResult.report.authorId;
                    
                    // Ensure different user ID is actually different
                    const nonAuthorId = differentUserId === authorId ? `${differentUserId}_different` : differentUserId;
                    
                    // Try to edit as the author (should succeed)
                    const authorEditResult = await reportsService.updateReport(
                        reportId,
                        {
                            title: 'Updated by Author',
                            description: 'Updated description by author',
                            missionDate: reportData.missionDate,
                            status: reportData.status
                        },
                        authorId
                    );
                    expect(authorEditResult.success).toBe(true);
                    expect(authorEditResult.message).toBe('Relatório atualizado com sucesso!');
                    
                    // Try to edit as a different user (should fail)
                    const nonAuthorEditResult = await reportsService.updateReport(
                        reportId,
                        {
                            title: 'Updated by Non-Author',
                            description: 'Updated description by non-author',
                            missionDate: reportData.missionDate,
                            status: reportData.status
                        },
                        nonAuthorId
                    );
                    expect(nonAuthorEditResult.success).toBe(false);
                    expect(nonAuthorEditResult.message).toBe('Você não tem permissão para editar este relatório');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 6: Report ownership - only author can delete', async () => {
        const validStatuses = ['completed', 'partial', 'failed'];
        
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
                fc.string({ minLength: 10, maxLength: 2000 }).filter(s => s.trim().length >= 10),
                fc.date({ min: new Date('2020-01-01'), max: new Date() }),
                fc.constantFrom(...validStatuses),
                fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length >= 5), // Different user ID
                async (title, description, missionDate, status, differentUserId) => {
                    // Create report data
                    const reportData = {
                        title: title.trim(),
                        description: description.trim(),
                        missionDate: missionDate.toISOString().split('T')[0],
                        status: status
                    };

                    // Create the report (as user_001)
                    const createResult = await reportsService.createReport(reportData);
                    expect(createResult.success).toBe(true);
                    
                    const reportId = createResult.report.id;
                    const authorId = createResult.report.authorId;
                    
                    // Ensure different user ID is actually different
                    const nonAuthorId = differentUserId === authorId ? `${differentUserId}_different` : differentUserId;
                    
                    // Try to delete as a different user (should fail)
                    const nonAuthorDeleteResult = await reportsService.deleteReport(reportId, nonAuthorId);
                    expect(nonAuthorDeleteResult.success).toBe(false);
                    expect(nonAuthorDeleteResult.message).toBe('Você não tem permissão para excluir este relatório');
                    
                    // Verify report still exists
                    const reportStillExists = await reportsService.getReport(reportId);
                    expect(reportStillExists).not.toBeNull();
                    expect(reportStillExists.id).toBe(reportId);
                    
                    // Try to delete as the author (should succeed)
                    const authorDeleteResult = await reportsService.deleteReport(reportId, authorId);
                    expect(authorDeleteResult.success).toBe(true);
                    expect(authorDeleteResult.message).toBe('Relatório excluído com sucesso!');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 6: Report ownership - non-existent report handling', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5), // Random report ID
                fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length >= 5), // Random user ID
                async (fakeReportId, userId) => {
                    // Try to edit non-existent report
                    const editResult = await reportsService.updateReport(
                        fakeReportId,
                        {
                            title: 'Updated Title',
                            description: 'Updated description',
                            missionDate: '2024-12-01',
                            status: 'completed'
                        },
                        userId
                    );
                    expect(editResult.success).toBe(false);
                    expect(editResult.message).toBe('Relatório não encontrado');
                    
                    // Try to delete non-existent report
                    const deleteResult = await reportsService.deleteReport(fakeReportId, userId);
                    expect(deleteResult.success).toBe(false);
                    expect(deleteResult.message).toBe('Relatório não encontrado');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 9: Report chronological ordering
     * For any list of reports displayed to a user, they should be ordered by creation date with most recent first
     * Feature: simple-login-auth, Property 9: Report chronological ordering
     * Validates: Requirements 6.4
     */
    test('Property 9: Report chronological ordering', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 2, max: 10 }), // Number of reports to create
                async (numReports) => {
                    // Create multiple reports with different timestamps
                    const createdReports = [];
                    
                    for (let i = 0; i < numReports; i++) {
                        // Add small delay to ensure different timestamps
                        if (i > 0) {
                            await new Promise(resolve => setTimeout(resolve, 10));
                        }
                        
                        const reportData = {
                            title: `Test Report ${i}`,
                            description: `This is test report number ${i} with sufficient description length.`,
                            missionDate: '2024-12-01',
                            status: 'completed'
                        };
                        
                        const result = await reportsService.createReport(reportData);
                        expect(result.success).toBe(true);
                        createdReports.push(result.report);
                    }
                    
                    // Load reports for the user
                    const userReports = await reportsService.loadReports('user_001');
                    
                    // Filter to only the reports we just created
                    const testReports = userReports.filter(report => 
                        createdReports.some(created => created.id === report.id)
                    );
                    
                    // Verify we have all the reports we created
                    expect(testReports.length).toBe(numReports);
                    
                    // Verify chronological ordering (most recent first)
                    for (let i = 0; i < testReports.length - 1; i++) {
                        const currentDate = new Date(testReports[i].createdAt);
                        const nextDate = new Date(testReports[i + 1].createdAt);
                        
                        // Current report should be newer than or equal to the next one
                        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
                    }
                    
                    // Verify that the most recent report is first
                    const sortedByDate = [...testReports].sort((a, b) => 
                        new Date(b.createdAt) - new Date(a.createdAt)
                    );
                    
                    for (let i = 0; i < testReports.length; i++) {
                        expect(testReports[i].id).toBe(sortedByDate[i].id);
                    }
                }
            ),
            { numRuns: 50 }
        );
    });

    test('Property 9: Report chronological ordering - mixed creation times', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.date({ min: new Date('2020-01-01'), max: new Date() }), { minLength: 3, maxLength: 8 }),
                async (dates) => {
                    // Create reports with specific timestamps by mocking Date.now()
                    const originalNow = Date.now;
                    const createdReports = [];
                    
                    try {
                        for (let i = 0; i < dates.length; i++) {
                            // Mock Date.now to return our specific timestamp
                            Date.now = () => dates[i].getTime();
                            
                            const reportData = {
                                title: `Timed Report ${i}`,
                                description: `This is a timed report with timestamp ${dates[i].toISOString()}.`,
                                missionDate: '2024-12-01',
                                status: 'completed'
                            };
                            
                            const result = await reportsService.createReport(reportData);
                            expect(result.success).toBe(true);
                            createdReports.push(result.report);
                        }
                    } finally {
                        // Restore original Date.now
                        Date.now = originalNow;
                    }
                    
                    // Load reports for the user
                    const userReports = await reportsService.loadReports('user_001');
                    
                    // Filter to only the reports we just created
                    const testReports = userReports.filter(report => 
                        createdReports.some(created => created.id === report.id)
                    );
                    
                    // Verify chronological ordering (most recent first)
                    for (let i = 0; i < testReports.length - 1; i++) {
                        const currentDate = new Date(testReports[i].createdAt);
                        const nextDate = new Date(testReports[i + 1].createdAt);
                        
                        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
                    }
                }
            ),
            { numRuns: 30 }
        );
    });

    test('Property 9: Report chronological ordering - empty list handling', async () => {
        // Test with a fresh service instance to ensure empty state
        const freshService = new ReportsService();
        
        const userReports = await freshService.loadReports('nonexistent_user');
        
        // Empty list should be returned and should be properly ordered (trivially true)
        expect(Array.isArray(userReports)).toBe(true);
        expect(userReports.length).toBe(0);
    });

    test('Property 9: Report chronological ordering - single report', async () => {
        const reportData = {
            title: 'Single Report Test',
            description: 'Testing chronological ordering with a single report.',
            missionDate: '2024-12-01',
            status: 'completed'
        };
        
        const result = await reportsService.createReport(reportData);
        expect(result.success).toBe(true);
        
        const userReports = await reportsService.loadReports('user_001');
        const singleReport = userReports.filter(r => r.id === result.report.id);
        
        // Single report list should be properly ordered (trivially true)
        expect(singleReport.length).toBe(1);
        expect(singleReport[0].id).toBe(result.report.id);
    });
});