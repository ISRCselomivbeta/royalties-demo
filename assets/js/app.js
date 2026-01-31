/**
 * app.js
 * Núcleo da aplicação SELO MIV - Gerenciamento de estado e navegação
 */

class AppCore {
    constructor() {
        this.config = {
            API_URL: 'https://script.google.com/macros/s/AKfycbwPHARLeQ-6j6D0dCnOgFQPyA_pzNsvqcJpU7OeTmYWTk3GN01KaT9BdGdpKtuTVXI/exec',
            VERSION: '3.0.0',
            AUTO_REFRESH_INTERVAL: 30000,
            MERCADO_PAGO_LINK: 'https://link.mercadopago.com.br/selomiv'
        };

        this.state = {
            currentUser: null,
            userBalance: 0,
            playlist: [],
            portfolioAssets: [],
            ledgerData: [],
            topInvestments: [],
            userPlaylists: [],
            favoriteMusicIds: [],
            currentTrackIndex: -1,
            isPlaying: false,
            currentInvestTrack: null,
            currentVolume: 80,
            isShuffle: false,
            isRepeat: false,
            offlineMode: false,
            appInitialized: false,
            playerMinimized: false
        };

        this.init();
    }

    init() {
        this.bindGlobalEvents();
        this.restoreSession();
        this.setupRealTimeUpdates();
    }

    // ========== GERENCIAMENTO DE ESTADO ==========

    bindGlobalEvents() {
        // Teclas de atalho
        document.addEventListener('keydown', (e) => {
            // Espaço para play/pause
            if (e.code === 'Space' && !e.target.matches('input, textarea, select')) {
                e.preventDefault();
                if (window.togglePlay) window.togglePlay();
            }
            
            // Setas para navegação
            if (e.code === 'ArrowRight' && e.altKey) {
                if (window.playNext) window.playNext();
            }
            if (e.code === 'ArrowLeft' && e.altKey) {
                if (window.playPrevious) window.playPrevious();
            }
        });

        // Monitorar conexão
        window.addEventListener('online', () => this.handleOnlineStatus());
        window.addEventListener('offline', () => this.handleOfflineStatus());
    }

    restoreSession() {
        try {
            const savedUser = localStorage.getItem('miv_user');
            const savedSession = localStorage.getItem('miv_session');
            
            if (savedUser && savedSession) {
                this.state.currentUser = JSON.parse(savedUser);
                const sessionAge = Date.now() - parseInt(savedSession, 16);
                
                if (sessionAge < 24 * 60 * 60 * 1000) { // 24 horas
                    this.initializeApp();
                    return true;
                } else {
                    localStorage.removeItem('miv_user');
                    localStorage.removeItem('miv_session');
                    this.showToast('Sessão expirada. Faça login novamente.', 'warning');
                }
            }
        } catch (e) {
            console.error('Erro ao restaurar sessão:', e);
            localStorage.removeItem('miv_user');
            localStorage.removeItem('miv_session');
        }
        
        return false;
    }

    setupRealTimeUpdates() {
        // Atualizações automáticas
        setInterval(() => {
            if (this.state.currentUser && !this.state.offlineMode) {
                this.loadBalance(true);
            }
        }, this.config.AUTO_REFRESH_INTERVAL);

        // Atualização de horário
        setInterval(() => {
            this.updatePortfolioTime();
        }, 60000);
    }

    // ========== AUTENTICAÇÃO ==========

    async handleLogin(email, password) {
        if (!email || !password) {
            this.showToast('Preencha todos os campos', 'error');
            return false;
        }

        this.showLoading('Autenticando...');

        try {
            // Tenta login com DataManager
            const result = await dataManager.fetchWithFallback('login', { email, password });

            if (result.success && result.data) {
                this.state.currentUser = result.data;
                this.state.userBalance = result.data.saldo || 0;

                // Carrega favoritos
                if (this.state.currentUser.favorite_music_ids) {
                    this.state.favoriteMusicIds = this.state.currentUser.favorite_music_ids
                        .split(',')
                        .filter(id => id.trim() !== '');
                }

                // Salva sessão
                localStorage.setItem('miv_user', JSON.stringify(this.state.currentUser));
                localStorage.setItem('miv_session', Date.now().toString(16));

                this.showToast('Login realizado com sucesso!', 'success');
                this.initializeApp();
                return true;
            } else {
                // Modo de demonstração
                if (email === 'admin@miv.com' && password === 'admin123') {
                    this.state.currentUser = {
                        id: 1,
                        nome: 'Administrador',
                        email: 'admin@miv.com',
                        tipo: 'admin',
                        saldo: 1500,
                        acesso: 'aprovado',
                        favorite_music_ids: '1,2,3'
                    };
                    this.state.userBalance = 1500;
                    this.state.favoriteMusicIds = ['1', '2', '3'];

                    localStorage.setItem('miv_user', JSON.stringify(this.state.currentUser));
                    this.showToast('Modo de demonstração ativado', 'info');
                    this.initializeApp();
                    return true;
                }

                this.showToast(result.message || 'Credenciais inválidas', 'error');
                return false;
            }
        } catch (error) {
            console.error('Erro no login:', error);
            this.showToast('Erro de conexão. Tente novamente.', 'error');
            return false;
        } finally {
            this.hideLoading();
        }
    }

