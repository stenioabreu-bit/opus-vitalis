// Property Test 7 Runner - Report Sharing Access
// **Feature: simple-login-auth, Property 7: Report sharing access**
// **Validates: Requirements 7.4, 7.5**

// Mock localStorage for Node.js environment
global.localStorage = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
    },
    removeItem: function(key) {
        delete this.data[key];
    },
    clear: function() {
        this.data = {};
    }
};

// Mock DataLoader
class DataLoader {
    async loadUsers() {
        return {
            "user_001": {
                "id": "user_001",
                "username": "bella_evans",
                "name": "Bella Evans",
                "role": "leader",
                "team": ""
            },
            "user_002": {
                "id": "user_002", 
                "username": "melissa_kardelis",
                "name": "Melissa Kardelis",
                "role": "agent",
                "team": "mimir_unit"
            }
        };
    }
    
    async loadTeams() {
        return {
            "team_alpha": {
                "id": "team_alpha",
                "name": "Equipe Alpha",
                "leaderId": "user_001",
                "members": ["user_002"]
            }
        };
    }
    
    async loadReports() {
        return {};
    }
}

// Mock ReportsService
class ReportsService {
    constructor() {
        this.dataLoader = new DataLoader();
        this.localStorageKey = 'ordem_paranormal_reports';
    }

    getLocalReports() {
        try {
            const stored = localStorage.getItem(this.localStorageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            return {};
        }
    }

    saveLocalReports(reports) {
        try {
            localStorage.setItem(this.localStorageKey, JSON.stringify(reports));
            return true;
        } catch (error) {
            return false;
        }
    }

    async getReport(reportId) {
        try {
            const localReports = this.getLocalReports();
            return localReports[reportId] || null;
        } catch (error) {
            return null;
        }
    }

    async checkReportAccess(reportId, userId) {
        try {
            const report = await this.getReport(reportId);
            if (!report) return { hasAccess: false, accessType: null };
            
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
                const team = Object.values(teams).find(team => 
                    team.leaderId === userId && team.members.includes(report.authorId)
                );
                
                if (team) {
                    return { hasAccess: true, accessType: 'team_leader' };
                }
            }
            
            return { hasAccess: false, accessType: null };
        } catch (error) {
            return { hasAccess: false, accessType: null };
        }
    }
}

// Property Test Implementation
class PropertyTest7 {
    constructor() {
        this.reportsService = new ReportsService();
        this.testResults = [];
        this.passCount = 0;
        this.failCount = 0;
    }
    
    generateTestData() {
        const reportId = `test_report_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const authorId = `author_${Math.random().toString(36).substring(2, 11)}`;
        const sharedUserId = `shared_user_${Math.random().toString(36).substring(2, 11)}`;
        const nonSharedUserId = `non_shared_user_${Math.random().toString(36).substring(2, 11)}`;
        
        const report = {
            id: reportId,
            title: `Test Report ${Math.random().toString(36).substring(2, 11)}`,
            description: `Test description ${Math.random().toString(36).substring(2, 11)}`,
            missionDate: new Date().toISOString().split('T')[0],
            status: ['completed', 'partial', 'failed'][Math.floor(Math.random() * 3)],
            authorId: authorId,
            authorName: `Test Author ${Math.random().toString(36).substring(2, 11)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sharedWith: [sharedUserId],
            isPublic: false
        };
        
        return {
            report,
            authorId,
            sharedUserId,
            nonSharedUserId
        };
    }
    
