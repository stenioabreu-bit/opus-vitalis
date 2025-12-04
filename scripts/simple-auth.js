// Sistema de autenticação ultra simples e direto
class SimpleAuth {
    static SESSION_KEY = 'opus_vitalis_session';
    
    // Fazer login
    static login(username, password) {
        console.log('Tentativa de login:', { username, password });
        
        // Usuários hardcoded para funcionar sempre
        const users = {
            'bella_evans': { id: 'user_002', username: 'bella_evans', password: 'sc2016', name: 'Bella Evans', role: 'leader' },
            'tao_feng': { id: 'user_003', username: 'tao_feng', password: 'raiva', name: 'Tao Feng', role: 'agent' },
            "jhonny_d'angelo": { id: 'user_004', username: "jhonny_d'angelo", password: 'impulsivo', name: "Jhonny D'Angelo", role: 'agent' },
            'melissa_kardelis': { id: 'user_005', username: 'melissa_kardelis', password: 'conceito', name: 'Melissa Kardelis', role: 'agent' },
            'adonis_belinski': { id: 'user_006', username: 'adonis_belinski', password: 'ambição', name: 'Adonis Belinski', role: 'leader' },
            'miguel_crozier': { id: 'user_007', username: 'miguel_crozier', password: 'inovação', name: 'Miguel Crozier', role: 'agent' }
        };
        
        const user = users[username.toLowerCase()];
        console.log('Usuário encontrado:', user);
        
        if (user && user.password === password) {
            console.log('Login válido, salvando sessão...');
            // Salvar sessão
            localStorage.setItem(this.SESSION_KEY, JSON.stringify({
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                loginTime: Date.now()
            }));
            console.log('Sessão salva com sucesso');
            return { success: true, user: user };
        }
        
        console.log('Login inválido');
        return { success: false, message: 'Usuário ou senha inválidos' };
    }
    
    // Verificar se está logado
    static isLoggedIn() {
        try {
            const session = localStorage.getItem(this.SESSION_KEY);
            return session !== null;
        } catch {
            return false;
        }
    }
    
    // Pegar usuário atual
    static getCurrentUser() {
        try {
            const session = localStorage.getItem(this.SESSION_KEY);
            return session ? JSON.parse(session) : null;
        } catch {
            return null;
        }
    }
    
    // Fazer logout
    static logout() {
        try {
            localStorage.removeItem(this.SESSION_KEY);
            // Limpar outros dados se necessário
            localStorage.removeItem('opus_vitalis_reports');
            localStorage.removeItem('opus_vitalis_notifications');
            console.log('Logout realizado com sucesso');
            return true;
        } catch (error) {
            console.error('Erro no logout:', error);
            return false;
        }
    }
    
    // Forçar redirecionamento para login
    static forceLogin() {
        window.location.href = 'login.html';
    }
    
    // Verificar sessão e redirecionar se necessário
    static requireAuth() {
        if (!this.isLoggedIn()) {
            this.forceLogin();
            return false;
        }
        return true;
    }
}

window.SimpleAuth = SimpleAuth;