    async handleRegister(userData) {
        this.showLoading('Criando conta...');

        try {
            const result = await dataManager.fetchWithFallback('register', userData);

            if (result.success) {
                this.showToast('Conta criada com sucesso! Aguarde aprovação.', 'success');
                return true;
            } else {
                this.showToast(result.message || 'Erro ao criar conta', 'error');
                return false;
            }
        } catch (error) {
            console.error('Erro no registro:', error);
            this.showToast('Conta criada localmente. Será sincronizada quando online.', 'warning');
            return true; // Aceita registro offline
        } finally {
            this.hideLoading();
        }
    }

    logout() {
        if (confirm('Tem certeza que deseja sair?')) {
            // Limpa player
            if (window.musicPlayer?.cleanup) {
                window.musicPlayer.cleanup();
            }

            // Limpa sessão
            dataManager.clearUserSession();
            
            // Oculta player
            document.getElementById('playerBar').style.display = 'none';
            document.getElementById('mainApp').style.display = 'none';
            document.getElementById('authScreen').style.display = 'flex';
            
            // Mostra formulário de login
            this.showLoginForm();

            // Reseta estado
            this.state.currentUser = null;
            this.state.userBalance = 0;
            this.state.playlist = [];
            this.state.portfolioAssets = [];
            this.state.ledgerData = [];
            this.state.topInvestments = [];
            this.state.userPlaylists = [];
            this.state.favoriteMusicIds = [];
            this.state.currentTrackIndex = -1;
            this.state.isPlaying = false;
            this.state.offlineMode = false;
            this.state.appInitialized = false;
            this.state.playerMinimized = false;

            this.showToast('Logout realizado com sucesso', 'success');
        }
    }

    // ========== INICIALIZAÇÃO DO APP ==========

    initializeApp() {
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        this.updateUserInterface();
        this.loadAllData();
    }

    updateUserInterface() {
        if (!this.state.currentUser) return;
        
        // Atualiza badge do usuário
        const userBadge = document.getElementById('userBadge');
        if (userBadge) {
            const userType = this.state.currentUser.tipo || 'ouvinte';
            const badges = {
                'ouvinte': { text: 'Ouvinte', color: 'var(--neon-green)' },
                'artista': { text: 'Artista', color: '#007bff' },
                'admin': { text: 'Admin', color: '#ff3232' }
            };
            const badge = badges[userType] || badges.ouvinte;
            userBadge.textContent = badge.text;
            userBadge.style.background = badge.color;
        }
        
        // Mostra/oculta painel do artista
        const artistNavItem = document.getElementById('artistNavItem');
        if (artistNavItem) {
            const userType = this.state.currentUser.tipo || 'ouvinte';
            artistNavItem.style.display = (userType === 'artista' || userType === 'admin') ? 'block' : 'none';
        }
        
        this.updateBalanceDisplay();
    }

