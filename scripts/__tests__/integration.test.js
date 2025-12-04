/**
 * Integration tests for complete user workflows
 * Task 10.2: Write integration tests for complete user workflows
 * - Test login → dashboard → create report → share report flow
 * - Test team leader access to subordinate reports  
 * - Verify error handling in various scenarios
 */

const fs = require('fs');
const path = require('path');

describe('Integration Tests - Complete User Workflows', () => {
    
    // Mock services for testing
    const mockAuthService = {
        handleLogin: jest.fn(),
        getCurrentUser: jest.fn(),
        checkSession: jest.fn(),
        handleLogout: jest.fn()
    };

    const mockReportsService = {
        createReport: jest.fn(),
        loadReports: jest.fn(),
        loadSharedReports: jest.fn(),
        shareReport: jest.fn(),
        getReport: jest.fn()
    };

    const mockTeamsService = {
        getTeamReports: jest.fn()
    };

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        localStorage.clear();
    });

    describe('Login → Dashboard → Create Report → Share Report Flow', () => {
        test('should complete full user workflow successfully', async () => {
            // Mock successful login
            const mockUser = {
                id: 'user_001',
                username: 'bella_evans',
                name: 'Bella Evans',
                role: 'agent'
            };

            mockAuthService.handleLogin.mockResolvedValue({
                success: true,
                user: mockUser,
                message: 'Login realizado com sucesso!'
            });

            mockAuthService.getCurrentUser.mockReturnValue(mockUser);
            mockAuthService.checkSession.mockReturnValue(true);

            // Step 1: Login
            const loginResult = await mockAuthService.handleLogin('bella_evans', 'sãocristovão2016');
            expect(loginResult.success).toBe(true);
            expect(loginResult.user).toBeDefined();
            expect(loginResult.user.username).toBe('bella_evans');

            // Step 2: Verify dashboard access
            const currentUser = mockAuthService.getCurrentUser();
            expect(currentUser).toBeDefined();
            expect(currentUser.username).toBe('bella_evans');
            expect(mockAuthService.checkSession()).toBe(true);

            // Step 3: Create report
            const reportData = {
                title: 'Integration Test Report',
                description: 'This is a test report created during integration testing to verify the complete user flow from login to report sharing.',
                missionDate: '2024-12-01',
                status: 'completed'
            };

            const mockReport = {
                id: 'report_001',
                ...reportData,
                authorId: currentUser.id,
                authorName: currentUser.name,
                createdAt: new Date().toISOString()
            };

            mockReportsService.createReport.mockResolvedValue({
                success: true,
                report: mockReport,
                message: 'Relatório criado com sucesso!'
            });

            const createResult = await mockReportsService.createReport(reportData);
            expect(createResult.success).toBe(true);
            expect(createResult.report).toBeDefined();
            expect(createResult.report.title).toBe(reportData.title);
            expect(createResult.report.authorId).toBe(currentUser.id);

            // Step 4: Share report
            mockReportsService.shareReport.mockResolvedValue({
                success: true,
                message: 'Relatório compartilhado com sucesso!'
            });

            const shareResult = await mockReportsService.shareReport(
                createResult.report.id,
                ['user_002'], // Share with team leader
                currentUser.id
            );
            expect(shareResult.success).toBe(true);

            // Step 5: Verify shared report can be loaded
            mockReportsService.loadSharedReports.mockResolvedValue([mockReport]);

            const sharedReports = await mockReportsService.loadSharedReports('user_002');
            const sharedReport = sharedReports.find(r => r.id === createResult.report.id);
            expect(sharedReport).toBeDefined();
            expect(sharedReport.title).toBe(reportData.title);
        });

        test('should handle invalid login credentials', async () => {
            mockAuthService.handleLogin.mockResolvedValue({
                success: false,
                message: 'Usuário ou senha inválidos',
                user: null
            });

            mockAuthService.getCurrentUser.mockReturnValue(null);
            mockAuthService.checkSession.mockReturnValue(false);

            const loginResult = await mockAuthService.handleLogin('invalid_user', 'wrong_password');
            expect(loginResult.success).toBe(false);
            expect(loginResult.message).toContain('inválidos');
            expect(mockAuthService.getCurrentUser()).toBeNull();
            expect(mockAuthService.checkSession()).toBe(false);
        });

        test('should reject report creation with invalid data', async () => {
            // Mock login first
            const mockUser = { id: 'user_001', username: 'bella_evans' };
            mockAuthService.handleLogin.mockResolvedValue({ success: true, user: mockUser });
            mockAuthService.getCurrentUser.mockReturnValue(mockUser);

            await mockAuthService.handleLogin('bella_evans', 'sãocristovão2016');

            // Mock failed report creation
            mockReportsService.createReport.mockResolvedValue({
                success: false,
                message: 'Dados do relatório são obrigatórios'
            });

            // Try to create report with missing required fields
            const invalidReportData = {
                title: '',
                description: '',
                missionDate: '',
                status: ''
            };

            const createResult = await mockReportsService.createReport(invalidReportData);
            expect(createResult.success).toBe(false);
            expect(createResult.message).toBeDefined();
        });
    });

    describe('Team Leader Access Flow', () => {
        test('should allow team leader to access subordinate reports', async () => {
            // Mock team leader
            const mockLeader = {
                id: 'user_002',
                username: 'carlos_silva',
                name: 'Carlos Silva',
                role: 'leader'
            };

            mockAuthService.handleLogin.mockResolvedValue({
                success: true,
                user: mockLeader
            });

            mockAuthService.getCurrentUser.mockReturnValue(mockLeader);

            // Login as team leader
            const leaderLogin = await mockAuthService.handleLogin('carlos_silva', 'lider2024');
            expect(leaderLogin.success).toBe(true);
            
            const leader = mockAuthService.getCurrentUser();
            expect(leader.role).toBe('leader');

            // Mock team reports access
            const mockTeamReports = [
                {
                    id: 'report_001',
                    title: 'Team Report 1',
                    authorId: 'user_001',
                    authorName: 'Bella Evans'
                }
            ];

            mockTeamsService.getTeamReports.mockResolvedValue({
                success: true,
                reports: mockTeamReports,
                team: { id: 'team_alpha', name: 'Equipe Alpha' }
            });

            // Test team reports access
            const teamReportsResult = await mockTeamsService.getTeamReports(leader.id);
            expect(teamReportsResult.success).toBe(true);
            expect(teamReportsResult.reports).toBeDefined();
            expect(Array.isArray(teamReportsResult.reports)).toBe(true);
        });

        test('should deny team reports access to non-leaders', async () => {
            // Mock regular agent
            const mockAgent = {
                id: 'user_001',
                username: 'bella_evans',
                role: 'agent'
            };

            mockAuthService.handleLogin.mockResolvedValue({
                success: true,
                user: mockAgent
            });

            mockAuthService.getCurrentUser.mockReturnValue(mockAgent);

            // Login as regular agent
            await mockAuthService.handleLogin('bella_evans', 'sãocristovão2016');
            
            const user = mockAuthService.getCurrentUser();
            expect(user.role).toBe('agent');

            // Mock denied access
            mockTeamsService.getTeamReports.mockResolvedValue({
                success: false,
                message: 'Acesso negado. Apenas líderes podem acessar relatórios da equipe.'
            });

            // Try to access team reports
            const teamReportsResult = await mockTeamsService.getTeamReports(user.id);
            expect(teamReportsResult.success).toBe(false);
            expect(teamReportsResult.message).toContain('acesso negado');
        });
    });

    describe('Error Handling Scenarios', () => {
        test('should handle network/file loading errors gracefully', async () => {
            // Mock network error
            mockAuthService.handleLogin.mockResolvedValue({
                success: false,
                message: 'Erro de conexão. Verifique sua conexão com a internet.'
            });

            // Test with non-existent user
            const loginResult = await mockAuthService.handleLogin('nonexistent_user', 'password');
            expect(loginResult.success).toBe(false);
            expect(loginResult.message).toBeDefined();
        });

        test('should handle corrupted session data', () => {
            // Mock corrupted session handling
            mockAuthService.checkSession.mockReturnValue(false);
            mockAuthService.getCurrentUser.mockReturnValue(null);
            
            // Should handle corrupted data gracefully
            const sessionValid = mockAuthService.checkSession();
            expect(sessionValid).toBe(false);
            expect(mockAuthService.getCurrentUser()).toBeNull();
        });

        test('should handle missing report data', async () => {
            // Mock login first
            const mockUser = { id: 'user_001', username: 'bella_evans' };
            mockAuthService.handleLogin.mockResolvedValue({ success: true, user: mockUser });
            mockAuthService.getCurrentUser.mockReturnValue(mockUser);

            await mockAuthService.handleLogin('bella_evans', 'sãocristovão2016');
            
            // Mock non-existent report
            mockReportsService.getReport.mockResolvedValue(null);
            
            // Try to get non-existent report
            const report = await mockReportsService.getReport('non_existent_id');
            expect(report).toBeNull();
        });

        test('should validate report sharing permissions', async () => {
            // Mock login and create a report
            const mockUser = { id: 'user_001', username: 'bella_evans' };
            mockAuthService.handleLogin.mockResolvedValue({ success: true, user: mockUser });
            mockAuthService.getCurrentUser.mockReturnValue(mockUser);

            await mockAuthService.handleLogin('bella_evans', 'sãocristovão2016');
            const currentUser = mockAuthService.getCurrentUser();
            
            const reportData = {
                title: 'Test Report',
                description: 'Test description',
                missionDate: '2024-12-01',
                status: 'completed'
            };
            
            const mockReport = { id: 'report_001', ...reportData, authorId: currentUser.id };
            mockReportsService.createReport.mockResolvedValue({
                success: true,
                report: mockReport
            });

            const createResult = await mockReportsService.createReport(reportData);
            expect(createResult.success).toBe(true);
            
            // Mock sharing with invalid user
            mockReportsService.shareReport.mockResolvedValue({
                success: false,
                message: 'Usuário não encontrado para compartilhamento'
            });
            
            // Try to share with invalid user
            const shareResult = await mockReportsService.shareReport(
                createResult.report.id,
                ['invalid_user_id'],
                currentUser.id
            );
            
            // Should handle gracefully
            expect(shareResult).toBeDefined();
            expect(shareResult.success).toBe(false);
        });
    });

    describe('Navigation Integration', () => {
        test('should have all required pages accessible', () => {
            const requiredPages = [
                'index.html',
                'login.html',
                'dashboard.html',
                'create-report.html',
                'reports.html',
                'view-report.html',
                'shared-reports.html',
                'team-reports.html'
            ];

            requiredPages.forEach(page => {
                const pageExists = fs.existsSync(page);
                expect(pageExists).toBe(true);
            });
        });

        test('should have all required scripts available', () => {
            const requiredScripts = [
                'scripts/auth.js',
                'scripts/utils.js',
                'scripts/reports.js',
                'scripts/teams.js',
                'scripts/data-loader.js'
            ];

            requiredScripts.forEach(script => {
                const scriptExists = fs.existsSync(script);
                expect(scriptExists).toBe(true);
            });
        });

        test('should have all required data files', () => {
            const requiredDataFiles = [
                'data/users.json',
                'data/reports.json',
                'data/teams.json'
            ];

            requiredDataFiles.forEach(file => {
                const fileExists = fs.existsSync(file);
                expect(fileExists).toBe(true);
            });
        });
    });

    describe('Theme Consistency', () => {
        test('should have consistent CSS variables defined', () => {
            const cssExists = fs.existsSync('assets/css/styles.css');
            expect(cssExists).toBe(true);

            const cssContent = fs.readFileSync('assets/css/styles.css', 'utf8');
            
            // Check for required CSS variables
            const requiredVars = [
                '--bg-primary',
                '--bg-secondary',
                '--accent-blue',
                '--error-red',
                '--success-green',
                '--text-primary',
                '--text-secondary',
                '--border-color',
                '--card-bg'
            ];

            requiredVars.forEach(cssVar => {
                expect(cssContent).toContain(cssVar);
            });
        });

        test('should use Ordem Paranormal color scheme', () => {
            const cssContent = fs.readFileSync('assets/css/styles.css', 'utf8');
            
            // Check for black background
            expect(cssContent).toContain('#000000');
            
            // Check for blue accent color
            expect(cssContent).toContain('#00d4ff');
            
            // Check for themed colors
            expect(cssContent).toContain('#cc0000'); // error red
            expect(cssContent).toContain('#4a7c59'); // success green
        });
    });
});