// Team Management Service Module
// Handles team hierarchy, permissions, and leader access to team reports

class TeamsService {
    constructor() {
        this.dataLoader = new DataLoader();
    }

    // Load team members for a specific team
    async loadTeamMembers(teamId) {
        try {
            const teams = await this.dataLoader.loadTeams();
            const users = await this.dataLoader.loadUsers();
            
            const team = teams[teamId];
            if (!team) {
                return {
                    success: false,
                    message: 'Equipe não encontrada',
                    members: []
                };
            }

            // Get detailed member information
            const members = team.members.map(memberId => {
                const user = Object.values(users).find(u => u.id === memberId);
                return user ? {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    role: user.role,
                    team: user.team
                } : null;
            }).filter(member => member !== null);

            // Get leader information
            const leader = Object.values(users).find(u => u.id === team.leaderId);
            
            return {
                success: true,
                team: {
                    id: team.id,
                    name: team.name,
                    leader: leader ? {
                        id: leader.id,
                        name: leader.name,
                        username: leader.username
                    } : null
                },
                members: members
            };
        } catch (error) {
            console.error('Error loading team members:', error);
            return {
                success: false,
                message: 'Erro ao carregar membros da equipe',
                members: []
            };
        }
    }

    // Check permissions for team access
    async checkPermissions(userId, targetUserId = null, action = 'view') {
        try {
            const users = await this.dataLoader.loadUsers();
            const teams = await this.dataLoader.loadTeams();
            
            const currentUser = Object.values(users).find(u => u.id === userId);
            if (!currentUser) {
                return {
                    hasPermission: false,
                    reason: 'Usuário não encontrado'
                };
            }

            // If checking own permissions, always allow
            if (!targetUserId || targetUserId === userId) {
                return {
                    hasPermission: true,
                    reason: 'Acesso próprio'
                };
            }

            // Check if user is a team leader
            if (currentUser.role !== 'leader') {
                return {
                    hasPermission: false,
                    reason: 'Usuário não é líder de equipe'
                };
            }

            // Find the team where current user is leader
            const leaderTeam = Object.values(teams).find(team => team.leaderId === userId);
            if (!leaderTeam) {
                return {
                    hasPermission: false,
                    reason: 'Usuário não lidera nenhuma equipe'
                };
            }

            // Check if target user is in the leader's team
            const targetUser = Object.values(users).find(u => u.id === targetUserId);
            if (!targetUser) {
                return {
                    hasPermission: false,
                    reason: 'Usuário alvo não encontrado'
                };
            }

            const isInTeam = leaderTeam.members.includes(targetUserId);
            if (!isInTeam) {
                return {
                    hasPermission: false,
                    reason: 'Usuário não está na sua equipe'
                };
            }

            return {
                hasPermission: true,
                reason: 'Líder tem acesso aos membros da equipe',
                teamId: leaderTeam.id,
                teamName: leaderTeam.name
            };
        } catch (error) {
            console.error('Error checking permissions:', error);
            return {
                hasPermission: false,
                reason: 'Erro interno do sistema'
            };
        }
    }

    // Get team reports for leaders
    async getTeamReports(leaderId) {
        try {
            const users = await this.dataLoader.loadUsers();
            const teams = await this.dataLoader.loadTeams();
            
            const leader = Object.values(users).find(u => u.id === leaderId);
            if (!leader || leader.role !== 'leader') {
                return {
                    success: false,
                    message: 'Usuário não é líder de equipe',
                    reports: []
                };
            }

            // Find the team where user is leader
            const leaderTeam = Object.values(teams).find(team => team.leaderId === leaderId);
            if (!leaderTeam) {
                return {
                    success: false,
                    message: 'Usuário não lidera nenhuma equipe',
                    reports: []
                };
            }

            // Get reports service to load all reports
            const reportsService = new ReportsService();
            const allReports = await reportsService.getAllReports();
            
            // Filter reports from team members
            const teamReports = Object.values(allReports).filter(report => 
                leaderTeam.members.includes(report.authorId)
            );

            // Sort by creation date (most recent first)
            teamReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Add author information to each report
            const reportsWithAuthors = teamReports.map(report => {
                const author = Object.values(users).find(u => u.id === report.authorId);
                return {
                    ...report,
                    authorName: author ? author.name : report.authorName || 'Usuário desconhecido'
                };
            });

            return {
                success: true,
                team: {
                    id: leaderTeam.id,
                    name: leaderTeam.name
                },
                reports: reportsWithAuthors,
                totalReports: reportsWithAuthors.length
            };
        } catch (error) {
            console.error('Error getting team reports:', error);
            return {
                success: false,
                message: 'Erro ao carregar relatórios da equipe',
                reports: []
            };
        }
    }

