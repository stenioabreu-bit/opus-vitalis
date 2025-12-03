// Team Service Module
// Handles team management and hierarchy

class TeamService {
    constructor() {
        this.dataLoader = new DataLoader();
    }

    // Load team members for a user
    async loadTeamMembers(userId) {
        try {
            const teams = await this.dataLoader.loadTeams();
            const users = await this.dataLoader.loadUsers();
            
            // Find user's team
            const userTeam = Object.values(teams).find(team => 
                team.members.includes(userId) || team.leaderId === userId
            );
            
            if (!userTeam) {
                return [];
            }
            
            // Get all team members
            return userTeam.members.map(memberId => 
                Object.values(users).find(user => user.id === memberId)
            ).filter(Boolean);
            
        } catch (error) {
            console.error('Error loading team members:', error);
            return [];
        }
    }

    // Check if user is team leader
    async isTeamLeader(userId) {
        try {
            const teams = await this.dataLoader.loadTeams();
            return Object.values(teams).some(team => team.leaderId === userId);
        } catch (error) {
            console.error('Error checking team leadership:', error);
            return false;
        }
    }

    // Get team reports for leaders (placeholder)
    async getTeamReports(userId) {
        try {
            const isLeader = await this.isTeamLeader(userId);
            if (!isLeader) {
                return [];
            }
            
            // This will be implemented in later tasks
            console.log('getTeamReports called for leader:', userId);
            return [];
        } catch (error) {
            console.error('Error loading team reports:', error);
            return [];
        }
    }

    // Check permissions (placeholder)
    async checkPermissions(userId, action, targetId) {
        // This will be implemented in later tasks
        console.log('checkPermissions called:', userId, action, targetId);
        return false;
    }
}

// Export for use in other modules
window.TeamService = TeamService;