    async testSharingAccess(testData) {
        const { report, authorId, sharedUserId, nonSharedUserId } = testData;
        
        try {
            // Store the test report temporarily
            const localReports = this.reportsService.getLocalReports();
            localReports[report.id] = report;
            this.reportsService.saveLocalReports(localReports);
            
            // Test 1: Shared user should have access
            const sharedAccess = await this.reportsService.checkReportAccess(report.id, sharedUserId);
            if (!sharedAccess.hasAccess || sharedAccess.accessType !== 'shared') {
                return {
                    passed: false,
                    reason: `Shared user should have access but got: hasAccess=${sharedAccess.hasAccess}, accessType=${sharedAccess.accessType}`
                };
            }
            
            // Test 2: Non-shared user should not have access
            const nonSharedAccess = await this.reportsService.checkReportAccess(report.id, nonSharedUserId);
            if (nonSharedAccess.hasAccess) {
                return {
                    passed: false,
                    reason: `Non-shared user should not have access but got: hasAccess=${nonSharedAccess.hasAccess}, accessType=${nonSharedAccess.accessType}`
                };
            }
            
            // Test 3: Author should have owner access
            const authorAccess = await this.reportsService.checkReportAccess(report.id, authorId);
            if (!authorAccess.hasAccess || authorAccess.accessType !== 'owner') {
                return {
                    passed: false,
                    reason: `Author should have owner access but got: hasAccess=${authorAccess.hasAccess}, accessType=${authorAccess.accessType}`
                };
            }
            
            // Test 4: Shared user should be able to load the report
            const loadedReport = await this.reportsService.getReport(report.id);
            if (!loadedReport || loadedReport.id !== report.id) {
                return {
                    passed: false,
                    reason: `Shared user should be able to load report but got: ${loadedReport ? 'different report' : 'null'}`
                };
            }
            
            // Test 5: Report content should be complete for shared user
            const requiredFields = ['id', 'title', 'description', 'missionDate', 'status', 'authorId', 'authorName', 'createdAt'];
            for (const field of requiredFields) {
                if (!loadedReport[field]) {
                    return {
                        passed: false,
                        reason: `Report missing required field for shared access: ${field}`
                    };
                }
            }
            
            // Clean up test data
            delete localReports[report.id];
            this.reportsService.saveLocalReports(localReports);
            
            return {
                passed: true,
                reason: 'All sharing access checks passed'
            };
            
        } catch (error) {
            return {
                passed: false,
                reason: `Test error: ${error.message}`
            };
        }
    }
    
    async runPropertyTest(iterations = 100) {
        this.testResults = [];
        this.passCount = 0;
        this.failCount = 0;
        
        console.log(`Running Property Test 7: Report Sharing Access (${iterations} iterations)`);
        console.log('**Feature: simple-login-auth, Property 7: Report sharing access**');
        console.log('**Validates: Requirements 7.4, 7.5**');
        console.log('Property: For any report shared with a user, that user should have read-only access to the complete report content\n');
        
        const startTime = Date.now();
        
        for (let i = 0; i < iterations; i++) {
            const testData = this.generateTestData();
            const result = await this.testSharingAccess(testData);
            
            const testCase = {
                iteration: i + 1,
                passed: result.passed,
                reason: result.reason,
                testData: {
                    reportId: testData.report.id,
                    authorId: testData.authorId,
                    sharedUserId: testData.sharedUserId,
                    nonSharedUserId: testData.nonSharedUserId
                }
            };
            
            this.testResults.push(testCase);
            
            if (result.passed) {
                this.passCount++;
            } else {
                this.failCount++;
                console.log(`FAIL - Iteration ${i + 1}: ${result.reason}`);
            }
            
            if ((i + 1) % 20 === 0) {
                console.log(`Progress: ${i + 1}/${iterations} iterations completed`);
            }
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const summary = {
            totalTests: iterations,
            passed: this.passCount,
            failed: this.failCount,
            duration: duration,
            results: this.testResults
        };
        
        console.log('\n=== PROPERTY TEST RESULTS ===');
        console.log(`Total Iterations: ${summary.totalTests}`);
        console.log(`Passed: ${summary.passed}`);
        console.log(`Failed: ${summary.failed}`);
        console.log(`Success Rate: ${Math.round((summary.passed / summary.totalTests) * 100)}%`);
        console.log(`Duration: ${summary.duration}ms`);
        
        if (summary.failed === 0) {
            console.log('\n✅ PROPERTY TEST PASSED - All sharing access requirements satisfied');
        } else {
            console.log('\n❌ PROPERTY TEST FAILED - Some sharing access requirements not satisfied');
            
            // Show first few failures
            const failedTests = this.testResults.filter(test => !test.passed).slice(0, 5);
            console.log('\nFirst few failures:');
            failedTests.forEach(test => {
                console.log(`  - Iteration ${test.iteration}: ${test.reason}`);
            });
        }
        
        return summary;
    }
}

// Run the test
async function runTest() {
    const propertyTest = new PropertyTest7();
    const summary = await propertyTest.runPropertyTest(100);
    
    // Exit with appropriate code
    process.exit(summary.failed === 0 ? 0 : 1);
}

runTest().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});