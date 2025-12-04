// User Management Service
// Handles user creation, editing, deletion, and management

class UserManager {
    constructor() {
        this.firebaseService = null;
        this.db = null;
        this.useFirebase = false;
        this.localStorageKey = 'opus_vitalis_users';
        this.usersCollection = 'usuarios';
    }

    // Initialize the user manager
    async init() {
        try {
            console.log('🔧 Initializing User Manager...');
            
            // Try to use Firebase first
            if (window.firebaseService) {
                await window.firebaseService.init();
                this.firebaseService = window.firebaseService;
                this.db = window.firebaseService.getDB();
                this.useFirebase = true;
                console.log('✅ User Manager using Firebase');
            } else {
                console.log('💾 User Manager using localStorage fallback');
                this.useFirebase = false;
            }
            
            // Migrate existing users if needed
            await this.migrateExistingUsers();
            
        } catch (error) {
            console.warn('⚠️ Firebase not available, using localStorage:', error);
            this.useFirebase = false;
        }
    }

    // Migrate existing users from data/users.json to the new system
    async migrateExistingUsers() {
        try {
            console.log('🔄 Checking for existing users to migrate...');
            
            // Load existing users from data/users.json
            const dataLoader = new DataLoader();
            const existingUsers = await dataLoader.loadUsers();
            
            if (Object.keys(existingUsers).length === 0) {
                console.log('ℹ️ No existing users found to migrate');
                return;
            }
            
            // Check if users are already migrated
            const currentUsers = await this.getAllUsers();
            if (currentUsers.length > 0) {
                console.log('ℹ️ Users already migrated');
                return;
            }
            
            console.log(`🔄 Migrating ${Object.keys(existingUsers).length} existing users...`);
            
            // Migrate each user
            for (const [username, userData] of Object.entries(existingUsers)) {
                const migratedUser = {
                    id: userData.id,
                    name: userData.name,
                    username: userData.username,
                    password: userData.password,
                    role: userData.role,
                    team: userData.team,
                    createdAt: userData.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    migrated: true
                };
                
                await this.saveUser(migratedUser);
                console.log(`✅ Migrated user: ${userData.name}`);
            }
            
            console.log('✅ User migration completed successfully');
            
        } catch (error) {
            console.error('❌ Error during user migration:', error);
        }
    }

