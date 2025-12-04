// Property Test 8 Runner - Team Hierarchy Access
// Feature: simple-login-auth, Property 8: Team hierarchy access
// Validates: Requirements 8.1, 8.3

const fs = require('fs');
const path = require('path');

// Mock DOM and localStorage for Node.js environment
global.document = {
    createElement: () => ({ style: {}, innerHTML: '', textContent: '' }),
    getElementById: () => ({ style: {}, innerHTML: '', textContent: '', appendChild: () => {} }),
    addEventListener: () => {}
};

global.window = {
    location: { href: '' }
};

global.localStorage = {
    getItem: (key) => {
        const data = {
            'ordem_paranormal_session': JSON.stringify({
                id: 'user_005',
                username: 'maria_oliveira',
                name: 'Maria Oliveira',
                role: 'leader',
                team: 'team_beta'
            })
        };
        return data[key] || null;
    },
    setItem: () => {},
    removeItem: () => {}
};

// Load test data
function loadTestData() {
    try {
        const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'users.json'), 'utf8'));
        const teamsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'teams.json'), 'utf8'));
        const reportsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'reports.json'), 'utf8'));
        
        return { users: usersData, teams: teamsData, reports: reportsData };
    } catch (error) {
        console.error('Error loading test data:', error);
        return null;
    }
}

// Mock DataLoader class
class DataLoader {
    constructor() {
        this.testData = loadTestData();
    }

    async loadUsers() {
        return this.testData ? this.testData.users : {};
    }

    async loadTeams() {
        return this.testData ? this.testData.teams : {};
    }

    async loadReports() {
        return this.testData ? this.testData.reports : {};
    }
}

// Mock ReportsService class
class ReportsService {
    constructor() {
        this.dataLoader = new DataLoader();
    }

    async getAllReports() {
        return await this.dataLoader.loadReports();
    }
}

// Load and execute TeamsService
const teamsServiceCode = fs.readFileSync(path.join(__dirname, 'scripts', 'teams.js'), 'utf8');
// Remove window export and create class directly
const teamsServiceCodeModified = teamsServiceCode.replace('window.TeamsService = TeamsService;', '');
eval(teamsServiceCodeModified);

// Property Test 8 Implementation
class PropertyTest8 {
    constructor() {
        this.teamsService = new TeamsService();
        this.reportsService = new ReportsService();
        this.dataLoader = new DataLoader();
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
    }

    async runPropertyTest() {
        console.log('🧪 Starting Property Test 8: Team Hierarchy Access');
        console.log('Property: For any team leader, they should have read access to all reports created by their team members');
        console.log('Validates: Requirements 8.1, 8.3\n');

        try {
            // Load test data
            const users = await this.dataLoader.loadUsers();
            const teams = await this.dataLoader.loadTeams();
            
            if (!users || !teams) {
                throw new Error('Failed to load test data');
            }

            console.log(`Loaded ${Object.keys(users).length} users and ${Object.keys(teams).length} teams\n`);

            // Run property tests with different scenarios
            await this.testLeaderAccessToTeamReports(users, teams);
            await this.testNonLeaderAccessRestriction(users, teams);
            await this.testLeaderAccessToOtherTeamReports(users, teams);
            await this.testEmptyTeamScenario(users, teams);

            // Show final results
            this.showTestSummary();

        } catch (error) {
            console.error(`❌ Test execution failed: ${error.message}`);
            return false;
        }
    }

