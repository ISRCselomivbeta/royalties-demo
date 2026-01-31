// ========== SISTEMA DE AUTENTICAÇÃO ==========

// Toggle entre login e registro
function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('artistLinkField').style.display = 'none';
}

function showLoginForm() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

// Mostrar/ocultar campo de link para artistas
function toggleArtistField() {
    const type = document.getElementById('registerType').value;
    const field = document.getElementById('artistLinkField');
    field.style.display = type === 'artista' ? 'block' : 'none';
}

// Login
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const loginBtn = document.getElementById('loginBtn');

    if (!email || !password) {
        showToast('Preencha todos os campos', 'error');
        return;
    }

    if (!validateEmailField(document.getElementById('loginEmail'))) {
        showToast('Digite um e-mail válido', 'error');
        return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Autenticando...';
    showLoading('Autenticando...');

    try {
        const result = await dataManager.login(email, password);

        if (result.success && result.data) {
            // Sucesso no login
            state.currentUser = result.data;
            state.userBalance = parseFloat(result.data.saldo) || 0;
            
            // Salvar sessão
            localStorage.setItem('miv_user', JSON.stringify(state.currentUser));
            localStorage.setItem('miv_session', Date.now().toString());
            
            showToast('Login realizado com sucesso!', 'success');
            
            // Limpar campos
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
            
            // Inicializar app
            initializeApp();
        } else {
            showToast(result.message || 'Credenciais inválidas', 'error');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        
        // Modo de demonstração (fallback)
        if (email === 'admin@miv.com' && password === 'admin123') {
            state.currentUser = {
                id: 1,
                nome: 'Administrador',
                email: 'admin@miv.com',
                tipo: 'admin',
                saldo: 1500,
                acesso: 'aprovado'
            };
            state.userBalance = 1500;
            
            localStorage.setItem('miv_user', JSON.stringify(state.currentUser));
            showToast('Modo de demonstração ativado', 'info');
            initializeApp();
        } else {
            showToast('Erro de conexão. Tente novamente.', 'error');
        }
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Entrar';
        hideLoading();
    }
}

// Registro
async function handleRegister() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const type = document.getElementById('registerType').value;
    const link = document.getElementById('registerLink')?.value.trim() || '';
    const registerBtn = document.getElementById('registerBtn');

    // Validações
    if (!name || !email || !password || !type) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('A senha deve ter no mínimo 6 caracteres', 'error');
        return;
    }

    if (!validateEmailField(document.getElementById('registerEmail'))) {
        showToast('Digite um e-mail válido', 'error');
        return;
    }

    registerBtn.disabled = true;
    registerBtn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Criando...';
    showLoading('Criando conta...');

    try {
        const result = await dataManager.register({
            nome: name,
            email: email,
            password: password,
            tipo: type,
            workLink: link
        });

        if (result.success) {
            showToast('Conta criada com sucesso! Aguarde aprovação.', 'success');
            
            // Limpar campos e voltar para login
            document.getElementById('registerName').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('registerType').value = '';
            document.getElementById('registerLink').value = '';
            
            showLoginForm();
        } else {
            showToast(result.message || 'Erro ao criar conta', 'error');
        }
    } catch (error) {
        console.error('Erro no registro:', error);
        
        // Fallback: salvar localmente
        const userId = Date.now();
        const newUser = {
            id: userId,
            nome: name,
            email: email,
            tipo: type,
            saldo: 0,
            acesso: 'pendente',
            workLink: link,
            password: password
        };
        
        dataManager.offlineData.users.push(newUser);
        dataManager.saveOfflineData();
        
        showToast('Conta criada localmente. Será sincronizada quando online.', 'warning');
        showLoginForm();
    } finally {
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<i class="bi bi-person-plus"></i> Solicitar Cadastro';
        hideLoading();
    }
}

// Logout
function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        // Limpar player
        cleanupPlayer();
        
        // Pausar música se estiver tocando
        if (window.youtubePlayer && state.isPlaying) {
            window.youtubePlayer.pauseVideo();
        }
        
        // Limpar dados da sessão
        localStorage.removeItem('miv_user');
        localStorage.removeItem('miv_session');
        
        // Esconder app e mostrar auth
        document.getElementById('playerBar').style.display = 'none';
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('authScreen').style.display = 'flex';
        
        // Voltar para formulário de login
        showLoginForm();
        
        // Resetar estado
        state.currentUser = null;
        state.userBalance = 0;
        state.playlist = [];
        state.portfolioAssets = [];
        state.ledgerData = [];
        state.currentTrackIndex = -1;
        state.isPlaying = false;
        state.offlineMode = false;
        state.appInitialized = false;
        
        showToast('Logout realizado com sucesso', 'success');
    }
}

// Atualizar interface do usuário
function updateUserInterface() {
    if (!state.currentUser) return;
    
    // Badge do usuário
    const userBadge = document.getElementById('userBadge');
    if (userBadge) {
        const userType = state.currentUser.tipo || 'ouvinte';
        const badges = {
            'ouvinte': { text: 'Ouvinte', color: 'var(--neon-green)' },
            'artista': { text: 'Artista', color: '#007bff' },
            'admin': { text: 'Admin', color: '#ff3232' }
        };
        const badge = badges[userType] || badges.ouvinte;
        userBadge.textContent = badge.text;
        userBadge.style.background = badge.color;
    }
    
    // Item de navegação do artista
    const artistNavItem = document.getElementById('artistNavItem');
    if (artistNavItem) {
        const userType = state.currentUser.tipo || 'ouvinte';
        artistNavItem.style.display = (userType === 'artista' || userType === 'admin') ? 'block' : 'none';
    }
    
    // Atualizar saldo
    updateBalanceDisplay();
}

// Exportar funções para uso global
window.showRegisterForm = showRegisterForm;
window.showLoginForm = showLoginForm;
window.toggleArtistField = toggleArtistField;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;
window.updateUserInterface = updateUserInterface;
