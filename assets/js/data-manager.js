// ========== DATA MANAGER - CONEXÃO COM PLANILHA GOOGLE ==========

class DataManager {
    constructor() {
        this.offlineData = this.loadOfflineData();
        this.cache = new Map();
    }

    // Carregar dados offline do localStorage
    loadOfflineData() {
        try {
            const data = localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY);
            return data ? JSON.parse(data) : this.getDefaultData();
        } catch (e) {
            console.error('Erro ao carregar dados offline:', e);
            return this.getDefaultData();
        }
    }

    // Dados padrão para modo offline
    getDefaultData() {
        return {
            users: [
                {
                    id: 1,
                    nome: 'Administrador',
                    email: 'admin@miv.com',
                    tipo: 'admin',
                    saldo: 1500,
                    acesso: 'aprovado',
                    workLink: '',
                    password: 'admin123'
                }
            ],
            music: this.getSampleMusic(),
            portfolio: [],
            transactions: [],
            lastUpdated: new Date().toISOString()
        };
    }

    // Música de exemplo para demonstração
    getSampleMusic() {
        return [
            {
                id: 1,
                titulo: "EVA",
                artista: "Elzo Henschell",
                genero: "ROCK",
                link_youtube: "https://www.youtube.com/watch?v=bFqLIyxuiMM",
                link_capa: "https://i.ytimg.com/vi/bFqLIyxuiMM/hqdefault.jpg",
                valor_acao: 15.50,
                percentual_disponivel: 25,
                acoes_vendidas: 75,
                status: "ativo",
                data_cadastro: new Date().toISOString()
            },
            {
                id: 2,
                titulo: "O Máximo",
                artista: "Elzo Henschell",
                genero: "ROCK",
                link_youtube: "https://youtu.be/utoRQzolfqs",
                link_capa: "https://i9.ytimg.com/vi_webp/utoRQzolfqs/mqdefault.webp",
                valor_acao: 22.00,
                percentual_disponivel: 40,
                acoes_vendidas: 60,
                status: "ativo",
                data_cadastro: new Date().toISOString()
            },
            {
                id: 3,
                titulo: "Elzo Henschell - Mares (Visualizer)",
                artista: "Selo MIV",
                genero: "INSTRUMENTAL",
                link_youtube: "https://youtu.be/ee_AZk-lq-Y",
                link_capa: "https://i9.ytimg.com/vi/ee_AZk-lq-Y/mqdefault.jpg",
                valor_acao: 18.75,
                percentual_disponivel: 35,
                acoes_vendidas: 65,
                status: "ativo",
                data_cadastro: new Date().toISOString()
            }
        ];
    }

    // Requisição principal com fallback
    async fetchWithFallback(action, params = {}) {
        const maxRetries = 2;
        let lastError;

        for (let i = 0; i < maxRetries; i++) {
            try {
                const result = await this.fetchFromAPI(action, params);
                return result;
            } catch (error) {
                lastError = error;
                console.warn(`Tentativa ${i + 1} falhou para ${action}:`, error);
                
                // Última tentativa: usar dados locais
                if (i === maxRetries - 1) {
                    const localData = this.getLocalData(action, params);
                    if (localData) {
                        state.offlineMode = true;
                        showToast('Modo offline ativado. Dados podem não estar atualizados.', 'warning');
                        return { success: true, data: localData, offline: true };
                    }
                }
                
                // Esperar antes de tentar novamente
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }

        throw lastError || new Error('Falha na requisição');
    }

    // Buscar dados da API do Google Apps Script
    async fetchFromAPI(action, params) {
        const formData = new URLSearchParams();
        formData.append('action', action);
        
        // Adicionar parâmetros
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                formData.append(key, params[key]);
            }
        });

        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Ação falhou na API');
        }

        // Normalizar dados da planilha
        if (result.data) {
            result.data = normalizeSheetData(result.data);
        }

        // Atualizar cache
        this.updateLocalCache(action, result.data, params);
        
        return result;
    }

    // Atualizar cache local
    updateLocalCache(action, data, params) {
        const cacheKey = `${action}_${JSON.stringify(params)}`;
        const cache = {
            data,
            timestamp: Date.now(),
            ttl: 5 * 60 * 1000 // 5 minutos
        };
        
        this.cache.set(cacheKey, cache);
        localStorage.setItem(`cache_${cacheKey}`, JSON.stringify(cache));
    }

    // Obter dados locais (cache ou offline)
    getLocalData(action, params) {
        try {
            // Tentar cache primeiro
            const cacheKey = `${action}_${JSON.stringify(params)}`;
            const cached = this.cache.get(cacheKey) || 
                         JSON.parse(localStorage.getItem(`cache_${cacheKey}`));
            
            if (cached) {
                const { data, timestamp, ttl } = cached;
                if (Date.now() - timestamp < ttl) {
                    return data;
                }
            }

            // Fallback para dados offline
            switch(action) {
                case 'get_musicas':
                    return this.offlineData.music;
                case 'get_carteira':
                    return this.offlineData.portfolio.filter(p => 
                        p.user_id === (params.user_id || state.currentUser?.id)
                    );
                case 'get_extrato':
                    return this.offlineData.transactions.filter(t => 
                        t.user_id === (params.user_id || state.currentUser?.id)
                    );
                case 'login':
                    return this.offlineData.users.find(u => 
                        u.email === params.email && u.password === params.password
                    );
                case 'get_artist_data':
                    return {
                        total_musicas: this.offlineData.music.filter(m => 
                            m.artista === state.currentUser?.nome
                        ).length,
                        total_royalties: 0,
                        total_acoes_vendidas: 0,
                        musicas: this.offlineData.music.filter(m => 
                            m.artista === state.currentUser?.nome
                        )
                    };
                default:
                    return null;
            }
        } catch (e) {
            console.error('Erro ao obter dados locais:', e);
            return null;
        }
    }

    // Salvar transação localmente para sincronização posterior
    saveTransaction(type, data) {
        const transaction = {
            id: Date.now(),
            type,
            data,
            timestamp: new Date().toISOString(),
            synced: false
        };
        
        this.offlineData.transactions.push(transaction);
        
        // Atualizar localStorage
        this.saveOfflineData();
        
        // Tentar sincronizar
        this.syncPendingTransactions();
        
        return transaction;
    }

    // Salvar dados offline
    saveOfflineData() {
        try {
            localStorage.setItem(CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(this.offlineData));
        } catch (e) {
            console.error('Erro ao salvar dados offline:', e);
        }
    }

    // Sincronizar transações pendentes
    async syncPendingTransactions() {
        if (!navigator.onLine) return;
        
        const pending = this.offlineData.transactions.filter(t => !t.synced);
        
        for (const transaction of pending) {
            try {
                await this.fetchFromAPI(transaction.type, transaction.data);
                transaction.synced = true;
                
                // Atualizar localStorage
                this.saveOfflineData();
            } catch (e) {
                console.error('Falha ao sincronizar transação:', e);
                break; // Parar se houver erro
            }
        }
    }

    // Buscar músicas
    async getMusicas() {
        return this.fetchWithFallback('get_musicas');
    }

    // Buscar carteira do usuário
    async getCarteira(userId) {
        return this.fetchWithFallback('get_carteira', { user_id: userId });
    }

    // Buscar extrato
    async getExtrato(userId) {
        return this.fetchWithFallback('get_extrato', { user_id: userId });
    }

    // Buscar saldo
    async getSaldo(userId) {
        return this.fetchWithFallback('get_saldo', { user_id: userId });
    }

    // Login
    async login(email, password) {
        return this.fetchWithFallback('login', { email, password });
    }

    // Registrar usuário
    async register(userData) {
        return this.fetchWithFallback('register', userData);
    }

    // Comprar ações
    async buyShares(purchaseData) {
        return this.fetchWithFallback('buy', purchaseData);
    }

    // Buscar dados do artista
    async getArtistData(userId) {
        return this.fetchWithFallback('get_artist_data', { user_id: userId });
    }

    // Upload de música
    async uploadMusic(musicData) {
        return this.fetchWithFallback('uploadMusic', musicData);
    }

    // Depositar saldo
    async deposit(depositData) {
        return this.fetchWithFallback('deposit', depositData);
    }
}

// Instanciar DataManager globalmente
const dataManager = new DataManager();
window.dataManager = dataManager;