    async testLeaderAccessToTeamReports(users, teams) {
        console.log('📋 Test 1: Leaders should have access to their team members\' reports');

        const leaders = Object.values(users).filter(user => user.role === 'leader');
        console.log(`Found ${leaders.length} leaders to test`);
        
        for (const leader of leaders) {
            // Find the team this leader leads
            const leaderTeam = Object.values(teams).find(team => team.leaderId === leader.id);
            
            if (!leaderTeam) {
                this.recordTest(
                    `Leader ${leader.name} has no team to lead`,
                    true,
                    'Leader without team is valid scenario'
                );
                continue;
            }

            console.log(`Testing leader ${leader.name} with team ${leaderTeam.name} (${leaderTeam.members.length} members)`);

            // Test access to team reports
            const teamReportsResult = await this.teamsService.getTeamReports(leader.id);
            
            if (!teamReportsResult.success) {
                this.recordTest(
                    `Leader ${leader.name} failed to access team reports: ${teamReportsResult.message}`,
                    false,
                    'Leaders should be able to access team reports'
                );
                continue;
            }

            // Verify that all returned reports are from team members
            const teamMemberIds = leaderTeam.members;
            const invalidReports = teamReportsResult.reports.filter(report => 
                !teamMemberIds.includes(report.authorId)
            );

            if (invalidReports.length > 0) {
                this.recordTest(
                    `Leader ${leader.name} received reports from non-team members`,
                    false,
                    'Team reports should only include reports from team members'
                );
            } else {
                this.recordTest(
                    `Leader ${leader.name} correctly accessed ${teamReportsResult.reports.length} team reports`,
                    true,
                    'Leader has proper access to team reports'
                );
            }

            // Test individual permission checks for each team member
            for (const memberId of teamMemberIds) {
                const permissionCheck = await this.teamsService.checkPermissions(leader.id, memberId, 'view');
                
                if (!permissionCheck.hasPermission) {
                    this.recordTest(
                        `Leader ${leader.name} denied access to team member ${memberId}: ${permissionCheck.reason}`,
                        false,
                        'Leaders should have permission to access team member data'
                    );
                } else {
                    this.recordTest(
                        `Leader ${leader.name} has permission to access team member ${memberId}`,
                        true,
                        'Leader permission check passed'
                    );
                }
            }
        }
        console.log('');
    }

    async testNonLeaderAccessRestriction(users, teams) {
        console.log('🚫 Test 2: Non-leaders should not have team leader permissions');

        const agents = Object.values(users).filter(user => user.role === 'agent');
        console.log(`Found ${agents.length} agents to test`);
        
        for (const agent of agents) {
            // Test that agents cannot access team reports as leaders
            const teamReportsResult = await this.teamsService.getTeamReports(agent.id);
            
            if (teamReportsResult.success) {
                this.recordTest(
                    `Agent ${agent.name} incorrectly gained access to team reports`,
                    false,
                    'Only leaders should access team reports'
                );
            } else {
                this.recordTest(
                    `Agent ${agent.name} correctly denied team reports access`,
                    true,
                    'Non-leaders should be denied team leader functions'
                );
            }

            // Test permission checks - agents should not have leader permissions
            const otherUsers = Object.values(users).filter(u => u.id !== agent.id);
            if (otherUsers.length > 0) {
                const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
                const permissionCheck = await this.teamsService.checkPermissions(agent.id, randomUser.id, 'view');
                
                if (permissionCheck.hasPermission && permissionCheck.reason !== 'Acesso próprio') {
                    this.recordTest(
                        `Agent ${agent.name} incorrectly has leader permissions over ${randomUser.name}`,
                        false,
                        'Agents should not have leader permissions'
                    );
                } else {
                    this.recordTest(
                        `Agent ${agent.name} correctly denied leader permissions`,
                        true,
                        'Non-leaders should not have team access permissions'
                    );
                }
            }
        }
        console.log('');
    }

    async testLeaderAccessToOtherTeamReports(users, teams) {
        console.log('🔒 Test 3: Leaders should not have access to other teams\' reports');

        const leaders = Object.values(users).filter(user => user.role === 'leader');
        
        for (let i = 0; i < leaders.length; i++) {
            const leader = leaders[i];
            const leaderTeam = Object.values(teams).find(team => team.leaderId === leader.id);
            
            if (!leaderTeam) continue;

            // Find users from other teams
            const otherTeamMembers = Object.values(users).filter(user => 
                user.team && user.team !== leaderTeam.id && !leaderTeam.members.includes(user.id)
            );

            console.log(`Testing leader ${leader.name} access to ${otherTeamMembers.length} other team members`);

            for (const otherMember of otherTeamMembers) {
                const permissionCheck = await this.teamsService.checkPermissions(leader.id, otherMember.id, 'view');
                
                if (permissionCheck.hasPermission) {
                    this.recordTest(
                        `Leader ${leader.name} incorrectly has access to ${otherMember.name} from another team`,
                        false,
                        'Leaders should only access their own team members'
                    );
                } else {
                    this.recordTest(
                        `Leader ${leader.name} correctly denied access to ${otherMember.name} from another team`,
                        true,
                        'Leaders should not access other teams'
                    );
                }
            }
        }
        console.log('');
    }