    async loadAllData() {
        this.showLoading('Carregando dados...');
        
        try {
            await Promise.allSettled([
                this.loadBalance(),
                this.loadMarketplace(),
                this.loadPortfolio(),
                this.loadLedger(),
                this.loadTopInvestments(),
                this.loadUserPlaylists(),
                (this.state.currentUser.tipo === 'artista' || this.state.currentUser.tipo === 'admin') ? 
                    this.loadArtistData() : Promise.resolve()
            ]);
            
            this.state.appInitialized = true;
            this.showToast('Sistema carregado com sucesso!', 'success');
            
            // Sincroniza pendências se offline
            if (this.state.offlineMode) {
                dataManager.syncPendingTransactions();
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showToast('Alguns dados podem não estar atualizados', 'warning');
        } finally {
            this.hideLoading();
        }
    }

    // ========== CARREGAMENTO DE DADOS ==========

    async loadBalance(silent = false) {
        if (!this.state.currentUser) return;
        
        if (!silent) this.showLoading('Carregando saldo...');
        
        try {
            const result = await dataManager.getSaldo(this.state.currentUser.id || this.state.currentUser.email);
            
            if (result.success && result.data) {
                this.state.userBalance = parseFloat(result.data.saldo) || 0;
                this.updateBalanceDisplay();
                
                if (result.offline) {
                    this.state.offlineMode = true;
                }
            }
        } catch (error) {
            console.error('Erro ao carregar saldo:', error);
        } finally {
            if (!silent) this.hideLoading();
        }
    }

    async loadMarketplace() {
        try {
            const result = await dataManager.fetchWithFallback('get_musicas');
            
            if (result.success && result.data) {
                this.state.playlist = result.data.filter(music => 
                    music && (music.status || '').toLowerCase() === 'ativo'
                ) || [];
                
                if (result.offline) {
                    this.state.offlineMode = true;
                }
            }
            
            this.renderMarketplace();
        } catch (error) {
            console.error('Erro ao carregar marketplace:', error);
            this.renderMarketplace();
        }
    }

    async loadPortfolio() {
        if (!this.state.currentUser) return;
        
        try {
            const result = await dataManager.fetchWithFallback('get_carteira', {
                user_id: this.state.currentUser.id || this.state.currentUser.email
            });
            
            if (result.success) {
                this.state.portfolioAssets = result.data || [];
                this.renderPortfolio();
            }
        } catch (error) {
            console.error('Erro ao carregar portfólio:', error);
            this.renderPortfolio();
        }
    }

    async loadLedger() {
        if (!this.state.currentUser) return;
        
        try {
            const result = await dataManager.fetchWithFallback('get_extrato', {
                user_id: this.state.currentUser.id || this.state.currentUser.email
            });
            
            if (result.success) {
                this.state.ledgerData = result.data || [];
                this.renderLedger();
            }
        } catch (error) {
            console.error('Erro ao carregar extrato:', error);
            this.renderLedger();
        }
    }

    async loadTopInvestments() {
        try {
            const result = await dataManager.fetchWithFallback('get_top_investments');
            
            if (result.success && result.data) {
                this.state.topInvestments = result.data;
                this.renderTopInvestments();
            }
        } catch (error) {
            console.error('Erro ao carregar top investimentos:', error);
            this.renderTopInvestments();
        }
    }

    async loadUserPlaylists() {
        if (!this.state.currentUser) return;
        
        try {
            const result = await dataManager.fetchWithFallback('get_user_playlists', {
                user_id: this.state.currentUser.id || this.state.currentUser.email
            });
            
            if (result.success) {
                this.state.userPlaylists = result.data || [];
                this.renderPlaylists();
                this.renderFavorites();
            }
        } catch (error) {
            console.error('Erro ao carregar playlists:', error);
            this.renderPlaylists();
            this.renderFavorites();
        }
    }

    // ========== RENDERIZAÇÃO ==========

    renderMarketplace() {
        // Esta função será implementada no arquivo específico
        if (window.renderMarketplace) {
            window.renderMarketplace();
        }
    }

    renderPortfolio() {
        if (window.renderPortfolio) {
            window.renderPortfolio();
        }
    }

    renderLedger() {
        if (window.renderLedger) {
            window.renderLedger();
        }
    }

    renderTopInvestments() {
        if (window.renderTopInvestments) {
            window.renderTopInvestments();
        }
    }

    renderPlaylists() {
        if (window.renderPlaylists) {
            window.renderPlaylists();
        }
    }

    renderFavorites() {
        if (window.renderFavorites) {
            window.renderFavorites();
        }
    }

    // ========== UTILITÁRIOS DE UI ==========

    updateBalanceDisplay() {
        const balanceElement = document.getElementById('currentBalance');
        if (balanceElement) {
            balanceElement.textContent = this.formatCurrency(this.state.userBalance);
            
            if (this.state.offlineMode) {
                balanceElement.innerHTML = `${this.formatCurrency(this.state.userBalance)} <small class="text-warning">(offline)</small>`;
            }
        }
    }

    updatePortfolioTime() {
        const updateEl = document.getElementById('portfolioUpdateTime');
        if (updateEl) {
            updateEl.textContent = `Atualizado: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        }
    }

    showLoading(message = 'Carregando...') {
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingMessage = document.getElementById('loadingMessage');
        
        if (loadingScreen) loadingScreen.style.display = 'flex';
        if (loadingMessage) loadingMessage.textContent = message;
    }

    hideLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) loadingScreen.style.display = 'none';
    }

    showToast(message, type = 'success', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) {
            console.log(`[${type.toUpperCase()}] ${message}`);
            return;
        }

        const toast = document.createElement('div');
        const toastId = 'toast_' + Date.now();
        
        toast.id = toastId;
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="bi ${this.getToastIcon(type)} toast-icon"></i>
            <div class="toast-message">${message}</div>
            <button class="btn btn-sm btn-link text-white p-0" onclick="dismissToast('${toastId}')">
                <i class="bi bi-x"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        if (duration > 0) {
            setTimeout(() => {
                this.dismissToast(toastId);
            }, duration);
        }
    }

    getToastIcon(type) {
        const icons = {
            'success': 'bi-check-circle',
            'error': 'bi-exclamation-circle',
            'warning': 'bi-exclamation-triangle',
            'info': 'bi-info-circle'
        };
        return icons[type] || 'bi-info-circle';
    }

    dismissToast(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    showLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
    }

    showRegisterForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
    }

    toggleArtistField() {
        const type = document.getElementById('registerType')?.value;
        const field = document.getElementById('artistLinkField');
        if (field) {
            field.style.display = type === 'artista' ? 'block' : 'none';
        }
    }

    // ========== NAVEGAÇÃO ==========

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
    }

    changeSection(sectionId) {
        // Oculta todas as seções
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Mostra a seção selecionada
        const sectionElement = document.getElementById(`${sectionId}Section`);
        if (sectionElement) {
            sectionElement.classList.add('active');
        }
        
        // Atualiza navegação
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('onclick')?.includes(sectionId)) {
                link.classList.add('active');
            }
        });
        
        // Fecha sidebar no mobile
        if (window.innerWidth < 768) {
            this.toggleSidebar();
        }
        
        // Atualiza título
        const titles = {
            'marketplace': 'Marketplace',
            'portfolio': 'Portfólio',
            'ledger': 'Extrato',
            'investments': 'Melhores Investimentos',
            'playlists': 'Playlists',
            'artist': 'Painel Artista'
        };
        document.title = `SELO MIV | ${titles[sectionId] || 'Fintech Musical'}`;
    }

    // ========== MANIPULAÇÃO DE OFFLINE ==========

    handleOnlineStatus() {
        if (this.state.offlineMode) {
            this.state.offlineMode = false;
            this.showToast('Conexão restaurada. Sincronizando dados...', 'success');
            dataManager.syncPendingTransactions();
            this.loadAllData();
        }
    }

    handleOfflineStatus() {
        this.state.offlineMode = true;
        this.showToast('Modo offline ativado', 'warning');
    }

    // ========== UTILITÁRIOS ==========

    formatCurrency(value) {
        if (value === null || value === undefined || isNaN(value)) value = 0;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number(value));
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) return 'Agora mesmo';
            if (diffMins < 60) return `Há ${diffMins} min`;
            if (diffHours < 24) return `Há ${diffHours} h`;
            if (diffDays === 1) return 'Ontem';
            if (diffDays < 7) return `Há ${diffDays} dias`;
            
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Instância global da aplicação
const app = new AppCore();

// Exportar funções globais
window.handleLogin = () => {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value.trim();
    if (email && password) {
        app.handleLogin(email, password);
    }
};

window.handleRegister = () => {
    const name = document.getElementById('registerName')?.value.trim();
    const email = document.getElementById('registerEmail')?.value.trim();
    const password = document.getElementById('registerPassword')?.value.trim();
    const type = document.getElementById('registerType')?.value;
    const link = document.getElementById('registerLink')?.value.trim() || '';
    
    if (name && email && password && type) {
        app.handleRegister({ nome: name, email, password, tipo: type, workLink: link });
    }
};

window.showRegisterForm = () => app.showRegisterForm();
window.showLoginForm = () => app.showLoginForm();
window.toggleArtistField = () => app.toggleArtistField();
window.logout = () => app.logout();
window.toggleSidebar = () => app.toggleSidebar();
window.changeSection = (sectionId) => app.changeSection(sectionId);
window.showLoading = (message) => app.showLoading(message);
window.hideLoading = () => app.hideLoading();
window.showToast = (message, type, duration) => app.showToast(message, type, duration);
window.dismissToast = (toastId) => app.dismissToast(toastId);
window.showModal = (modalId) => app.showModal(modalId);
window.closeModal = (modalId) => app.closeModal(modalId);

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log(`SELO MIV v${app.config.VERSION} inicializado`);
    
    // Configura eventos de teclado nos inputs
    document.getElementById('loginPassword')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    document.getElementById('registerPassword')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleRegister();
    });
    
    // Validação de email
    ['loginEmail', 'registerEmail'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', (e) => {
            const email = e.target.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (email && !emailRegex.test(email)) {
                e.target.classList.add('is-invalid');
            } else {
                e.target.classList.remove('is-invalid');
            }
        });
    });
});

// Exportar estado global
window.state = app.state;

export default app;
