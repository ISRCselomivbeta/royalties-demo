/**
 * dataManager.js
 * Sistema de gerenciamento de dados e comunicação com API
 */

const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbwPHARLeQ-6j6D0dCnOgFQPyA_pzNsvqcJpU7OeTmYWTk3GN01KaT9BdGdpKtuTVXI/exec',
    LOCAL_STORAGE_KEY: 'selo_miv_data_v3',
    VERSION: '3.0.0'
};

class DataManager {
    constructor() {
        this.offlineData = this.loadOfflineData();
        this.pendingTransactions = [];
        this.syncInterval = null;
    }

    // ========== CACHE E OFFLINE ==========

    loadOfflineData() {
        try {
            const data = localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY);
            return data ? JSON.parse(data) : this.getDefaultData();
        } catch (e) {
            console.error('Erro ao carregar dados offline:', e);
            return this.getDefaultData();
        }
    }

    saveOfflineData() {
        try {
            localStorage.setItem(CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(this.offlineData));
        } catch (e) {
            console.error('Erro ao salvar dados offline:', e);
        }
    }

    getDefaultData() {
        const sampleMusic = [
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
                data_cadastro: new Date().toISOString(),
                total_investidores: 45,
                rentabilidade_media: 18.50
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
                data_cadastro: new Date().toISOString(),
                total_investidores: 32,
                rentabilidade_media: 26.00
            }
        ];

        return {
            users: [
                {
                    id: 1,
                    nome: 'Administrador',
                    email: 'admin@miv.com',
                    tipo: 'admin',
                    saldo: 1500,
                    acesso: 'aprovado',
                    favorite_music_ids: '1,2,3',
                    playlists: 'Minha Playlist',
                    total_investido: 1500
                }
            ],
            music: sampleMusic,
            portfolio: [],
            transactions: [],
            playlists: [],
            artist_data: [],
            lastUpdated: new Date().toISOString()
        };
    }

    // ========== GERENCIAMENTO DE USUÁRIO ==========

    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('miv_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            console.error('Erro ao obter usuário atual:', e);
            return null;
        }
    }

    setCurrentUser(user) {
        try {
            localStorage.setItem('miv_user', JSON.stringify(user));
        } catch (e) {
            console.error('Erro ao definir usuário:', e);
        }
    }

    clearUserSession() {
        localStorage.removeItem('miv_user');
        localStorage.removeItem('miv_session');
    }

    // ========== COMUNICAÇÃO COM API ==========

    async fetchWithFallback(action, params = {}) {
        const maxRetries = 2;
        let lastError;

        for (let i = 0; i < maxRetries; i++) {
            try {
                console.log(`[DataManager] Tentativa ${i + 1} para ação: ${action}`, params);
                
                const formData = new URLSearchParams();
                formData.append('action', action);
                
                Object.keys(params).forEach(key => {
                    if (params[key] !== undefined && params[key] !== null) {
                        formData.append(key, params[key].toString());
                    }
                });

                const response = await fetch(CONFIG.API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData,
                    mode: 'cors',
                    credentials: 'omit'
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();
                console.log(`[DataManager] Resposta para ${action}:`, result);
                
                if (result.success !== false) {
                    this.updateLocalCache(action, result.data || result, params);
                    return { success: true, data: result.data || result };
                } else {
                    throw new Error(result.message || `Ação ${action} falhou`);
                }
            } catch (error) {
                lastError = error;
                console.warn(`[DataManager] Tentativa ${i + 1} falhou para ${action}:`, error);
                
                if (i === maxRetries - 1) {
                    const localData = this.getLocalData(action, params);
                    if (localData) {
                        console.log(`[DataManager] Retornando dados locais para ${action}`);
                        return { 
                            success: true, 
                            data: localData, 
                            offline: true,
                            message: 'Modo offline - dados locais'
                        };
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }

        return { 
            success: false, 
            message: lastError?.message || 'Erro de conexão',
            offline: true 
        };
    }

    updateLocalCache(action, data, params) {
        try {
            const cacheKey = `${action}_${JSON.stringify(params)}`;
            const cache = {
                data,
                timestamp: Date.now(),
                ttl: 5 * 60 * 1000 // 5 minutos
            };
            localStorage.setItem(`cache_${cacheKey}`, JSON.stringify(cache));
        } catch (e) {
            console.error('Erro ao atualizar cache:', e);
        }
    }

    getLocalData(action, params) {
        try {
            // Tenta cache primeiro
            const cacheKey = `${action}_${JSON.stringify(params)}`;
            const cached = localStorage.getItem(`cache_${cacheKey}`);
            if (cached) {
                const { data, timestamp, ttl } = JSON.parse(cached);
                if (Date.now() - timestamp < ttl) {
                    return data;
                }
            }

            // Fallback para dados offline
            switch(action) {
                case 'get_musicas':
                    return this.offlineData.music || [];
                    
                case 'get_carteira':
                    return this.offlineData.portfolio.filter(p => 
                        p.user_id === (params.user_id || this.getCurrentUser()?.id)
                    );
                    
                case 'get_extrato':
                    return this.offlineData.transactions.filter(t => 
                        t.user_id === (params.user_id || this.getCurrentUser()?.id)
                    );
                    
                case 'login':
                    return this.offlineData.users.find(u => 
                        u.email === params.email && u.password === params.password
                    );
                    
                case 'get_user_playlists':
                    return this.offlineData.playlists.filter(p => 
                        p.user_id === (params.user_id || this.getCurrentUser()?.id)
                    );
                    
                case 'get_artist_data':
                    return this.offlineData.artist_data.find(a => 
                        a.user_id === (params.user_id || this.getCurrentUser()?.id)
                    ) || { musicas: [] };
                    
                default:
                    return null;
            }
        } catch (e) {
            console.error('Erro ao obter dados locais:', e);
            return null;
        }
    }

    // ========== OPERAÇÕES ESPECÍFICAS ==========

    async getArtistData(userId) {
        return this.fetchWithFallback('get_artist_data', { user_id: userId });
    }

    async uploadMusic(musicData) {
        const result = await this.fetchWithFallback('uploadMusic', musicData);
        
        if (result.success) {
            // Adiciona à lista offline
            const newMusic = {
                id: Date.now(),
                ...musicData,
                status: 'pendente',
                data_cadastro: new Date().toISOString(),
                acoes_vendidas: 0,
                arrecadacao_total: 0
            };
            
            this.offlineData.music.push(newMusic);
            this.saveOfflineData();
        }
        
        return result;
    }

    async buyInvestment(data) {
        const result = await this.fetchWithFallback('buy', data);
        
        if (result.success || result.offline) {
            // Registra localmente
            const transaction = {
                id: Date.now(),
                user_id: data.user_id,
                music_id: data.music_id,
                quantidade: data.quantidade,
                valor_total: data.valor_total,
                data_compra: new Date().toISOString(),
                status: result.offline ? 'pendente' : 'confirmado'
            };
            
            this.offlineData.portfolio.push(transaction);
            this.saveOfflineData();
            
            // Atualiza música
            const musicIndex = this.offlineData.music.findIndex(m => m.id == data.music_id);
            if (musicIndex >= 0) {
                const music = this.offlineData.music[musicIndex];
                const sharesSold = parseInt(music.acoes_vendidas || 0) + parseInt(data.quantidade);
                this.offlineData.music[musicIndex].acoes_vendidas = sharesSold;
                this.saveOfflineData();
            }
        }
        
        return result;
    }

    async deleteMusic(musicId) {
        return this.fetchWithFallback('delete_music', { music_id: musicId });
    }

    async favoriteMusic(data) {
        return this.fetchWithFallback('favorite_music', data);
    }

    async createPlaylist(data) {
        const result = await this.fetchWithFallback('create_playlist', data);
        
        if (result.success || result.offline) {
            const playlist = {
                id: Date.now(),
                ...data,
                music_ids: '',
                created_at: new Date().toISOString()
            };
            
            this.offlineData.playlists.push(playlist);
            this.saveOfflineData();
        }
        
        return result;
    }

    async requestWithdrawal(data) {
        return this.fetchWithFallback('request_withdrawal', data);
    }

    async generatePaymentLink(data) {
        return this.fetchWithFallback('generate_payment_link', data);
    }

    async getTopInvestments() {
        return this.fetchWithFallback('get_top_investments');
    }

    async getSaldo(userId) {
        const result = await this.fetchWithFallback('get_saldo', { user_id: userId });
        
        if (result.success || result.offline) {
            return {
                success: true,
                data: { saldo: result.data?.saldo || 0 }
            };
        }
        
        return result;
    }

    // ========== SINCRONIZAÇÃO ==========

    saveTransaction(type, data) {
        const transaction = {
            id: Date.now(),
            type,
            data,
            timestamp: new Date().toISOString(),
            synced: false
        };
        
        this.pendingTransactions.push(transaction);
        localStorage.setItem('pending_transactions', JSON.stringify(this.pendingTransactions));
        
        this.startSync();
    }

    startSync() {
        if (this.syncInterval) return;
        
        this.syncInterval = setInterval(async () => {
            await this.syncPendingTransactions();
        }, 30000); // Tenta sincronizar a cada 30 segundos
    }

    async syncPendingTransactions() {
        if (this.pendingTransactions.length === 0) return;
        
        const pending = [...this.pendingTransactions];
        
        for (const transaction of pending) {
            if (transaction.synced) continue;
            
            try {
                const result = await this.fetchWithFallback(transaction.type, transaction.data);
                
                if (result.success && !result.offline) {
                    transaction.synced = true;
                    
                    // Atualiza no array local
                    const index = this.pendingTransactions.findIndex(t => t.id === transaction.id);
                    if (index >= 0) {
                        this.pendingTransactions[index].synced = true;
                    }
                }
            } catch (e) {
                console.error('Erro ao sincronizar transação:', e);
            }
        }
        
        // Remove transações sincronizadas
        this.pendingTransactions = this.pendingTransactions.filter(t => !t.synced);
        localStorage.setItem('pending_transactions', JSON.stringify(this.pendingTransactions));
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
}

// Instância global
const dataManager = new DataManager();

// Inicia sincronização
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        dataManager.syncPendingTransactions();
    });
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.dataManager = dataManager;
}

export default dataManager;