    async testEmptyTeamScenario(users, teams) {
        console.log('🔍 Test 4: Handle edge cases with empty teams and self-access');

        const leaders = Object.values(users).filter(user => user.role === 'leader');
        
        for (const leader of leaders) {
            const leaderTeam = Object.values(teams).find(team => team.leaderId === leader.id);
            
            if (leaderTeam && leaderTeam.members.length === 0) {
                // Test empty team scenario
                const teamReportsResult = await this.teamsService.getTeamReports(leader.id);
                
                if (!teamReportsResult.success) {
                    this.recordTest(
                        `Leader ${leader.name} with empty team failed to get team reports: ${teamReportsResult.message}`,
                        false,
                        'Leaders with empty teams should still get successful (but empty) results'
                    );
                } else if (teamReportsResult.reports.length > 0) {
                    this.recordTest(
                        `Leader ${leader.name} with empty team incorrectly received ${teamReportsResult.reports.length} reports`,
                        false,
                        'Empty teams should return no reports'
                    );
                } else {
                    this.recordTest(
                        `Leader ${leader.name} with empty team correctly received 0 reports`,
                        true,
                        'Empty teams should return empty results'
                    );
                }
            }
        }

        // Test self-access (should always be allowed)
        const allUsers = Object.values(users);
        console.log(`Testing self-access for ${allUsers.length} users`);
        
        for (const user of allUsers) {
            const selfPermissionCheck = await this.teamsService.checkPermissions(user.id, user.id, 'view');
            
            if (!selfPermissionCheck.hasPermission) {
                this.recordTest(
                    `User ${user.name} denied self-access: ${selfPermissionCheck.reason}`,
                    false,
                    'Users should always have access to their own data'
                );
            } else {
                this.recordTest(
                    `User ${user.name} correctly has self-access`,
                    true,
                    'Self-access should always be allowed'
                );
            }
        }
        console.log('');
    }

    recordTest(description, passed, expected) {
        this.totalTests++;
        if (passed) {
            this.passedTests++;
        }

        const result = {
            description,
            passed,
            expected,
            timestamp: new Date().toISOString()
        };

        this.testResults.push(result);
        
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`  ${status}: ${description}`);
        if (!passed) {
            console.log(`    Expected: ${expected}`);
        }
    }

    showTestSummary() {
        const passed = this.passedTests === this.totalTests;
        
        console.log('='.repeat(80));
        console.log(`📊 PROPERTY TEST 8 RESULTS: ${this.passedTests}/${this.totalTests} tests passed`);
        console.log('='.repeat(80));
        
        if (passed) {
            console.log('✅ Property 8 PASSED: Team hierarchy access is working correctly');
            console.log('   All team leaders have proper access to their team members\' reports');
            console.log('   Non-leaders are correctly restricted from team leader functions');
            console.log('   Cross-team access is properly prevented');
        } else {
            console.log('❌ Property 8 FAILED: Team hierarchy access has issues');
            console.log('   Some team access controls are not working as expected');
            
            const failedTests = this.testResults.filter(test => !test.passed);
            console.log(`\n🔍 Failed tests (${failedTests.length}):`);
            failedTests.forEach(test => {
                console.log(`   • ${test.description}`);
                console.log(`     Expected: ${test.expected}`);
            });
        }
        
        return passed;
    }
}

// Run the test
async function runTest() {
    const test = new PropertyTest8();
    const result = await test.runPropertyTest();
    process.exit(result ? 0 : 1);
}

// Execute if run directly
if (require.main === module) {
    runTest().catch(error => {
        console.error('Test runner error:', error);
        process.exit(1);
    });
}

module.exports = PropertyTest8;