    // Get team hierarchy for a user
    async getTeamHierarchy(userId) {
        try {
            const users = await this.dataLoader.loadUsers();
            const teams = await this.dataLoader.loadTeams();
            
            const user = Object.values(users).find(u => u.id === userId);
            if (!user) {
                return {
                    success: false,
                    message: 'Usuário não encontrado'
                };
            }

            let hierarchy = {
                user: {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    team: user.team
                },
                isLeader: user.role === 'leader',
                leadsTeam: null,
                belongsToTeam: null,
                teamLeader: null
            };

            // If user is a leader, find their team
            if (user.role === 'leader') {
                const leaderTeam = Object.values(teams).find(team => team.leaderId === userId);
                if (leaderTeam) {
                    const members = leaderTeam.members.map(memberId => {
                        const member = Object.values(users).find(u => u.id === memberId);
                        return member ? {
                            id: member.id,
                            name: member.name,
                            username: member.username,
                            role: member.role
                        } : null;
                    }).filter(member => member !== null);

                    hierarchy.leadsTeam = {
                        id: leaderTeam.id,
                        name: leaderTeam.name,
                        members: members,
                        memberCount: members.length
                    };
                }
            }

            // Find the team the user belongs to (if any)
            if (user.team) {
                const userTeam = teams[user.team];
                if (userTeam) {
                    const teamLeader = Object.values(users).find(u => u.id === userTeam.leaderId);
                    
                    hierarchy.belongsToTeam = {
                        id: userTeam.id,
                        name: userTeam.name
                    };
                    
                    if (teamLeader) {
                        hierarchy.teamLeader = {
                            id: teamLeader.id,
                            name: teamLeader.name,
                            username: teamLeader.username
                        };
                    }
                }
            }

            return {
                success: true,
                hierarchy: hierarchy
            };
        } catch (error) {
            console.error('Error getting team hierarchy:', error);
            return {
                success: false,
                message: 'Erro ao carregar hierarquia da equipe'
            };
        }
    }

    // Validate team hierarchy access
    async validateTeamAccess(leaderId, targetUserId) {
        try {
            const permissionCheck = await this.checkPermissions(leaderId, targetUserId, 'view');
            return permissionCheck;
        } catch (error) {
            console.error('Error validating team access:', error);
            return {
                hasPermission: false,
                reason: 'Erro interno do sistema'
            };
        }
    }

    // Get all teams (for admin purposes)
    async getAllTeams() {
        try {
            const teams = await this.dataLoader.loadTeams();
            const users = await this.dataLoader.loadUsers();
            
            const teamsWithDetails = Object.values(teams).map(team => {
                const leader = Object.values(users).find(u => u.id === team.leaderId);
                const members = team.members.map(memberId => {
                    const member = Object.values(users).find(u => u.id === memberId);
                    return member ? {
                        id: member.id,
                        name: member.name,
                        username: member.username
                    } : null;
                }).filter(member => member !== null);

                return {
                    id: team.id,
                    name: team.name,
                    leader: leader ? {
                        id: leader.id,
                        name: leader.name,
                        username: leader.username
                    } : null,
                    members: members,
                    memberCount: members.length,
                    createdAt: team.createdAt
                };
            });

            return {
                success: true,
                teams: teamsWithDetails
            };
        } catch (error) {
            console.error('Error getting all teams:', error);
            return {
                success: false,
                message: 'Erro ao carregar equipes',
                teams: []
            };
        }
    }
}

// Export for use in other modules
window.TeamsService = TeamsService;