    // Generate unique user ID
    generateUserId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 11);
        return `user_${timestamp}_${random}`;
    }

    // Create a new user
    async createUser(userData) {
        try {
            console.log('👤 Creating new user:', userData.username);
            
            // Validate required fields
            if (!userData.name || !userData.username || !userData.password || !userData.role) {
                return {
                    success: false,
                    message: 'Todos os campos obrigatórios devem ser preenchidos'
                };
            }
            
            // Check if username already exists
            const existingUsers = await this.getAllUsers();
            const usernameExists = existingUsers.some(user => user.username === userData.username);
            
            if (usernameExists) {
                return {
                    success: false,
                    message: 'Nome de usuário já existe'
                };
            }
            
            // Create user object
            const newUser = {
                id: this.generateUserId(),
                name: userData.name.trim(),
                username: userData.username.trim().toLowerCase(),
                password: userData.password,
                role: userData.role,
                team: userData.team || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Save user
            const saveResult = await this.saveUser(newUser);
            
            if (saveResult) {
                console.log('✅ User created successfully:', newUser.id);
                return {
                    success: true,
                    message: 'Usuário criado com sucesso!',
                    user: newUser
                };
            } else {
                return {
                    success: false,
                    message: 'Erro ao salvar usuário'
                };
            }
            
        } catch (error) {
            console.error('❌ Error creating user:', error);
            return {
                success: false,
                message: 'Erro interno do sistema'
            };
        }
    }

    // Update an existing user
    async updateUser(userId, userData) {
        try {
            console.log('✏️ Updating user:', userId);
            
            // Get existing user
            const existingUser = await this.getUser(userId);
            if (!existingUser) {
                return {
                    success: false,
                    message: 'Usuário não encontrado'
                };
            }
            
            // Check if new username conflicts with other users
            if (userData.username && userData.username !== existingUser.username) {
                const allUsers = await this.getAllUsers();
                const usernameExists = allUsers.some(user => 
                    user.id !== userId && user.username === userData.username
                );
                
                if (usernameExists) {
                    return {
                        success: false,
                        message: 'Nome de usuário já existe'
                    };
                }
            }
            
            // Update user data
            const updatedUser = {
                ...existingUser,
                ...userData,
                id: userId, // Ensure ID doesn't change
                updatedAt: new Date().toISOString()
            };
            
            // Save updated user
            const saveResult = await this.saveUser(updatedUser);
            
            if (saveResult) {
                console.log('✅ User updated successfully:', userId);
                return {
                    success: true,
                    message: 'Usuário atualizado com sucesso!',
                    user: updatedUser
                };
            } else {
                return {
                    success: false,
                    message: 'Erro ao salvar usuário'
                };
            }
            
        } catch (error) {
            console.error('❌ Error updating user:', error);
            return {
                success: false,
                message: 'Erro interno do sistema'
            };
        }
    }

    // Delete a user
    async deleteUser(userId) {
        try {
            console.log('🗑️ Deleting user:', userId);
            
            if (this.useFirebase && this.db) {
                // Delete from Firebase
                await this.db.collection(this.usersCollection).doc(userId).delete();
                console.log('✅ User deleted from Firebase');
            } else {
                // Delete from localStorage
                const users = this.getLocalUsers();
                delete users[userId];
                this.saveLocalUsers(users);
                console.log('✅ User deleted from localStorage');
            }
            
            return {
                success: true,
                message: 'Usuário excluído com sucesso!'
            };
            
        } catch (error) {
            console.error('❌ Error deleting user:', error);
            return {
                success: false,
                message: 'Erro ao excluir usuário'
            };
        }
    }

    // Get a single user by ID
    async getUser(userId) {
        try {
            if (this.useFirebase && this.db) {
                // Get from Firebase
                const doc = await this.db.collection(this.usersCollection).doc(userId).get();
                if (doc.exists) {
                    return { id: doc.id, ...doc.data() };
                }
                return null;
            } else {
                // Get from localStorage
                const users = this.getLocalUsers();
                return users[userId] || null;
            }
        } catch (error) {
            console.error('❌ Error getting user:', error);
            return null;
        }
    }

    // Get all users
    async getAllUsers() {
        try {
            if (this.useFirebase && this.db) {
                // Get from Firebase
                const snapshot = await this.db.collection(this.usersCollection).get();
                const users = [];
                
                snapshot.forEach(doc => {
                    users.push({ id: doc.id, ...doc.data() });
                });
                
                // Sort by creation date
                users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                return users;
            } else {
                // Get from localStorage
                const users = this.getLocalUsers();
                const usersArray = Object.values(users);
                
                // Sort by creation date
                usersArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                return usersArray;
            }
        } catch (error) {
            console.error('❌ Error getting all users:', error);
            return [];
        }
    }

    // Save user (Firebase or localStorage)
    async saveUser(user) {
        try {
            if (this.useFirebase && this.db) {
                // Save to Firebase
                await this.db.collection(this.usersCollection).doc(user.id).set(user);
                console.log('💾 User saved to Firebase:', user.id);
                return true;
            } else {
                // Save to localStorage
                const users = this.getLocalUsers();
                users[user.id] = user;
                this.saveLocalUsers(users);
                console.log('💾 User saved to localStorage:', user.id);
                return true;
            }
        } catch (error) {
            console.error('❌ Error saving user:', error);
            return false;
        }
    }

    // Get users from localStorage
    getLocalUsers() {
        try {
            const stored = localStorage.getItem(this.localStorageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('❌ Error loading local users:', error);
            return {};
        }
    }

    // Save users to localStorage
    saveLocalUsers(users) {
        try {
            localStorage.setItem(this.localStorageKey, JSON.stringify(users));
            return true;
        } catch (error) {
            console.error('❌ Error saving local users:', error);
            return false;
        }
    }

    // Validate user credentials (for login)
    async validateCredentials(username, password) {
        try {
            const users = await this.getAllUsers();
            const user = users.find(u => u.username === username.toLowerCase());
            
            if (!user) {
                return {
                    success: false,
                    message: 'Usuário não encontrado'
                };
            }
            
            if (user.password !== password) {
                return {
                    success: false,
                    message: 'Senha incorreta'
                };
            }
            
            return {
                success: true,
                user: user
            };
            
        } catch (error) {
            console.error('❌ Error validating credentials:', error);
            return {
                success: false,
                message: 'Erro interno do sistema'
            };
        }
    }

    // Get user by username (for login)
    async getUserByUsername(username) {
        try {
            const users = await this.getAllUsers();
            return users.find(u => u.username === username.toLowerCase()) || null;
        } catch (error) {
            console.error('❌ Error getting user by username:', error);
            return null;
        }
    }

    // Export users data (for backup)
    async exportUsers() {
        try {
            const users = await this.getAllUsers();
            const exportData = {
                exportDate: new Date().toISOString(),
                totalUsers: users.length,
                users: users
            };
            
            return exportData;
        } catch (error) {
            console.error('❌ Error exporting users:', error);
            return null;
        }
    }

    // Import users data (for restore)
    async importUsers(importData) {
        try {
            if (!importData.users || !Array.isArray(importData.users)) {
                return {
                    success: false,
                    message: 'Dados de importação inválidos'
                };
            }
            
            let importedCount = 0;
            let skippedCount = 0;
            
            for (const userData of importData.users) {
                // Check if user already exists
                const existingUser = await this.getUser(userData.id);
                if (existingUser) {
                    skippedCount++;
                    continue;
                }
                
                // Save user
                const saveResult = await this.saveUser(userData);
                if (saveResult) {
                    importedCount++;
                }
            }
            
            return {
                success: true,
                message: `Importação concluída: ${importedCount} usuários importados, ${skippedCount} ignorados`,
                imported: importedCount,
                skipped: skippedCount
            };
            
        } catch (error) {
            console.error('❌ Error importing users:', error);
            return {
                success: false,
                message: 'Erro durante a importação'
            };
        }
    }
}

// Export for use in other modules
window.UserManager = UserManager;